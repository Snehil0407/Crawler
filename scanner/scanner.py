import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import time
from typing import Set, List, Dict, Any
import json
from concurrent.futures import ThreadPoolExecutor
import re
from .logger import ScannerLogger
from .config import ScannerConfig
from .stats import ScanStats
from .utils import (
    normalize_url, is_valid_url, get_base_url, is_same_domain,
    extract_links, extract_forms, generate_hash, parse_cookies,
    format_timestamp, save_json, get_response_time, is_error_response,
    get_error_type, extract_headers, is_vulnerable_to_xss,
    is_vulnerable_to_sql_injection
)
import os
import uuid

# Import OWASP Top 10 scanner modules
try:
    from .broken_access import check_access_control
    from .crypto_failures import check_cryptographic_failures
    from .insecure_design import check_insecure_design
    from .security_misconfiguration import check_security_misconfiguration
    from .vulnerable_components import check_vulnerable_components
    from .auth_failures import check_authentication_failures
    from .integrity_failures import check_integrity_failures
    from .logging_monitoring import check_logging_monitoring
    from .ssrf import check_ssrf
    HAS_OWASP_SCANNERS = True
except ImportError:
    HAS_OWASP_SCANNERS = False
    print("OWASP scanner modules not available, some checks will be skipped")

# Import Firebase module
try:
    from .scanner_firebase import ScannerFirebase
    HAS_FIREBASE = True
except ImportError:
    HAS_FIREBASE = False
    print("Firebase service not available, falling back to local storage")

