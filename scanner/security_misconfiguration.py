"""
A05 - Security Misconfiguration Scanner Module
"""
from typing import Dict, List, Any, Optional
import requests
import re

# Security headers that should be present
SECURITY_HEADERS = {
    'Content-Security-Policy': {
        'description': 'Helps prevent XSS and data injection attacks',
        'recommendation': 'Implement a strict Content-Security-Policy',
        'severity': 'High',
        'consequences': 'Without CSP, the site is more vulnerable to cross-site scripting (XSS) attacks'
    },
    'X-Frame-Options': {
        'description': 'Prevents clickjacking attacks',
        'recommendation': 'Set X-Frame-Options to DENY or SAMEORIGIN',
        'severity': 'Medium',
        'consequences': 'Without X-Frame-Options, the site could be embedded in an iframe and used for clickjacking attacks'
    },
    'X-Content-Type-Options': {
        'description': 'Prevents MIME-sniffing attacks',
        'recommendation': 'Set X-Content-Type-Options to nosniff',
        'severity': 'Medium',
        'consequences': 'Without X-Content-Type-Options, browsers may interpret files as a different MIME type, leading to security vulnerabilities'
    },
    'Strict-Transport-Security': {
        'description': 'Enforces HTTPS connections',
        'recommendation': 'Set Strict-Transport-Security with a long max-age',
        'severity': 'High',
        'consequences': 'Without HSTS, users might access the site over insecure HTTP connections, exposing data to interception'
    },
    'Referrer-Policy': {
        'description': 'Controls what information is sent in the Referer header',
        'recommendation': 'Set Referrer-Policy to no-referrer or same-origin',
        'severity': 'Low',
        'consequences': 'Without Referrer-Policy, sensitive information might be leaked in the Referer header'
    },
    'Permissions-Policy': {
        'description': 'Controls which browser features can be used',
        'recommendation': 'Configure Permissions-Policy to restrict unnecessary features',
        'severity': 'Medium',
        'consequences': 'Without Permissions-Policy, sensitive device features might be accessible to untrusted code'
    }
}

def check_security_misconfiguration(url: str, response: requests.Response, log_func=None) -> List[Dict[str, Any]]:
    """
    Check for security misconfigurations
    
    Args:
        url: The URL to check
        response: The HTTP response
        log_func: Optional logging function
    
    Returns:
        List of vulnerabilities found
    """
    vulnerabilities = []
    
    if log_func:
        log_func(f"Checking security misconfigurations for {url}")
    
    # Check for missing security headers
    missing_headers = check_missing_headers(response)
    for header, details in missing_headers.items():
        vuln_data = {
            'type': 'security_misconfiguration_missing_header',
            'url': url,
            'details': {
                'header': header,
                'description': f"Missing {header} header: {details['description']}",
                'severity': details['severity'],
                'recommendation': details['recommendation'],
                'consequences': details['consequences']
            }
        }
        vulnerabilities.append(vuln_data)
        
        if log_func:
            log_func(f"Found missing security header: {header} at {url}")
    
    # Check for directory listing
    if has_directory_listing(response):
        vuln_data = {
            'type': 'security_misconfiguration_directory_listing',
            'url': url,
            'details': {
                'description': 'Directory listing is enabled',
                'severity': 'Medium',
                'recommendation': 'Disable directory listing in your web server configuration',
                'consequences': 'Attackers can view the contents of directories, potentially exposing sensitive files'
            }
        }
        vulnerabilities.append(vuln_data)
        
        if log_func:
            log_func(f"Found directory listing at {url}")
    
    # Check for verbose error messages or stack traces
    if has_verbose_errors(response):
        vuln_data = {
            'type': 'security_misconfiguration_verbose_errors',
            'url': url,
            'details': {
                'description': 'Verbose error messages or stack traces detected',
                'severity': 'Medium',
                'recommendation': 'Configure your application to display generic error messages in production',
                'consequences': 'Detailed error messages can reveal sensitive information about your application structure, dependencies, and potential vulnerabilities'
            }
        }
        vulnerabilities.append(vuln_data)
        
        if log_func:
            log_func(f"Found verbose error messages at {url}")
    
    # Check for default credentials or configuration files
    if has_default_configs(url, response):
        vuln_data = {
            'type': 'security_misconfiguration_default_configs',
            'url': url,
            'details': {
                'description': 'Default configuration files or credentials detected',
                'severity': 'High',
                'recommendation': 'Remove default configuration files and change default credentials',
                'consequences': 'Default configurations often contain vulnerabilities or credentials that are widely known to attackers'
            }
        }
        vulnerabilities.append(vuln_data)
        
        if log_func:
            log_func(f"Found default configuration files at {url}")
    
    return vulnerabilities

