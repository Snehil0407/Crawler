# main.py

import os
import json
import argparse
import logging
import sys
from scanner import Scanner, ScannerConfig
from scanner.logger import ScannerLogger
from scanner.stats import ScanStats
from scanner.utils import save_json, is_valid_url
from datetime import datetime
from firebase.firebase_service import FirebaseService

def setup_logging(verbose: bool = False):
    """Setup logging configuration"""
    log_level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

def get_target_url(url_from_args=None) -> str:
    """Get target URL from command line arguments or user input"""
    if url_from_args:
        if not url_from_args.startswith(('http://', 'https://')):
            url_from_args = 'http://' + url_from_args
        if is_valid_url(url_from_args):
            return url_from_args
        else:
            print(f"Invalid URL from arguments: {url_from_args}")
    
    while True:
        url = input("Enter target URL (e.g., http://example.com): ").strip()
        if not url.startswith(('http://', 'https://')):
            url = 'http://' + url
        if is_valid_url(url):
            return url
        print("Invalid URL. Please enter a valid URL.")

def print_vulnerability(vuln):
    """Print vulnerability details in a structured format"""
    print
    print(f"VULNERABILITY FOUND")
    print("="*80)
    
    # For security header vulnerabilities, show the specific header name
    if vuln['type'].startswith('missing_'):
        header_name = vuln['type'].replace('missing_', '').replace('_', '-').upper()
        if header_name in ['X-FRAME-OPTIONS', 'X-CONTENT-TYPE-OPTIONS', 'X-XSS-PROTECTION', 
                          'CONTENT-SECURITY-POLICY', 'STRICT-TRANSPORT-SECURITY', 'REFERRER-POLICY']:
            print(f"Type: MISSING SECURITY HEADER - {header_name}")
        else:
            print(f"Type: {vuln['type'].upper()}")
    else:
        print(f"Type: {vuln['type'].upper()}")
        
    print(f"File: {vuln['file']}")
    print(f"URL: {vuln['url']}")
    print(f"Timestamp: {vuln['timestamp']}")
    print(f"Severity: {vuln['details']['severity']}")
    print(f"Description: {vuln['details']['description']}")
    
    # Display purpose and consequences for security header vulnerabilities
    if 'header_description' in vuln['details']:
        print(f"Purpose: {vuln['details']['header_description']}")
    
    # Display consequences of not fixing the vulnerability
    if 'consequences' in vuln['details']:
        print(f"\nWhat could happen if not fixed: {vuln['details']['consequences']}")
    
    if 'form' in vuln['details']:
        print("\nForm Details:")
        print(f"  Action: {vuln['details']['form']['action']}")
        print(f"  Method: {vuln['details']['form']['method']}")
        print(f"  Input Field: {vuln['details']['input_field']}")
    
    if 'payload' in vuln['details']:
        print(f"\nPayload: {vuln['details']['payload']}")
    
    print(f"\nRecommendation: {vuln['details']['recommendation']}")
    print("="*80)

def print_scan_summary(results):
    """Print scan summary in a structured format"""
    summary = results['summary']
    scan_info = summary['scan_info']
    
    print("\n" + "="*80)
    print("SCAN SUMMARY")
    print("="*80)
    print(f"Scan Duration: {scan_info['duration']:.2f} seconds")
    print(f"Total URLs Scanned: {scan_info['total_urls_scanned']}")
    print(f"Total Links Scanned: {scan_info['total_links_scanned']}")
    print(f"Total Forms Scanned: {scan_info['total_forms_scanned']}")
    print(f"Total Vulnerabilities Found: {scan_info['total_vulnerabilities']}")
    
    print("\nVulnerabilities by Type:")
    vuln_by_type = {}
    
    # Group security header vulnerabilities under a common category
    for vuln_type, count in summary['vulnerabilities_by_type'].items():
        if vuln_type.startswith('missing_'):
            header_name = vuln_type.replace('missing_', '').replace('_', '-').upper()
            if header_name in ['X-FRAME-OPTIONS', 'X-CONTENT-TYPE-OPTIONS', 'X-XSS-PROTECTION', 
                              'CONTENT-SECURITY-POLICY', 'STRICT-TRANSPORT-SECURITY', 'REFERRER-POLICY']:
                vuln_by_type[f"Missing Security Header - {header_name}"] = count
            else:
                vuln_by_type[vuln_type.replace('_', ' ').title()] = count
        else:
            vuln_by_type[vuln_type.replace('_', ' ').title()] = count
    
    for vuln_type, count in vuln_by_type.items():
        print(f"  {vuln_type}: {count}")
    
    print("\nPerformance Metrics:")
    print(f"  Average Response Time: {summary['performance_metrics']['avg_response_time']:.2f} seconds")
    print(f"  Minimum Response Time: {summary['performance_metrics']['min_response_time']:.2f} seconds")
    print(f"  Maximum Response Time: {summary['performance_metrics']['max_response_time']:.2f} seconds")
    print("="*80)

