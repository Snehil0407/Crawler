"""
A10 - Server-Side Request Forgery (SSRF) Scanner Module
"""
from typing import Dict, List, Any, Optional
import requests
import re
import time
from urllib.parse import urlparse, urljoin

# List of common internal/private IP ranges and sensitive hosts
INTERNAL_TARGETS = [
    '127.0.0.1',                # Localhost
    '0.0.0.0',                  # All interfaces
    '10.0.0.1',                 # Private Class A
    '172.16.0.1',               # Private Class B
    '192.168.0.1',              # Private Class C
    '169.254.169.254',          # AWS metadata service
    'localhost',                # Localhost by name
    'metadata.google.internal', # GCP metadata service
    'metadata',                 # Shortened version
    'instance-data',            # EC2 metadata alternative
    '::1'                       # IPv6 localhost
]

# SSRF payloads for testing
SSRF_PAYLOADS = [
    'http://{target}/',
    'https://{target}/',
    'http://{target}:22/',      # SSH
    'http://{target}:3306/',    # MySQL
    'http://{target}:5432/',    # PostgreSQL
    'http://{target}:6379/',    # Redis
    'http://{target}:8080/',    # Common web port
    'http://{target}:8443/',    # Common web port
    'file:///etc/passwd',       # Local file inclusion
    'dict://{target}:11211/',   # Memcached
    'ftp://{target}/'           # FTP
]

# Parameters that are likely to be vulnerable to SSRF
SSRF_PARAMETERS = [
    'url', 'uri', 'link', 'src', 'source', 'redirect', 'redirect_to',
    'return', 'return_to', 'callback', 'endpoint', 'dest', 'destination',
    'load', 'open', 'fetch', 'share', 'preview', 'view', 'goto', 'go',
    'next', 'api', 'resource', 'file', 'data', 'path', 'image', 'img',
    'download', 'upload', 'proxy', 'feed', 'host', 'hostname', 'server',
    'target', 'address', 'domain'
]