def check_missing_headers(response: requests.Response) -> Dict[str, Dict[str, str]]:
    """
    Check for missing security headers
    
    Args:
        response: The HTTP response
    
    Returns:
        Dictionary of missing headers with details
    """
    missing = {}
    headers = {k.lower(): v for k, v in response.headers.items()}
    
    for header, details in SECURITY_HEADERS.items():
        header_lower = header.lower()
        if header_lower not in headers:
            missing[header] = details
    
    return missing

def has_directory_listing(response: requests.Response) -> bool:
    """
    Check if directory listing is enabled
    
    Args:
        response: The HTTP response
    
    Returns:
        True if directory listing is enabled, False otherwise
    """
    # Check for common directory listing signatures
    if response.status_code == 200:
        content = response.text.lower()
        
        # Look for patterns that suggest directory listing
        patterns = [
            r'<title>index of',
            r'<h1>directory listing',
            r'<h1>index of',
            r'parent directory</a>',
            r'directory listing for',
            r'<pre>name\s+last modified\s+size\s+description',
            r'<pre>directory listing of'
        ]
        
        for pattern in patterns:
            if re.search(pattern, content):
                return True
    
    return False

def has_verbose_errors(response: requests.Response) -> bool:
    """
    Check for verbose error messages or stack traces
    
    Args:
        response: The HTTP response
    
    Returns:
        True if verbose errors are detected, False otherwise
    """
    # Check for common error patterns
    if response.status_code >= 400:
        content = response.text.lower()
        
        # Look for patterns that suggest verbose errors
        patterns = [
            r'exception|stack trace|syntax error|fatal error',
            r'(sql|odbc|ole db|jdbc) error',
            r'(php|python|ruby|perl|java|\.net) error',
            r'line \d+ of file',
            r'call stack',
            r'uncaught exception',
            r'debug info',
            r'thrown in',
            r'undefined index:',
            r'undefined variable:',
            r'error occurred in',
            r'<b>warning</b>:',
            r'<b>notice</b>:',
            r'<b>error</b>:'
        ]
        
        for pattern in patterns:
            if re.search(pattern, content):
                return True
    
    return False

def has_default_configs(url: str, response: requests.Response) -> bool:
    """
    Check for default configuration files
    
    Args:
        url: The URL to check
        response: The HTTP response
    
    Returns:
        True if default configurations are detected, False otherwise
    """
    # List of default config files or indicators
    default_config_indicators = [
        'phpinfo.php',
        'config.php',
        'config.inc.php',
        'setup.php',
        'default.config',
        'conf.default',
        'wp-config.php',
        'server-status',
        'server-info',
        '.env',
        '.git',
        '.svn',
        '.htpasswd',
        '.htaccess',
        'config.xml',
        'web.config',
        'settings.py',
        'settings.ini'
    ]
    
    # Check if the URL contains any default config indicators
    for indicator in default_config_indicators:
        if indicator in url.lower():
            return True
    
    # Check if the response contains default configuration information
    content = response.text.lower()
    default_content_indicators = [
        'installation complete',
        'setup successful',
        'default password',
        'default username',
        'default admin',
        'password is',
        'username is',
        'configuration file',
        'config file'
    ]
    
    for indicator in default_content_indicators:
        if indicator in content:
            return True
    
    return False