def print_scanned_links(links):
    """Print scanned links in a structured format"""
    print("\n" + "="*80)
    print("SCANNED LINKS")
    print("="*80)
    for link in links:
        print(f"\nSource URL: {link['source_url']}")
        print(f"Target URL: {link['target_url']}")
        print(f"Timestamp: {link['timestamp']}")
        print("-"*40)
    print("="*80)

def print_scanned_forms(forms):
    """Print scanned forms in a structured format"""
    print("\n" + "="*80)
    print("SCANNED FORMS")
    print("="*80)
    for form in forms:
        print(f"\nURL: {form['url']}")
        print(f"Action: {form['action']}")
        print(f"Method: {form['method']}")
        print("Input Fields:")
        for input_field in form['inputs']:
            print(f"  - Name: {input_field['name']}")
            print(f"    Type: {input_field['type']}")
        print(f"Timestamp: {form['timestamp']}")
        print("-"*40)
    print("="*80)

def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='WebSentinals Web Vulnerability Scanner')
    parser.add_argument('--url', type=str, help='Target URL to scan')
    parser.add_argument('--scan-id', type=str, help='Scan ID for tracking')
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose logging')
    args = parser.parse_args()
    
    # Setup logging
    setup_logging(args.verbose)
    
    # Get scan ID from environment or arguments
    scan_id = args.scan_id or os.environ.get('SCAN_ID')
    target_url_arg = args.url or os.environ.get('TARGET_URL')
    
    # Create output directory
    output_dir = 'scan_results'
    os.makedirs(output_dir, exist_ok=True)
    
    # Configure scanner
    config = ScannerConfig()
    config.set('output_dir', output_dir)
    config.set('log_file', os.path.join(output_dir, 'scanner.log'))
    config.set('max_depth', 3)
    
    # Configure OWASP Top 10 checks
    config.set('scan_broken_access', True)  # A01
    config.set('scan_crypto_failures', True)  # A02
    config.set('scan_insecure_design', True)  # A04
    config.set('max_pages', 100)
    config.set('threads', 4)
    config.set('scan_delay', 1.0)
    config.set('request_timeout', 30)
    config.set('verify_ssl', True)
    config.set('follow_redirects', True)
    config.set('scan_forms', True)
    config.set('scan_links', True)
    config.set('scan_headers', True)
    config.set('scan_cookies', True)
    
    # Initialize scanner
    scanner = Scanner(config)
    
    # Get target URL
    target_url = get_target_url(target_url_arg)
    print(f"\nStarting scan for: {target_url}")
    
    # Initialize Firebase service
    firebase_service = None
    try:
        firebase_service = FirebaseService.get_instance()
        firebase_service.initialize()
        print("Firebase service initialized")
    except Exception as e:
        print(f"Warning: Firebase initialization failed: {e}")
        print("Scan will continue without cloud storage")
    
    try:
        # Start scan
        if not scan_id:
            scan_id = scanner.start_scan(target_url)
        else:
            scanner.start_scan(target_url, scan_id)
        print(f"Scan ID: {scan_id}")
        
        # Update Firebase with scan progress during scan
        if firebase_service:
            try:
                firebase_service.update_scan_progress(scan_id, 10, "Starting vulnerability scan...")
            except Exception as e:
                print(f"Warning: Failed to update progress: {e}")
        
        # Get results
        results = scanner.get_results()
        
        # Update Firebase with completion
        if firebase_service:
            try:
                firebase_service.update_scan_progress(scan_id, 100, "Scan completed successfully")
            except Exception as e:
                print(f"Warning: Failed to update progress: {e}")
        
        # Add scan ID and target URL to results
        results['summary']['scan_info']['scan_id'] = scan_id
        results['summary']['scan_info']['target_url'] = target_url
        
        # Print results to console if running interactively (no scan-id argument)
        if not args.scan_id:
            print_scan_summary(results)
            
            # Print vulnerabilities
            if results['vulnerabilities']:
                print("\nDETAILED VULNERABILITIES")
                for vuln in results['vulnerabilities']:
                    print_vulnerability(vuln)
            else:
                print("\nNo vulnerabilities found.")
            
            # Print scanned links
            if results['scanned_links']:
                print_scanned_links(results['scanned_links'])
            else:
                print("\nNo links were scanned.")
            
            # Print scanned forms
            if results['scanned_forms']:
                print_scanned_forms(results['scanned_forms'])
            else:
                print("\nNo forms were scanned.")
            
            # Print errors if any
            if results['summary']['errors_by_type']:
                print("\nERRORS ENCOUNTERED")
                for error_type, count in results['summary']['errors_by_type'].items():
                    print(f"{error_type}: {count}")
            
            print(f"\nDetailed results saved to {output_dir}/detailed_results.json")
        
        # Save results to Firebase if service is available
        if firebase_service:
            try:
                firebase_result = firebase_service.save_scan_results(scan_id, results)
                if firebase_result['success']:
                    print(f"Results saved to Firebase with scan ID: {scan_id}")
                else:
                    print(f"Failed to save to Firebase: {firebase_result['message']}")
            except Exception as e:
                print(f"Error saving to Firebase: {e}")
        
        print(f"Scan ID: {scan_id}")
        
        # Exit successfully
        sys.exit(0)
        
    except Exception as e:
        print(f"Error during scan: {str(e)}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
