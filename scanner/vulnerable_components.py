"""
A06 - Vulnerable and Outdated Components Scanner Module
"""
from typing import Dict, List, Any, Optional, Tuple
import requests
import re
from bs4 import BeautifulSoup
import json
import os

# Define a database of known vulnerable library versions
# Format: {'library_name': {'versions': ['version1', 'version2'], 'cve': 'CVE-ID', 'description': 'Vulnerability description'}}
VULNERABLE_LIBRARIES = {
    'jquery': {
        'versions': ['1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8', '1.9', '1.10', '1.11', '1.12', '2.0', '2.1', '2.2', '3.0', '3.1', '3.2', '3.3', '3.4'],
        'cve': 'Multiple CVEs',
        'description': 'Multiple vulnerabilities in jQuery may allow XSS, prototype pollution, or other security issues',
        'severity': 'Medium',
        'recommendation': 'Update to the latest version of jQuery',
        'consequences': 'Outdated jQuery versions may contain security vulnerabilities that could be exploited by attackers'
    },
    'bootstrap': {
        'versions': ['2.0', '2.1', '2.2', '2.3', '3.0', '3.1', '3.2', '3.3', '4.0', '4.1', '4.2', '4.3', '4.4'],
        'cve': 'Multiple CVEs',
        'description': 'Multiple vulnerabilities in Bootstrap may allow XSS or other security issues',
        'severity': 'Medium',
        'recommendation': 'Update to the latest version of Bootstrap',
        'consequences': 'Outdated Bootstrap versions may contain security vulnerabilities that could be exploited by attackers'
    },
    'angular': {
        'versions': ['1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '2.0', '2.1', '2.2', '2.3', '2.4', '4.0', '4.1', '4.2', '4.3', '5.0', '5.1', '5.2', '6.0', '6.1', '7.0', '7.1', '7.2', '8.0', '8.1', '8.2', '9.0'],
        'cve': 'Multiple CVEs',
        'description': 'Multiple vulnerabilities in AngularJS may allow XSS, prototype pollution, or other security issues',
        'severity': 'High',
        'recommendation': 'Update to the latest version of Angular',
        'consequences': 'Outdated Angular versions may contain security vulnerabilities that could be exploited by attackers'
    },
    'react': {
        'versions': ['0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '0.10', '0.11', '0.12', '0.13', '0.14', '15.0', '15.1', '15.2', '15.3', '15.4', '15.5', '15.6', '16.0', '16.1', '16.2', '16.3', '16.4', '16.5', '16.6', '16.7', '16.8', '16.9'],
        'cve': 'Multiple CVEs',
        'description': 'Multiple vulnerabilities in React may allow XSS or other security issues',
        'severity': 'Medium',
        'recommendation': 'Update to the latest version of React',
        'consequences': 'Outdated React versions may contain security vulnerabilities that could be exploited by attackers'
    },
    'vue': {
        'versions': ['1.0', '2.0', '2.1', '2.2', '2.3', '2.4', '2.5', '2.6'],
        'cve': 'Multiple CVEs',
        'description': 'Multiple vulnerabilities in Vue may allow XSS or other security issues',
        'severity': 'Medium',
        'recommendation': 'Update to the latest version of Vue',
        'consequences': 'Outdated Vue versions may contain security vulnerabilities that could be exploited by attackers'
    },
    'lodash': {
        'versions': ['0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '1.0', '1.1', '1.2', '1.3', '2.0', '2.1', '2.2', '2.3', '2.4', '3.0', '3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8', '3.9', '3.10', '4.0', '4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7', '4.8', '4.9', '4.10', '4.11', '4.12', '4.13', '4.14', '4.15', '4.16', '4.17.0', '4.17.1', '4.17.2', '4.17.3', '4.17.4', '4.17.5', '4.17.6', '4.17.7', '4.17.8', '4.17.9', '4.17.10', '4.17.11', '4.17.12', '4.17.13', '4.17.14', '4.17.15'],
        'cve': 'CVE-2019-10744',
        'description': 'Prototype pollution vulnerability in Lodash',
        'severity': 'High',
        'recommendation': 'Update to the latest version of Lodash',
        'consequences': 'Attackers could potentially modify Object prototype, leading to application crashes or remote code execution'
    },
    'moment': {
        'versions': ['1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '2.0', '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.8', '2.9', '2.10', '2.11', '2.12', '2.13', '2.14', '2.15', '2.16', '2.17', '2.18', '2.19'],
        'cve': 'CVE-2017-18214',
        'description': 'Regular expression denial of service (ReDoS) vulnerability in Moment.js',
        'severity': 'Medium',
        'recommendation': 'Update to the latest version of Moment.js',
        'consequences': 'Attackers could cause denial of service by providing specially crafted input to the parser'
    }
}

# Load additional vulnerabilities from a local database if available
def load_vulnerability_database():
    """Load vulnerability database from a local file if available"""
    try:
        db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'vulnerable_libraries.json')
        if os.path.exists(db_path):
            with open(db_path, 'r') as f:
                additional_db = json.load(f)
                # Merge with the built-in database
                for lib, data in additional_db.items():
                    if lib in VULNERABLE_LIBRARIES:
                        # Merge versions
                        VULNERABLE_LIBRARIES[lib]['versions'].extend(data.get('versions', []))
                    else:
                        VULNERABLE_LIBRARIES[lib] = data
    except Exception as e:
        print(f"Error loading vulnerability database: {str(e)}")

# Call to load additional vulnerabilities
load_vulnerability_database()

def check_vulnerable_components(url: str, response: requests.Response, log_func=None) -> List[Dict[str, Any]]:
    """
    Check for vulnerable and outdated components
    
    Args:
        url: The URL to check
        response: The HTTP response
        log_func: Optional logging function
    
    Returns:
        List of vulnerabilities found
    """
    vulnerabilities = []
    
    if log_func:
        log_func(f"Checking vulnerable components for {url}")
    
    # Extract scripts and stylesheets
    scripts, stylesheets = extract_external_resources(response)
    
    # Check scripts for vulnerable versions
    for script_url in scripts:
        library_name, version = identify_library_version(script_url)
        
        if library_name and version:
            # Check if this library version is vulnerable
            vulnerability_info = check_library_vulnerability(library_name, version)
            
            if vulnerability_info:
                vuln_data = {
                    'type': 'vulnerable_component',
                    'url': url,
                    'details': {
                        'library': library_name,
                        'version': version,
                        'script_url': script_url,
                        'description': vulnerability_info.get('description', f"Vulnerable version of {library_name} detected"),
                        'severity': vulnerability_info.get('severity', 'Medium'),
                        'recommendation': vulnerability_info.get('recommendation', f"Update {library_name} to the latest version"),
                        'consequences': vulnerability_info.get('consequences', "Using outdated components with known vulnerabilities can lead to security breaches"),
                        'cve': vulnerability_info.get('cve', 'Unknown')
                    }
                }
                vulnerabilities.append(vuln_data)
                
                if log_func:
                    log_func(f"Found vulnerable component: {library_name} {version} at {url}")
    
    return vulnerabilities

def extract_external_resources(response: requests.Response) -> Tuple[List[str], List[str]]:
    """
    Extract external script and stylesheet URLs from a response
    
    Args:
        response: The HTTP response
    
    Returns:
        Tuple of (script_urls, stylesheet_urls)
    """
    scripts = []
    stylesheets = []
    
    try:
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract scripts
        for script in soup.find_all('script', src=True):
            src = script.get('src', '')
            if src:
                # Normalize URL if it's relative
                if not src.startswith(('http://', 'https://')):
                    if src.startswith('//'):
                        src = 'https:' + src
                    else:
                        base_url = response.url
                        src = base_url.rstrip('/') + '/' + src.lstrip('/')
                scripts.append(src)
        
        # Extract stylesheets
        for link in soup.find_all('link', rel='stylesheet', href=True):
            href = link.get('href', '')
            if href:
                # Normalize URL if it's relative
                if not href.startswith(('http://', 'https://')):
                    if href.startswith('//'):
                        href = 'https:' + href
                    else:
                        base_url = response.url
                        href = base_url.rstrip('/') + '/' + href.lstrip('/')
                stylesheets.append(href)
    
    except Exception as e:
        print(f"Error extracting resources: {str(e)}")
    
    return scripts, stylesheets

def identify_library_version(url: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Identify library name and version from a URL
    
    Args:
        url: The URL to analyze
    
    Returns:
        Tuple of (library_name, version) or (None, None) if not identified
    """
    # Common library name and version patterns in URLs
    patterns = [
        # jquery-X.Y.Z.min.js
        (r'jquery[.-](\d+\.\d+(?:\.\d+)?)', 'jquery'),
        # bootstrap.min.js?v=X.Y.Z or bootstrap-X.Y.Z.min.js
        (r'bootstrap[.-]?(\d+\.\d+(?:\.\d+)?)', 'bootstrap'),
        # angular.min.js?v=X.Y.Z or angular-X.Y.Z.min.js
        (r'angular[.-]?(\d+\.\d+(?:\.\d+)?)', 'angular'),
        # react.min.js?v=X.Y.Z or react-X.Y.Z.min.js
        (r'react[.-]?(\d+\.\d+(?:\.\d+)?)', 'react'),
        # vue.min.js?v=X.Y.Z or vue-X.Y.Z.min.js
        (r'vue[.-]?(\d+\.\d+(?:\.\d+)?)', 'vue'),
        # lodash.min.js?v=X.Y.Z or lodash-X.Y.Z.min.js
        (r'lodash[.-]?(\d+\.\d+(?:\.\d+)?)', 'lodash'),
        # moment.min.js?v=X.Y.Z or moment-X.Y.Z.min.js
        (r'moment[.-]?(\d+\.\d+(?:\.\d+)?)', 'moment'),
        # Look for version in query string v=X.Y.Z
        (r'[?&]v=(\d+\.\d+(?:\.\d+)?)', None),
        # Look for version in query string version=X.Y.Z
        (r'[?&]version=(\d+\.\d+(?:\.\d+)?)', None)
    ]
    
    library_name = None
    version = None
    
    for pattern, lib in patterns:
        match = re.search(pattern, url, re.IGNORECASE)
        if match:
            if lib:
                library_name = lib
            version = match.group(1)
            break
    
    # If we found a version but no library name, try to identify the library
    if version and not library_name:
        for lib in VULNERABLE_LIBRARIES.keys():
            if lib in url.lower():
                library_name = lib
                break
    
    return library_name, version

def check_library_vulnerability(library: str, version: str) -> Optional[Dict[str, Any]]:
    """
    Check if a library version is vulnerable
    
    Args:
        library: The library name
        version: The library version
    
    Returns:
        Vulnerability info if vulnerable, None otherwise
    """
    if library.lower() not in VULNERABLE_LIBRARIES:
        return None
    
    lib_info = VULNERABLE_LIBRARIES[library.lower()]
    
    # Check if this exact version is in the vulnerable versions list
    if version in lib_info['versions']:
        return lib_info
    
    # If not, do a smart comparison to check if this version is older than the newest vulnerable version
    try:
        # Parse version numbers
        version_parts = [int(part) for part in version.split('.')]
        
        # Check against each vulnerable version
        for vuln_version in lib_info['versions']:
            try:
                vuln_version_parts = [int(part) for part in vuln_version.split('.')]
                
                # Compare version numbers
                is_older = False
                for i in range(max(len(version_parts), len(vuln_version_parts))):
                    v1 = version_parts[i] if i < len(version_parts) else 0
                    v2 = vuln_version_parts[i] if i < len(vuln_version_parts) else 0
                    
                    if v1 < v2:
                        is_older = True
                        break
                    elif v1 > v2:
                        is_older = False
                        break
                
                if not is_older:
                    # This version is newer or the same as the vulnerable version
                    return lib_info
            except:
                # If we can't parse the vulnerable version, skip it
                continue
    except:
        # If we can't parse the version, be cautious and return as vulnerable
        return lib_info
    
    return None