def check_ssrf(url: str, response: requests.Response, session: requests.Session, log_func=None) -> List[Dict[str, Any]]:
    """
    Check for Server-Side Request Forgery (SSRF) vulnerabilities
    
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
        log_func(f"Checking for SSRF vulnerabilities at {url}")
    
    # 1. Check URL parameters for potential SSRF
    parsed_url = urlparse(url)
    query_params = parsed_url.query.split('&')
    
    for param in query_params:
        if not param:
            continue
        
        parts = param.split('=', 1)
        if len(parts) != 2:
            continue
        
        param_name, param_value = parts
        
        # If parameter name suggests it might accept a URL
        if any(target in param_name.lower() for target in SSRF_PARAMETERS):
            ssrf_vulns = check_parameter_for_ssrf(url, param_name, param_value, session, log_func)
            vulnerabilities.extend(ssrf_vulns)
    
    # 2. Check forms for potential SSRF
    form_vulns = check_forms_for_ssrf(url, response, session, log_func)
    vulnerabilities.extend(form_vulns)
    
    # 3. Check API endpoints for SSRF
    api_vulns = check_api_for_ssrf(url, session, log_func)
    vulnerabilities.extend(api_vulns)
    
    return vulnerabilities

def check_parameter_for_ssrf(url: str, param_name: str, param_value: str, session: requests.Session, log_func=None) -> List[Dict[str, Any]]:
    """
    Check a URL parameter for SSRF vulnerability
    
    Args:
        url: The original URL
        param_name: The parameter name
        param_value: The parameter value
        session: The requests session
        log_func: Optional logging function
    
    Returns:
        List of vulnerabilities found
    """
    vulnerabilities = []
    
    # Only test parameters that look like they might be URLs
    if not (param_value.startswith('http://') or param_value.startswith('https://') or
            param_value.startswith('//')):
        return vulnerabilities
    
    # Try to inject SSRF payloads
    for target in INTERNAL_TARGETS[:3]:  # Limit targets to reduce requests
        for payload_template in SSRF_PAYLOADS[:3]:  # Limit payloads to reduce requests
            payload = payload_template.format(target=target)
            
            # Replace the original value with our payload
            modified_url = url.replace(f"{param_name}={param_value}", f"{param_name}={payload}")
            
            try:
                # If the URL got corrupted or is too long, skip it
                if len(modified_url) > 2000 or '=' not in modified_url:
                    continue
                
                if log_func:
                    log_func(f"Testing SSRF with payload: {payload} in parameter {param_name}")
                
                # Make the request with the modified parameter
                test_response = session.get(modified_url, timeout=5, allow_redirects=False)
                
                # Check for signs of successful SSRF
                if is_ssrf_successful(test_response):
                    vuln_data = {
                        'type': 'ssrf_url_parameter',
                        'details': {
                            'parameter': param_name,
                            'payload': payload,
                            'original_value': param_value,
                            'description': f"SSRF vulnerability detected in URL parameter '{param_name}'",
                            'severity': 'High',
                            'recommendation': 'Implement URL validation and whitelist of allowed domains/IPs',
                            'consequences': 'SSRF vulnerabilities can allow attackers to make requests to internal services, access sensitive data, or use the server as a proxy for attacks on other systems.'
                        }
                    }
                    vulnerabilities.append(vuln_data)
                    
                    if log_func:
                        log_func(f"SSRF vulnerability found in parameter {param_name} at {url}")
                    
                    # Found a vulnerability, no need to test more payloads for this parameter
                    return vulnerabilities
                
                # Rate limiting
                time.sleep(0.5)
                
            except Exception as e:
                if log_func:
                    log_func(f"Error testing SSRF in parameter {param_name}: {str(e)}")
    
    return vulnerabilities

def check_forms_for_ssrf(url: str, response: requests.Response, session: requests.Session, log_func=None) -> List[Dict[str, Any]]:
    """
    Check forms for SSRF vulnerability
    
    Args:
        url: The URL of the page containing forms
        response: The HTTP response
        session: The requests session
        log_func: Optional logging function
    
    Returns:
        List of vulnerabilities found
    """
    vulnerabilities = []
    
    # Extract forms from the response
    forms = extract_forms(response)
    
    for form in forms:
        form_action = form.get('action', '')
        form_method = form.get('method', 'get').lower()
        
        # Make form action URL absolute if it's relative
        if form_action and not form_action.startswith(('http://', 'https://')):
            form_action = urljoin(url, form_action)
        
        # If form action is empty, use the current URL
        if not form_action:
            form_action = url
        
        # Test each input in the form that might accept URLs
        for input_field in form.get('inputs', []):
            input_name = input_field.get('name', '')
            input_type = input_field.get('type', '').lower()
            
            # Skip submit buttons and hidden fields
            if input_type in ['submit', 'button', 'image', 'hidden']:
                continue
            
            # Check if input name suggests it might accept a URL
            if any(target in input_name.lower() for target in SSRF_PARAMETERS):
                # Try SSRF payloads in this input
                for target in INTERNAL_TARGETS[:2]:  # Limit targets to reduce requests
                    for payload_template in SSRF_PAYLOADS[:2]:  # Limit payloads to reduce requests
                        payload = payload_template.format(target=target)
                        
                        # Prepare form data with our payload
                        form_data = {}
                        for field in form.get('inputs', []):
                            field_name = field.get('name', '')
                            if field_name == input_name:
                                form_data[field_name] = payload
                            elif field.get('type') not in ['submit', 'button', 'image']:
                                # Fill other fields with dummy data
                                form_data[field_name] = 'test'
                        
                        try:
                            if log_func:
                                log_func(f"Testing SSRF with payload: {payload} in form input {input_name}")
                            
                            # Submit the form
                            if form_method == 'get':
                                test_response = session.get(form_action, params=form_data, timeout=5, allow_redirects=False)
                            else:
                                test_response = session.post(form_action, data=form_data, timeout=5, allow_redirects=False)
                            
                            # Check for signs of successful SSRF
                            if is_ssrf_successful(test_response):
                                vuln_data = {
                                    'type': 'ssrf_form_input',
                                    'details': {
                                        'form_action': form_action,
                                        'form_method': form_method,
                                        'input_name': input_name,
                                        'payload': payload,
                                        'description': f"SSRF vulnerability detected in form input '{input_name}'",
                                        'severity': 'High',
                                        'recommendation': 'Implement URL validation and whitelist of allowed domains/IPs',
                                        'consequences': 'SSRF vulnerabilities can allow attackers to make requests to internal services, access sensitive data, or use the server as a proxy for attacks on other systems.'
                                    }
                                }
                                vulnerabilities.append(vuln_data)
                                
                                if log_func:
                                    log_func(f"SSRF vulnerability found in form input {input_name} at {url}")
                                
                                # Found a vulnerability, no need to test more payloads for this input
                                break
                            
                            # Rate limiting
                            time.sleep(0.5)
                            
                        except Exception as e:
                            if log_func:
                                log_func(f"Error testing SSRF in form input {input_name}: {str(e)}")
    
    return vulnerabilities

def check_api_for_ssrf(url: str, session: requests.Session, log_func=None) -> List[Dict[str, Any]]:
    """
    Check API endpoints for SSRF vulnerability
    
    Args:
        url: The URL to check
        session: The requests session
        log_func: Optional logging function
    
    Returns:
        List of vulnerabilities found
    """
    vulnerabilities = []
    
    # Check if URL looks like an API endpoint
    parsed_url = urlparse(url)
    path = parsed_url.path.lower()
    
    if not ('/api' in path or '/v1' in path or '/v2' in path or '/rest' in path or '/graphql' in path):
        return vulnerabilities
    
    # Try common API endpoints that might be vulnerable to SSRF
    api_endpoints = [
        '/fetch', '/proxy', '/import', '/export', '/load', '/url', 
        '/preview', '/download', '/upload', '/webhook', '/callback'
    ]
    
    base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
    
    for endpoint in api_endpoints:
        endpoint_url = urljoin(base_url, endpoint)
        
        # Try SSRF payloads
        for target in INTERNAL_TARGETS[:2]:  # Limit targets to reduce requests
            payload = f"http://{target}/"
            
            # Try as URL parameter
            param_url = f"{endpoint_url}?url={payload}"
            
            try:
                if log_func:
                    log_func(f"Testing SSRF with payload: {payload} at API endpoint {endpoint}")
                
                # GET request
                test_response = session.get(param_url, timeout=5, allow_redirects=False)
                if is_ssrf_successful(test_response):
                    vuln_data = {
                        'type': 'ssrf_api_endpoint',
                        'details': {
                            'endpoint': endpoint,
                            'payload': payload,
                            'method': 'GET',
                            'description': f"SSRF vulnerability detected in API endpoint '{endpoint}'",
                            'severity': 'High',
                            'recommendation': 'Implement URL validation and whitelist of allowed domains/IPs',
                            'consequences': 'SSRF vulnerabilities can allow attackers to make requests to internal services, access sensitive data, or use the server as a proxy for attacks on other systems.'
                        }
                    }
                    vulnerabilities.append(vuln_data)
                    
                    if log_func:
                        log_func(f"SSRF vulnerability found in API endpoint {endpoint} at {url}")
                    
                    # Found a vulnerability, no need to test more payloads for this endpoint
                    break
                
                # Try as JSON payload
                json_data = {'url': payload}
                
                # POST request with JSON
                test_response = session.post(endpoint_url, json=json_data, timeout=5, allow_redirects=False)
                if is_ssrf_successful(test_response):
                    vuln_data = {
                        'type': 'ssrf_api_endpoint',
                        'details': {
                            'endpoint': endpoint,
                            'payload': payload,
                            'method': 'POST',
                            'content_type': 'application/json',
                            'description': f"SSRF vulnerability detected in API endpoint '{endpoint}'",
                            'severity': 'High',
                            'recommendation': 'Implement URL validation and whitelist of allowed domains/IPs',
                            'consequences': 'SSRF vulnerabilities can allow attackers to make requests to internal services, access sensitive data, or use the server as a proxy for attacks on other systems.'
                        }
                    }
                    vulnerabilities.append(vuln_data)
                    
                    if log_func:
                        log_func(f"SSRF vulnerability found in API endpoint {endpoint} at {url}")
                    
                    # Found a vulnerability, no need to test more payloads for this endpoint
                    break
                
                # Rate limiting
                time.sleep(0.5)
                
            except Exception as e:
                if log_func:
                    log_func(f"Error testing SSRF in API endpoint {endpoint}: {str(e)}")
    
    return vulnerabilities

def is_ssrf_successful(response: requests.Response) -> bool:
    """
    Check if SSRF test was successful
    
    Args:
        response: The HTTP response
    
    Returns:
        True if SSRF was successful, False otherwise
    """
    if response is None:
        return False
    
    # Check response code
    if response.status_code in [200, 201, 202]:
        content = response.text.lower()
        
        # Check for indicators of successful SSRF
        ssrf_indicators = [
            # AWS metadata indicators
            r'ami-id|instance-id|instance-type',
            r'availability-zone|region',
            r'security-credentials',
            
            # GCP metadata indicators
            r'project-id|numeric-project-id',
            r'instance/service-accounts',
            
            # Azure metadata indicators
            r'compute.internal|metadata.azure.com',
            r'metadata/instance',
            
            # Common internal service indicators
            r'<html>|<!doctype|<body>',  # HTML responses from internal services
            r'<title>.*dashboard|admin|console',
            r'<h1>.*dashboard|admin|console',
            
            # Database-like responses
            r'mysql|postgresql|oracle|mongodb|redis',
            r'database error|db error|connection error',
            
            # System file indicators (for file:// protocol)
            r'root:|nobody:|daemon:|bin:|sys:',  # /etc/passwd entries
            r'home/[^/]+:|usr/[^/]+:',
            
            # Internal error messages that suggest SSRF worked
            r'internal server error.*url|request to.*failed',
            r'could not connect to|connection refused',
            r'no route to host|host unreachable',
            
            # Port-specific services
            r'ssh-.*key-exchange|protocol mismatch',  # SSH (port 22)
            r'mysql handshake|sql server',  # Database ports
            r'memcached|redis',  # Cache services
        ]
        
        for pattern in ssrf_indicators:
            if re.search(pattern, content):
                return True
    
    return False

def extract_forms(response: requests.Response) -> List[Dict[str, Any]]:
    """
    Extract forms from HTML response
    
    Args:
        response: The HTTP response
    
    Returns:
        List of forms with their attributes
    """
    forms = []
    content = response.text
    
    # Very basic form extraction - in a real scanner, use a proper HTML parser
    form_pattern = r'<form[^>]*action=["\']([^"\']*)["\'][^>]*method=["\']([^"\']*)["\'][^>]*>(.*?)</form>'
    input_pattern = r'<input[^>]*name=["\']([^"\']*)["\'][^>]*type=["\']([^"\']*)["\'][^>]*>'
    
    for form_match in re.finditer(form_pattern, content, re.DOTALL | re.IGNORECASE):
        action = form_match.group(1)
        method = form_match.group(2)
        form_content = form_match.group(3)
        
        inputs = []
        for input_match in re.finditer(input_pattern, form_content, re.DOTALL | re.IGNORECASE):
            name = input_match.group(1)
            input_type = input_match.group(2)
            inputs.append({
                'name': name,
                'type': input_type
            })
        
        forms.append({
            'action': action,
            'method': method,
            'inputs': inputs
        })
    
    return forms
