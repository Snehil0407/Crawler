"""
A09 - Security Logging & Monitoring Failures Scanner Module
"""
from typing import Dict, List, Any, Optional
import requests
import re
import time
import random

def check_logging_monitoring(url: str, response: requests.Response, session: requests.Session, log_func=None) -> List[Dict[str, Any]]:
    """
    Check for security logging and monitoring failures
    
    Args:
        url: The URL to check
        response: The HTTP response
        session: The requests session for additional requests
        log_func: Optional logging function
    
    Returns:
        List of vulnerabilities found
    """
    vulnerabilities = []
    
    if log_func:
        log_func(f"Checking security logging and monitoring for {url}")
    
    # 1. Check for login forms and test login failure handling
    if is_login_page(response):
        login_vulnerabilities = test_login_monitoring(url, session, log_func)
        vulnerabilities.extend(login_vulnerabilities)
    
    # 2. Check for missing audit trails
    if missing_audit_trail(response):
        vuln_data = {
            'type': 'logging_monitoring_no_audit_trail',
            'details': {
                'description': 'No evidence of audit logging found',
                'severity': 'High',
                'recommendation': 'Implement audit logging for all authentication and authorization events',
                'consequences': 'Without proper audit trails, security incidents may go undetected and uninvestigated'
            }
        }
        vulnerabilities.append(vuln_data)
        
        if log_func:
            log_func(f"No audit trail found at {url}")
    
    # 3. Check for admin pages without proper logging
    if is_admin_page(url, response) and not has_proper_logging(response):
        vuln_data = {
            'type': 'logging_monitoring_insufficient_admin_logging',
            'details': {
                'description': 'Admin interface with insufficient logging detected',
                'severity': 'High',
                'recommendation': 'Implement detailed logging for all admin actions',
                'consequences': 'Admin actions could be performed without proper audit trails, making it difficult to detect and investigate malicious activities'
            }
        }
        vulnerabilities.append(vuln_data)
        
        if log_func:
            log_func(f"Admin page with insufficient logging found at {url}")
    
    # 4. Check for lack of monitoring for suspicious activity
    if lacks_suspicious_activity_monitoring(url, session, log_func):
        vuln_data = {
            'type': 'logging_monitoring_no_suspicious_activity_monitoring',
            'details': {
                'description': 'No monitoring for suspicious activity detected',
                'severity': 'Medium',
                'recommendation': 'Implement monitoring and alerting for suspicious activity patterns such as multiple failed logins',
                'consequences': 'Without monitoring for suspicious patterns, attacks such as brute force or account enumeration can go undetected'
            }
        }
        vulnerabilities.append(vuln_data)
        
        if log_func:
            log_func(f"No suspicious activity monitoring found at {url}")
    
    # 5. Check for centralized logging
    if not has_centralized_logging(response):
        vuln_data = {
            'type': 'logging_monitoring_no_centralized_logging',
            'details': {
                'description': 'No evidence of centralized logging found',
                'severity': 'Medium',
                'recommendation': 'Implement centralized logging for all application components',
                'consequences': 'Without centralized logging, security events across different components may be difficult to correlate and analyze'
            }
        }
        vulnerabilities.append(vuln_data)
        
        if log_func:
            log_func(f"No centralized logging found at {url}")
    
    return vulnerabilities

def is_login_page(response: requests.Response) -> bool:
    """
    Check if the page is a login page
    
    Args:
        response: The HTTP response
    
    Returns:
        True if the page is a login page, False otherwise
    """
    content = response.text.lower()
    
    # Look for patterns that suggest a login page
    login_patterns = [
        r'<form[^>]*>.*?(?:<input[^>]*password[^>]*>).*?</form>',
        r'login|signin|log in|sign in',
        r'username|user name|email|e-mail',
        r'password|passcode|pin'
    ]
    
    for pattern in login_patterns:
        if re.search(pattern, content, re.DOTALL):
            return True
    
    return False