class Scanner:
    def __init__(self, config: ScannerConfig = None):
        # Initialize with default config if none provided
        self.config = config if config is not None else ScannerConfig()
        
        # Ensure log file path is set
        if not self.config.get('log_file'):
            self.config.set('log_file', 'scanner.log')
        
        # Initialize logger with configured log file
        self.logger = ScannerLogger(self.config.get('log_file'))
        
        # Initialize stats
        self.stats = ScanStats()
        self.visited_urls: Set[str] = set()
        self.vulnerabilities: List[Dict[str, Any]] = []
        self.scanned_links: List[Dict[str, Any]] = []
        self.scanned_forms: List[Dict[str, Any]] = []
        
        # Configure OWASP scan options with defaults
        if 'scan_broken_access' not in self.config.get_all():
            self.config.set('scan_broken_access', True)
        if 'scan_crypto_failures' not in self.config.get_all():
            self.config.set('scan_crypto_failures', True)
        if 'scan_insecure_design' not in self.config.get_all():
            self.config.set('scan_insecure_design', True)
        if 'scan_security_misconfigurations' not in self.config.get_all():
            self.config.set('scan_security_misconfigurations', True)
        if 'scan_vulnerable_components' not in self.config.get_all():
            self.config.set('scan_vulnerable_components', True)
        if 'scan_auth_failures' not in self.config.get_all():
            self.config.set('scan_auth_failures', True)
        if 'scan_integrity_failures' not in self.config.get_all():
            self.config.set('scan_integrity_failures', True)
        if 'scan_logging_monitoring' not in self.config.get_all():
            self.config.set('scan_logging_monitoring', True)
        if 'scan_ssrf' not in self.config.get_all():
            self.config.set('scan_ssrf', True)
        
        # Initialize Firebase
        self.firebase = None
        self.scan_id = None
        if HAS_FIREBASE:
            try:
                self.firebase = ScannerFirebase()
                if not self.firebase.is_initialized():
                    self.logger.error("Failed to initialize Firebase")
            except Exception as e:
                self.logger.error(f"Failed to initialize Firebase: {str(e)}")
        
        # Configure session
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': self.config.get('user_agent')
        })
        
        if self.config.get('use_proxy'):
            self.session.proxies = {
                'http': self.config.get('proxy_url'),
                'https': self.config.get('proxy_url')
            }
    
    def _check_broken_access_control(self, start_url: str):
        """Check for broken access control vulnerabilities (A01)"""
        if not HAS_OWASP_SCANNERS or not self.config.get('scan_broken_access', True):
            return
            
        self.logger.info("Starting broken access control scan")
        try:
            access_vulns = check_access_control(start_url, self.session, self.logger.info)
            for vuln in access_vulns:
                self._add_vulnerability(vuln['type'], vuln['url'], vuln['details'])
        except Exception as e:
            self.logger.error(f"Error in broken access control scan: {str(e)}")
    
    def start_scan(self, start_url: str, scan_id: str = None):
        """Start the scanning process"""
        self.logger.scan_start(start_url)
        self.stats = ScanStats()  # Reset stats
        self.vulnerabilities = []  # Reset vulnerabilities
        self.scanned_links = []    # Reset scanned links
        self.scanned_forms = []    # Reset scanned forms
        
        # Set scan ID for Firebase or generate one if none provided
        self.scan_id = scan_id if scan_id else str(uuid.uuid4())
        
        try:
            # Check for broken access control vulnerabilities first
            self._check_broken_access_control(start_url)
            
            # Proceed with regular scanning
            self._scan_url(start_url, depth=0)
            self.stats.complete()
            self._save_results()
            self.logger.scan_complete(self.stats.get_summary())
            return self.scan_id
        except Exception as e:
            self.logger.error(f"Scan failed: {str(e)}")
            raise
    
    def _scan_url(self, url: str, depth: int):
        """Scan a single URL"""
        if depth > self.config.get('max_depth'):
            return
        
        if len(self.visited_urls) >= self.config.get('max_pages'):
            return        
        url = normalize_url(url)
        if url in self.visited_urls:
            return
        
        self.visited_urls.add(url)
        self.stats.add_url(url)
        self.logger.info(f"Scanning: {url}")
        
        try:
            response = self._make_request(url)
            if response is None:
                return
            
            # Update stats
            response_time = get_response_time(response)
            self.stats.add_response(response.status_code, response_time)
            
            if is_error_response(response):
                error_type = get_error_type(response)
                self.stats.add_error(error_type)
                self.logger.error(f"Error {response.status_code} for {url}")
                return
            
            # Scan for URL parameter XSS vulnerabilities
            if self.config.get('scan_xss', True):
                self._scan_url_params_for_xss(url)
            
            # Extract and scan forms
            if self.config.get('scan_forms'):
                forms = extract_forms(response.text, url)
                for form in forms:
                    form_data = {
                        'url': url,
                        'action': form['action'],
                        'method': form['method'],
                        'inputs': form['inputs'],
                        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
                    }
                    self.scanned_forms.append(form_data)
                    self.logger.form_found(form)
                    self._scan_form(form, url)
            
            # Extract and scan links
            if self.config.get('scan_links'):
                links = extract_links(response.text, url)
                for link in links:
                    link_data = {
                        'source_url': url,
                        'target_url': link,
                        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')                    }
                    self.scanned_links.append(link_data)
                    self.logger.link_found(link)
                    if is_same_domain(link, url):
                        self._scan_url(link, depth + 1)            # Check security headers
            if self.config.get('scan_headers'):
                headers_result = extract_headers(response)
                missing_headers = headers_result['missing']
                
                if missing_headers:
                    # Report each missing header as a separate vulnerability
                    for header, info in missing_headers.items():
                        vuln_type = f"missing_{header.lower().replace('-', '_')}"
                        self._add_vulnerability(vuln_type, url, {
                            'description': f"Missing {header}: {info['description']}",
                            'recommendation': f"Implement the {header} header to improve security",
                            'severity': 'Medium',
                            'header_name': header,
                            'header_description': info['description'],
                            'consequences': info['consequences']
                        })
            
            # Check for cryptographic failures (A02)
            if HAS_OWASP_SCANNERS and self.config.get('scan_crypto_failures', True):
                crypto_vulns = check_cryptographic_failures(url, response, self.logger.info)
                for vuln in crypto_vulns:
                    self._add_vulnerability(vuln['type'], url, vuln['details'])
            
            # Check for security misconfigurations (A05)
            if HAS_OWASP_SCANNERS and self.config.get('scan_security_misconfigurations', True):
                misconfig_vulns = check_security_misconfiguration(url, response, self.logger.info)
                for vuln in misconfig_vulns:
                    self._add_vulnerability(vuln['type'], url, vuln['details'])
            
            # Check for vulnerable components (A06)
            if HAS_OWASP_SCANNERS and self.config.get('scan_vulnerable_components', True):
                component_vulns = check_vulnerable_components(url, response, self.logger.info)
                for vuln in component_vulns:
                    self._add_vulnerability(vuln['type'], url, vuln['details'])
            
            # Check for authentication failures (A07)
            if HAS_OWASP_SCANNERS and self.config.get('scan_auth_failures', True):
                auth_vulns = check_authentication_failures(url, response, self.logger.info)
                for vuln in auth_vulns:
                    self._add_vulnerability(vuln['type'], url, vuln['details'])
            
            # Check for software and data integrity failures (A08)
            if HAS_OWASP_SCANNERS and self.config.get('scan_integrity_failures', True):
                integrity_vulns = check_integrity_failures(url, response, self.logger.info)
                for vuln in integrity_vulns:
                    self._add_vulnerability(vuln['type'], url, vuln['details'])
            
            # Check for security logging and monitoring failures (A09)
            if HAS_OWASP_SCANNERS and self.config.get('scan_logging_monitoring', True):
                logging_vulns = check_logging_monitoring(url, response, self.session, self.logger.info)
                for vuln in logging_vulns:
                    self._add_vulnerability(vuln['type'], url, vuln['details'])
            
            # Check for SSRF vulnerabilities (A10)
            if HAS_OWASP_SCANNERS and self.config.get('scan_ssrf', True):
                ssrf_vulns = check_ssrf(url, response, self.session, self.logger.info)
                for vuln in ssrf_vulns:
                    self._add_vulnerability(vuln['type'], url, vuln['details'])
            
            # Rate limiting
            if self.config.get('rate_limit') > 0:
                time.sleep(1 / self.config.get('rate_limit'))
            
        except Exception as e:
            self.logger.error(f"Error scanning {url}: {str(e)}")
            self.stats.add_error('request_error')
    
    def _add_vulnerability(self, vuln_type: str, url: str, details: Dict[str, Any]):
        """Add a vulnerability to the list"""
        vuln_data = {
            'type': vuln_type,
            'url': url,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'details': details,
            'file': self._get_file_from_url(url)
        }
        self.vulnerabilities.append(vuln_data)
        self.stats.add_vulnerability(vuln_type, url, vuln_data)
        self.logger.vulnerability_found(vuln_data)
    
    def _get_file_from_url(self, url: str) -> str:
        """Extract file name from URL"""
        parsed = urlparse(url)
        path = parsed.path
        if path.endswith('/'):
            return 'index.html'
        return os.path.basename(path) or 'index.html'
    
    def _scan_form(self, form: Dict[str, Any], url: str):
        """Scan a form for vulnerabilities"""
        if not form['inputs']:
            return
        
        # Test SQL injection
        for payload in self.config.get('sql_payloads'):
            data = {}
            for input_field in form['inputs']:
                if input_field['type'] not in ['submit', 'button', 'image']:
                    data[input_field['name']] = payload
            
            try:
                if form['method'] == 'get':
                    response = self.session.get(form['action'], params=data)
                else:
                    response = self.session.post(form['action'], data=data)
                
                if is_vulnerable_to_sql_injection(response, payload):                    self._add_vulnerability('sql_injection', url, {
                        'form': form,
                        'payload': payload,
                        'method': form['method'],
                        'description': 'SQL injection vulnerability detected',
                        'severity': 'High',
                        'recommendation': 'Use parameterized queries and input validation',
                        'input_field': input_field['name'],
                        'consequences': 'Without proper input validation, attackers could inject malicious SQL commands that might access, modify, or delete data in your database. This could lead to unauthorized access, data theft, data loss, or complete system compromise.'
                    })
            
            except Exception as e:
                self.logger.error(f"Error testing SQL injection: {str(e)}")
        
        # Check for insecure design (A04)
        if HAS_OWASP_SCANNERS and self.config.get('scan_insecure_design', True):
            try:
                # Get the response with the form
                form_url = form['action'] if form['action'].startswith('http') else urljoin(url, form['action'])
                form_response = self.session.get(form_url, timeout=self.config.get('request_timeout'))
                
                insecure_design_vulns = check_insecure_design(url, form, form_response, self.session, self.logger.info)
                for vuln in insecure_design_vulns:
                    self._add_vulnerability(vuln['type'], url, vuln['details'])
            except Exception as e:
                self.logger.error(f"Error checking insecure design: {str(e)}")
          
        # Test XSS
        try:
            # Import advanced XSS scanner functionality
            from .xss_scanner import get_xss_details, XSS_PAYLOADS
            xss_payloads = XSS_PAYLOADS
        except ImportError:
            xss_payloads = self.config.get('xss_payloads')
            
        for payload in xss_payloads:
            data = {}
            for input_field in form['inputs']:
                if input_field['type'] not in ['submit', 'button', 'image']:
                    data[input_field['name']] = payload
            
            try:
                if form['method'] == 'get':
                    response = self.session.get(form['action'], params=data)
                else:
                    response = self.session.post(form['action'], data=data)
                
                if is_vulnerable_to_xss(response, payload):
                    # Use enhanced XSS details if available
                    try:
                        xss_details = get_xss_details(response, payload, input_field['name'])
                        details = {
                            'form': form,
                            'payload': payload,
                            'method': form['method'],
                            'input_field': input_field['name'],
                            'description': xss_details['description'],
                            'severity': xss_details['severity'],
                            'recommendation': xss_details['recommendation'],
                            'consequences': xss_details['consequences']
                        }
                        
                        # Add optional fields if present
                        if 'parameter' in xss_details:
                            details['parameter'] = xss_details['parameter']
                        if 'xss_type' in xss_details:
                            details['xss_type'] = xss_details['xss_type']
                            
                    except (ImportError, NameError):
                        # Fallback to basic details
                        details = {
                            'form': form,
                            'payload': payload,
                            'method': form['method'],
                            'description': 'Cross-site scripting (XSS) vulnerability detected',
                            'severity': 'High',
                            'recommendation': 'Implement proper output encoding and input validation',
                            'input_field': input_field['name'],
                            'consequences': 'Without proper output encoding, attackers could inject malicious JavaScript code into your website that would execute in users\' browsers. This could allow theft of session cookies, credentials, or personal information, redirecting users to malicious sites, or defacing your website.'
                        }
                    
                    self._add_vulnerability('xss', url, details)
                    break  # Found vulnerability in this form, move to next form
            
            except Exception as e:
                self.logger.error(f"Error testing XSS: {str(e)}")
    
    def _scan_url_params_for_xss(self, url: str):
        """Scan URL parameters for XSS vulnerabilities"""
        try:
            # Import URL parameter scanning function if available
            from .xss_scanner import scan_url_parameters, analyze_xss_vulnerability
            
            # Scan URL parameters
            vulnerabilities = scan_url_parameters(url, self.session)
            
            # Process detected vulnerabilities
            for vuln in vulnerabilities:
                # Get detailed analysis
                details = analyze_xss_vulnerability(vuln)
                
                # Add vulnerability to results
                self._add_vulnerability('reflected_xss', url, details)
                
        except ImportError:
            # Skip advanced URL parameter scanning if the module isn't available
            pass
    
    def _make_request(self, url: str) -> requests.Response:
        """Make HTTP request with retries"""
        for attempt in range(self.config.get('max_retries')):
            try:
                response = self.session.get(
                    url,
                    timeout=self.config.get('request_timeout'),
                    verify=self.config.get('verify_ssl'),
                    allow_redirects=self.config.get('follow_redirects')
                )
                return response
            except requests.RequestException as e:
                self.logger.error(f"Request failed (attempt {attempt + 1}): {str(e)}")
                if attempt == self.config.get('max_retries') - 1:
                    return None
                time.sleep(self.config.get('scan_delay'))
    
    def _save_results(self):
        """Save scan results"""
        # First save results to Firebase if available
        if HAS_FIREBASE and self.firebase and self.firebase.is_initialized():
            results = self.get_results()
            try:
                firebase_result = self.firebase.save_scan_results(self.scan_id, results, self.logger)
                if firebase_result and firebase_result.get('success'):
                    self.logger.info(f"Results saved to Firebase with scan ID: {self.scan_id}")
                else:
                    self.logger.error(f"Failed to save results to Firebase: {firebase_result.get('message')}")
                    # Fall back to local storage if Firebase save fails
                    self._save_local_results()
            except Exception as e:
                self.logger.error(f"Error saving to Firebase: {str(e)}")
                # Fall back to local storage on exception
                self._save_local_results()
        else:
            # Use local storage if Firebase is not available
            self._save_local_results()
    
    def _save_local_results(self):
        """Save scan results to local files"""
        output_dir = self.config.get('output_dir')
        os.makedirs(output_dir, exist_ok=True)
        
        # Save vulnerabilities
        vuln_file = os.path.join(output_dir, 'vulnerabilities.json')
        save_json(self.vulnerabilities, vuln_file)
        
        # Save scanned links
        links_file = os.path.join(output_dir, 'scanned_links.json')
        save_json(self.scanned_links, links_file)
        
        # Save scanned forms
        forms_file = os.path.join(output_dir, 'scanned_forms.json')
        save_json(self.scanned_forms, forms_file)
        
        # Save scan summary
        summary = self._get_summary()
        summary_file = os.path.join(output_dir, 'scan_summary.json')
        save_json(summary, summary_file)
        
        # Save scan configuration
        config_file = os.path.join(output_dir, 'scan_config.json')
        save_json(self.config.get_all(), config_file)
        
        # Save a list of all scanned URLs
        urls_file = os.path.join(output_dir, 'scanned_urls.txt')
        with open(urls_file, 'w') as f:
            for url in self.visited_urls:
                f.write(f"{url}\n")
        
        # Save detailed results
        detailed_results = self.get_results()
        detailed_file = os.path.join(output_dir, 'detailed_results.json')
        save_json(detailed_results, detailed_file)
        
        self.logger.info(f"Results saved to {output_dir}")
    
    def _get_summary(self):
        """Get scan summary"""
        return {
            'scan_info': {
                'start_time': self.stats.start_time.isoformat(),
                'end_time': self.stats.end_time.isoformat() if self.stats.end_time else None,
                'duration': self.stats.get_duration(),
                'total_urls_scanned': self.stats.total_urls_scanned,
                'total_vulnerabilities': len(self.vulnerabilities),
                'total_links_scanned': len(self.scanned_links),
                'total_forms_scanned': len(self.scanned_forms),
                'scan_id': self.scan_id
            },
            'vulnerabilities_by_type': self.stats.vulnerabilities_by_type,
            'errors_by_type': self.stats.errors_by_type,
            'performance_metrics': {
                'avg_response_time': self.stats.avg_response_time,
                'min_response_time': self.stats.min_response_time,
                'max_response_time': self.stats.max_response_time
            }
        }
    
    def get_results(self) -> Dict[str, Any]:
        """Get scan results"""
        return {
            'summary': self._get_summary(),
            'vulnerabilities': self.vulnerabilities,
            'scanned_links': self.scanned_links,
            'scanned_forms': self.scanned_forms,
            'scanned_urls': list(self.visited_urls)
        }
