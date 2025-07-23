"""
A02 - Cryptographic Failures Scanner Module
"""
from typing import Dict, List, Any
import requests
import re
import ssl
import socket
from urllib.parse import urlparse

def check_cryptographic_failures(url: str, response: requests.Response, log_func=None) -> List[Dict[str, Any]]:
    """
    Check for cryptographic failures
    
    Args:
        url: The URL to check
        response: The HTTP response
        log_func: Optional logging function
    
    Returns:
        List of vulnerabilities found
    """
    vulnerabilities = []
    
    # Check if HTTPS is used
    is_https = url.startswith('https://')
    
    if not is_https:
        vuln_data = {
            'type': 'crypto_failure_no_https',
            'url': url,
            'details': {
                'description': 'Site is not using HTTPS encryption',
                'severity': 'High',
                'recommendation': 'Implement HTTPS for all web traffic',
                'consequences': 'Data transmitted in plaintext can be intercepted, read, or modified by attackers'
            }
        }
        vulnerabilities.append(vuln_data)
        
        if log_func:
            log_func(f"Found cryptographic failure: No HTTPS for {url}")
    
    # Check cookies for security attributes
    if response and response.cookies:
        insecure_cookies = []
        
        for cookie in response.cookies:
            cookie_issues = []
            
            if not cookie.secure:
                cookie_issues.append('Missing Secure flag')
            
            if not cookie.has_nonstandard_attr('HttpOnly'):
                cookie_issues.append('Missing HttpOnly flag')
                
            if cookie.has_nonstandard_attr('SameSite'):
                samesite = cookie.get_nonstandard_attr('SameSite')
                if not samesite or samesite.lower() == 'none':
                    cookie_issues.append('Weak SameSite policy')
            else:
                cookie_issues.append('Missing SameSite attribute')
                
            if cookie_issues:
                insecure_cookies.append({
                    'name': cookie.name,
                    'issues': cookie_issues
                })
        
        if insecure_cookies:
            vuln_data = {
                'type': 'crypto_failure_insecure_cookies',
                'url': url,
                'details': {
                    'insecure_cookies': insecure_cookies,
                    'description': 'Cookies with missing security attributes',
                    'severity': 'Medium',
                    'recommendation': 'Set Secure, HttpOnly, and SameSite attributes on cookies',
                    'consequences': 'Cookies may be stolen via XSS attacks or transmitted over unencrypted connections'
                }
            }
            vulnerabilities.append(vuln_data)
            
            if log_func:
                log_func(f"Found cryptographic failure: Insecure cookies for {url}")
    
    # Check TLS version if HTTPS
    if is_https:
        try:
            hostname = urlparse(url).netloc
            context = ssl.create_default_context()
            with socket.create_connection((hostname, 443), timeout=5) as sock:
                with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    tls_version = ssock.version()
                    
                    # Check if TLS version is considered outdated
                    outdated_tls = tls_version in ['TLSv1', 'TLSv1.1', 'SSLv3', 'SSLv2']
                    
                    if outdated_tls:
                        vuln_data = {
                            'type': 'crypto_failure_outdated_tls',
                            'url': url,
                            'details': {
                                'tls_version': tls_version,
                                'description': f'Outdated TLS version: {tls_version}',
                                'severity': 'Medium',
                                'recommendation': 'Upgrade to TLS 1.2 or later',
                                'consequences': 'Known vulnerabilities in older TLS versions could lead to man-in-the-middle attacks or information disclosure'
                            }
                        }
                        vulnerabilities.append(vuln_data)
                        
                        if log_func:
                            log_func(f"Found cryptographic failure: Outdated TLS ({tls_version}) for {url}")
        except Exception as e:
            # Don't raise exception if we can't check TLS version, just log it
            if log_func:
                log_func(f"Could not check TLS version for {url}: {str(e)}")
    
    return vulnerabilities
