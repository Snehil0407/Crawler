from typing import Dict, Any, List
from datetime import datetime
import json
import os

class ScanStats:
    def __init__(self):
        self.start_time = datetime.now()
        self.end_time = None
        
        # Basic metrics
        self.total_urls_scanned = 0
        self.total_requests = 0
        self.total_errors = 0
        self.total_vulnerabilities = 0
        
        # Detailed metrics
        self.vulnerabilities_by_type: Dict[str, int] = {
            # Default vulnerability types
            'xss': 0,
            'sql_injection': 0,
            
            # OWASP Top 10 vulnerability types
            'broken_access_control': 0,  # A01
            'crypto_failure_no_https': 0,  # A02
            'crypto_failure_insecure_cookies': 0,  # A02
            'crypto_failure_outdated_tls': 0,  # A02
            'insecure_design_csrf': 0,  # A04
            'insecure_design_no_rate_limiting': 0,  # A04
        }
        self.errors_by_type: Dict[str, int] = {}
        self.response_codes: Dict[int, int] = {}
        self.scanned_urls: List[str] = []
        self.vulnerable_urls: List[Dict[str, Any]] = []
        
        # Performance metrics
        self.avg_response_time = 0
        self.total_response_time = 0
        self.min_response_time = float('inf')
        self.max_response_time = 0
    
    def add_url(self, url: str):
        """Add a scanned URL"""
        self.scanned_urls.append(url)
        self.total_urls_scanned += 1
    
    def add_vulnerability(self, vuln_type: str, url: str, details: Dict[str, Any]):
        """Add a discovered vulnerability"""
        self.total_vulnerabilities += 1
        self.vulnerabilities_by_type[vuln_type] = self.vulnerabilities_by_type.get(vuln_type, 0) + 1
        
        vuln_data = {
            'type': vuln_type,
            'url': url,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        self.vulnerable_urls.append(vuln_data)
    
    def add_error(self, error_type: str):
        """Add an error"""
        self.total_errors += 1
        self.errors_by_type[error_type] = self.errors_by_type.get(error_type, 0) + 1
    
    def add_response(self, status_code: int, response_time: float):
        """Add a response"""
        self.total_requests += 1
        self.response_codes[status_code] = self.response_codes.get(status_code, 0) + 1
        
        # Update response time metrics
        self.total_response_time += response_time
        self.avg_response_time = self.total_response_time / self.total_requests
        self.min_response_time = min(self.min_response_time, response_time)
        self.max_response_time = max(self.max_response_time, response_time)
    
    def complete(self):
        """Mark scan as complete"""
        self.end_time = datetime.now()
    
    def get_duration(self) -> float:
        """Get scan duration in seconds"""
        if not self.end_time:
            return (datetime.now() - self.start_time).total_seconds()
        return (self.end_time - self.start_time).total_seconds()
    
    def get_summary(self) -> Dict[str, Any]:
        """Get scan summary"""
        return {
            'start_time': self.start_time.isoformat(),
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'duration': self.get_duration(),
            'total_urls_scanned': self.total_urls_scanned,
            'total_requests': self.total_requests,
            'total_errors': self.total_errors,
            'total_vulnerabilities': self.total_vulnerabilities,
            'vulnerabilities_by_type': self.vulnerabilities_by_type,
            'errors_by_type': self.errors_by_type,
            'response_codes': self.response_codes,
            'performance': {
                'avg_response_time': self.avg_response_time,
                'min_response_time': self.min_response_time,
                'max_response_time': self.max_response_time
            }
        }
    
    def save(self, output_dir: str):
        """Save scan statistics to files"""
        os.makedirs(output_dir, exist_ok=True)
        
        # Save summary
        with open(os.path.join(output_dir, 'scan_summary.json'), 'w') as f:
            json.dump(self.get_summary(), f, indent=4)
        
        # Save vulnerable URLs
        with open(os.path.join(output_dir, 'vulnerabilities.json'), 'w') as f:
            json.dump(self.vulnerable_urls, f, indent=4)
        
        # Save scanned URLs
        with open(os.path.join(output_dir, 'scanned_urls.txt'), 'w') as f:
            f.write('\n'.join(self.scanned_urls))