def test_login_monitoring(url: str, session: requests.Session, log_func=None) -> List[Dict[str, Any]]:
    """
    Test login failure monitoring
    
    Args:
        url: The URL of the login page
        session: The requests session for additional requests
        log_func: Optional logging function
    
    Returns:
        List of vulnerabilities found
    """
    vulnerabilities = []
    
    # Try to find a login form
    try:
        response = session.get(url)
        content = response.text
        
        # Extract login form details (this is a simplified approach)
        form_match = re.search(r'<form[^>]*action="([^"]*)"[^>]*>.*?</form>', content, re.DOTALL)
        if not form_match:
            return vulnerabilities
        
        form_action = form_match.group(1)
        if not form_action.startswith('http'):
            # Handle relative URLs
            if form_action.startswith('/'):
                from urllib.parse import urlparse
                parsed_url = urlparse(url)
                base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
                form_action = base_url + form_action
            else:
                form_action = url + ('/' if not url.endswith('/') else '') + form_action
        
        # Generate random credentials for testing
        test_username = f"test_user_{random.randint(1000, 9999)}"
        test_password = f"test_pass_{random.randint(1000, 9999)}"
        
        # Simulate multiple login failures
        for _ in range(5):
            login_data = {
                'username': test_username,
                'email': test_username + '@example.com',
                'user': test_username,
                'login': test_username,
                'password': test_password,
                'pass': test_password,
                'pwd': test_password
            }
            
            try:
                login_response = session.post(form_action, data=login_data, allow_redirects=True)
                
                # Check if we get any indication of account lockout or monitoring
                has_lockout = False
                has_monitoring = False
                
                lockout_patterns = [
                    r'account.*lock|lock.*account',
                    r'too many attempts|maximum attempts',
                    r'temporarily disabled|temporarily blocked',
                    r'try again later|wait \d+ minute'
                ]
                
                monitoring_patterns = [
                    r'unusual activity|suspicious activity',
                    r'security alert|security notification',
                    r'multiple failed attempts|repeated failed'
                ]
                
                for pattern in lockout_patterns:
                    if re.search(pattern, login_response.text.lower()):
                        has_lockout = True
                        break
                
                for pattern in monitoring_patterns:
                    if re.search(pattern, login_response.text.lower()):
                        has_monitoring = True
                        break
                
                # If we got locked out, no need to continue
                if has_lockout:
                    break
                
                # Avoid too many requests too quickly
                time.sleep(0.5)
                
            except Exception as e:
                if log_func:
                    log_func(f"Error testing login monitoring: {str(e)}")
                break
        
        # Report findings
        if not has_lockout:
            vuln_data = {
                'type': 'logging_monitoring_no_account_lockout',
                'details': {
                    'description': 'No account lockout after multiple failed login attempts',
                    'severity': 'High',
                    'recommendation': 'Implement account lockout policies after a certain number of failed login attempts',
                    'consequences': 'Without account lockout, attackers can perform unlimited brute force attacks on user accounts'
                }
            }
            vulnerabilities.append(vuln_data)
        
        if not has_monitoring:
            vuln_data = {
                'type': 'logging_monitoring_no_login_failure_monitoring',
                'details': {
                    'description': 'No evidence of monitoring for failed login attempts',
                    'severity': 'Medium',
                    'recommendation': 'Implement monitoring and alerting for repeated failed login attempts',
                    'consequences': 'Without monitoring for failed logins, brute force attacks may go undetected'
                }
            }
            vulnerabilities.append(vuln_data)
        
    except Exception as e:
        if log_func:
            log_func(f"Error testing login monitoring: {str(e)}")
    
    return vulnerabilities

def missing_audit_trail(response: requests.Response) -> bool:
    """
    Check if the application is missing audit trails
    
    Args:
        response: The HTTP response
    
    Returns:
        True if audit trails are missing, False if they are present
    """
    content = response.text.lower()
    
    # Look for patterns that suggest audit trails
    audit_patterns = [
        r'audit log|audit trail',
        r'user activity|activity log',
        r'last login|previous login',
        r'session history|login history'
    ]
    
    for pattern in audit_patterns:
        if re.search(pattern, content):
            return False
    
    return True

