"""
A08 - Software and Data Integrity Failures Scanner Module
"""
from typing import Dict, List, Any, Optional
import requests
from bs4 import BeautifulSoup
import re

def check_integrity_failures(url: str, response: requests.Response, log_func=None) -> List[Dict[str, Any]]:
    """
    Check for software and data integrity failures
    
    Args:
        url: The URL to check
        response: The HTTP response
        log_func: Optional logging function
    
    Returns:
        List of vulnerabilities found
    """
    vulnerabilities = []
    
    if log_func:
        log_func(f"Checking integrity failures for {url}")
    
    # Extract scripts
    scripts = extract_scripts(response)
    
    # Check for external scripts without SRI
    for script_url, has_integrity in scripts:
        if not has_integrity and is_external_url(script_url, url):
            vuln_data = {
                'type': 'integrity_failure_missing_sri',
                'url': url,
                'details': {
                    'script_url': script_url,
                    'description': 'External script without Subresource Integrity (SRI) protection',
                    'severity': 'Medium',
                    'recommendation': 'Add integrity attribute to the script tag with a valid hash',
                    'consequences': 'Without SRI, attackers who compromise the CDN or external resource could inject malicious code into your application'
                }
            }
            vulnerabilities.append(vuln_data)
            
            if log_func:
                log_func(f"Found script without SRI: {script_url}")
    
    # Check for scripts loaded over HTTP
    for script_url, _ in scripts:
        if script_url.startswith('http://'):
            vuln_data = {
                'type': 'integrity_failure_insecure_script',
                'url': url,
                'details': {
                    'script_url': script_url,
                    'description': 'Script loaded over insecure HTTP',
                    'severity': 'High',
                    'recommendation': 'Load all scripts over HTTPS',
                    'consequences': 'Scripts loaded over HTTP are vulnerable to man-in-the-middle attacks'
                }
            }
            vulnerabilities.append(vuln_data)
            
            if log_func:
                log_func(f"Found script loaded over HTTP: {script_url}")
    
    # Check for insecure package sourcing
    insecure_package_sources = check_insecure_package_sources(response)
    for source_url in insecure_package_sources:
        vuln_data = {
            'type': 'integrity_failure_insecure_package_source',
            'url': url,
            'details': {
                'source_url': source_url,
                'description': 'Insecure package source or registry',
                'severity': 'Medium',
                'recommendation': 'Use secure and verified package sources',
                'consequences': 'Insecure package sources could distribute compromised dependencies'
            }
        }
        vulnerabilities.append(vuln_data)
        
        if log_func:
            log_func(f"Found insecure package source: {source_url}")
    
    # Check for deserialization vulnerabilities
    if has_deserialization_vulnerabilities(response):
        vuln_data = {
            'type': 'integrity_failure_insecure_deserialization',
            'url': url,
            'details': {
                'description': 'Potential insecure deserialization vulnerability',
                'severity': 'High',
                'recommendation': 'Use secure deserialization methods or alternatives like JSON',
                'consequences': 'Insecure deserialization can lead to remote code execution'
            }
        }
        vulnerabilities.append(vuln_data)
        
        if log_func:
            log_func(f"Found potential deserialization vulnerability at {url}")
    
    return vulnerabilities

def extract_scripts(response: requests.Response) -> List[tuple]:
    """
    Extract script tags and check for integrity attributes
    
    Args:
        response: The HTTP response
    
    Returns:
        List of tuples (script_url, has_integrity)
    """
    scripts = []
    
    try:
        soup = BeautifulSoup(response.text, 'html.parser')
        
        for script in soup.find_all('script', src=True):
            script_url = script.get('src', '')
            has_integrity = script.has_attr('integrity') and script['integrity'].strip() != ''
            
            # Normalize the URL if it's relative
            if script_url and not script_url.startswith(('http://', 'https://', '//')):
                from urllib.parse import urljoin
                script_url = urljoin(response.url, script_url)
            elif script_url.startswith('//'):
                # Protocol-relative URL, add https:
                script_url = 'https:' + script_url
            
            scripts.append((script_url, has_integrity))
    
    except Exception as e:
        print(f"Error extracting scripts: {str(e)}")
    
    return scripts

def is_external_url(url: str, base_url: str) -> bool:
    """
    Check if a URL is external to the base URL
    
    Args:
        url: The URL to check
        base_url: The base URL
    
    Returns:
        True if the URL is external, False otherwise
    """
    from urllib.parse import urlparse
    
    if not url.startswith(('http://', 'https://')):
        return False
    
    parsed_url = urlparse(url)
    parsed_base = urlparse(base_url)
    
    return parsed_url.netloc != parsed_base.netloc

def check_insecure_package_sources(response: requests.Response) -> List[str]:
    """
    Check for insecure package sources
    
    Args:
        response: The HTTP response
    
    Returns:
        List of insecure package sources
    """
    insecure_sources = []
    
    # Known insecure or compromisable package source patterns
    insecure_patterns = [
        r'http://registry\.npmjs\.org',  # Non-HTTPS NPM
        r'http://rubygems\.org',         # Non-HTTPS RubyGems
        r'http://pypi\.org',             # Non-HTTPS PyPI
        r'http://repo\d+\.maven\.org',   # Non-HTTPS Maven
        r'http://plugins\.jquery\.com',  # Non-HTTPS jQuery plugins
        r'http://bower\.herokuapp\.com',  # Non-HTTPS Bower
        r'http://unpkg\.com',            # Non-HTTPS unpkg
        r'http://cdn\.jsdelivr\.net',    # Non-HTTPS jsDelivr
        r'http://cdnjs\.cloudflare\.com' # Non-HTTPS CDNJS
    ]
    
    content = response.text
    
    for pattern in insecure_patterns:
        matches = re.findall(pattern, content)
        insecure_sources.extend(matches)
    
    return insecure_sources

def has_deserialization_vulnerabilities(response: requests.Response) -> bool:
    """
    Check for potential deserialization vulnerabilities
    
    Args:
        response: The HTTP response
    
    Returns:
        True if potential vulnerabilities are found, False otherwise
    """
    # This is a heuristic check and might have false positives
    content = response.text.lower()
    
    # Look for patterns that might indicate deserialization
    deserialize_patterns = [
        r'\.deserialize\(',
        r'ObjectInputStream',
        r'readObject\(',
        r'yaml\.load\(',
        r'pickle\.loads',
        r'Marshal\.load',
        r'unserialize\(',
        r'fromJSON\(',
        r'JSON\.parse\(',
        r'eval\(',
        r'fromCharCode\('
    ]
    
    for pattern in deserialize_patterns:
        if re.search(pattern, content, re.IGNORECASE):
            return True
    
    return False