def is_admin_page(url: str, response: requests.Response) -> bool:
    """
    Check if the page is an admin page
    
    Args:
        url: The URL to check
        response: The HTTP response
    
    Returns:
        True if the page is an admin page, False otherwise
    """
    # Check URL for admin indicators
    admin_url_patterns = [
        r'/admin',
        r'/administrator',
        r'/manage',
        r'/dashboard',
        r'/control',
        r'/panel',
        r'/console'
    ]
    
    for pattern in admin_url_patterns:
        if re.search(pattern, url.lower()):
            return True
    
    # Check content for admin indicators
    content = response.text.lower()
    admin_content_patterns = [
        r'admin dashboard|admin panel',
        r'control panel|management console',
        r'administrative tools|admin tools',
        r'manage users|user management',
        r'site administration|website admin'
    ]
    
    for pattern in admin_content_patterns:
        if re.search(pattern, content):
            return True
    
    return False

def has_proper_logging(response: requests.Response) -> bool:
    """
    Check if the application has proper logging
    
    Args:
        response: The HTTP response
    
    Returns:
        True if proper logging is detected, False otherwise
    """
    content = response.text.lower()
    
    # Look for patterns that suggest proper logging
    logging_patterns = [
        r'activity log|action log',
        r'audit trail|audit log',
        r'logging enabled|logs enabled',
        r'event tracking|event logging'
    ]
    
    for pattern in logging_patterns:
        if re.search(pattern, content):
            return True
    
    return False

def lacks_suspicious_activity_monitoring(url: str, session: requests.Session, log_func=None) -> bool:
    """
    Check if the application lacks monitoring for suspicious activity
    
    Args:
        url: The URL to check
        session: The requests session for additional requests
        log_func: Optional logging function
    
    Returns:
        True if suspicious activity monitoring is missing, False otherwise
    """
    # This is a heuristic check - we'll simulate some suspicious behavior and see if it gets detected
    try:
        # 1. Rapid successive requests
        for _ in range(10):
            session.get(url, timeout=2)
            time.sleep(0.1)
        
        # 2. Try accessing a few typical sensitive endpoints
        sensitive_endpoints = ['/admin', '/config', '/settings', '/users', '/api/users', '/api/config']
        for endpoint in sensitive_endpoints:
            from urllib.parse import urlparse, urljoin
            parsed_url = urlparse(url)
            base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
            endpoint_url = urljoin(base_url, endpoint)
            session.get(endpoint_url, timeout=2)
        
        # 3. Check the last response for any indication of monitoring
        response = session.get(url, timeout=2)
        content = response.text.lower()
        
        monitoring_patterns = [
            r'unusual activity|suspicious activity',
            r'security alert|security warning',
            r'abnormal behavior|anomalous behavior',
            r'activity monitoring|behavior monitoring'
        ]
        
        for pattern in monitoring_patterns:
            if re.search(pattern, content):
                return False
        
        # No monitoring detected
        return True
        
    except Exception as e:
        if log_func:
            log_func(f"Error checking suspicious activity monitoring: {str(e)}")
        return True  # Assume no monitoring if we can't check

def has_centralized_logging(response: requests.Response) -> bool:
    """
    Check if the application has centralized logging
    
    Args:
        response: The HTTP response
    
    Returns:
        True if centralized logging is detected, False otherwise
    """
    # This is difficult to detect externally, but we can look for some indicators
    headers = {k.lower(): v for k, v in response.headers.items()}
    content = response.text.lower()
    
    # Look for headers or content that suggest logging infrastructure
    logging_headers = ['x-request-id', 'x-correlation-id', 'x-transaction-id']
    for header in logging_headers:
        if header in headers:
            return True
    
    # Look for content patterns that suggest centralized logging
    logging_patterns = [
        r'log aggregation|log collection',
        r'centralized logging|unified logging',
        r'log management|log system'
    ]
    
    for pattern in logging_patterns:
        if re.search(pattern, content):
            return True
    
    return False
