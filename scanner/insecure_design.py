"""
A04 - Insecure Design Scanner Module
"""
from typing import Dict, List, Any
import requests
import re
import time
from bs4 import BeautifulSoup

def check_csrf_protection(form: Dict[str, Any], response_text: str) -> bool:
    """
    Check if a form has CSRF protection
    
    Args:
        form: The form data
        response_text: The HTML response text
    
    Returns:
        True if CSRF protection is present, False otherwise
    """
    # Look for common CSRF token names in form inputs
    csrf_input_names = [
        'csrf', 'csrf_token', 'csrfmiddlewaretoken', '_csrf', 'xsrf', 
        'token', '_token', 'authenticity_token', 'csrf-token',
        '__requestverificationtoken'
    ]
    
    # Check form inputs for CSRF tokens
    for input_field in form['inputs']:
        input_name = input_field.get('name', '').lower()
        if any(csrf_name in input_name for csrf_name in csrf_input_names):
            return True
    
    # Check for hidden meta tags with CSRF tokens
    soup = BeautifulSoup(response_text, 'html.parser')
    meta_tags = soup.find_all('meta')
    
    for tag in meta_tags:
        if tag.get('name') and 'csrf' in tag.get('name').lower():
            return True
    
    # Check for CSRF tokens in HTTP headers
    csrf_header_names = ['X-CSRF-TOKEN', 'X-XSRF-TOKEN']
    for header in csrf_header_names:
        if header.lower() in response_text.lower():
            return True
    
    return False

def check_rate_limiting(form: Dict[str, Any], session: requests.Session, log_func=None) -> bool:
    """
    Check if a form has rate limiting by submitting multiple times
    
    Args:
        form: The form data
        session: The requests session
        log_func: Optional logging function
    
    Returns:
        True if rate limiting is present, False otherwise
    """
    # Only test POST forms (GET forms typically don't modify data)
    if form['method'].lower() != 'post':
        return True
    
    # Skip forms with file uploads or without inputs
    has_file_upload = any(input_field.get('type') == 'file' for input_field in form['inputs'])
    if has_file_upload or not form['inputs']:
        return True
    
    # Prepare test data
    data = {}
    for input_field in form['inputs']:
        field_type = input_field.get('type', '').lower()
        field_name = input_field.get('name', '')
        
        # Skip submit buttons
        if field_type in ['submit', 'button', 'image', 'reset']:
            continue
            
        # Generate appropriate test values based on input type
        if field_type == 'email':
            data[field_name] = f'test{int(time.time())}@example.com'
        elif field_type == 'password':
            data[field_name] = 'TestPassword123!'
        elif field_type == 'number':
            data[field_name] = '123'
        elif field_type == 'checkbox' or field_type == 'radio':
            data[field_name] = input_field.get('value', 'on')
        else:
            data[field_name] = f'Test value {int(time.time())}'
    
    # Skip if no data to submit
    if not data:
        return True
        
    # Try submitting the form multiple times
    successful_submissions = 0
    rate_limited = False
    
    try:
        for i in range(3):  # Try 3 submissions
            if log_func:
                log_func(f"Testing rate limiting - attempt {i+1} for {form['action']}")
                
            response = session.post(
                form['action'],
                data=data,
                timeout=10,
                allow_redirects=True
            )
            
            # Check if submission was successful (not a 4xx or 5xx error)
            if response.status_code < 400:
                successful_submissions += 1
            
            # Check for rate limiting response
            if response.status_code == 429:  # Too Many Requests
                rate_limited = True
                break
                
            # Check for other rate limiting indicators in response
            rate_limit_indicators = [
                'rate limit', 'too many requests', 'try again later',
                'slow down', 'too many attempts', 'temporary block'
            ]
            
            if any(indicator in response.text.lower() for indicator in rate_limit_indicators):
                rate_limited = True
                break
                
            # Short delay between submissions
            time.sleep(1)
    
    except Exception as e:
        if log_func:
            log_func(f"Error testing rate limiting: {str(e)}")
        return True  # Assume rate limiting exists if test fails
    
    # If all 3 submissions were successful and no rate limiting was detected
    return rate_limited or successful_submissions < 3

def check_insecure_design(url: str, form: Dict[str, Any], response: requests.Response, session: requests.Session, log_func=None) -> List[Dict[str, Any]]:
    """
    Check for insecure design issues
    
    Args:
        url: The URL being checked
        form: The form data
        response: The HTTP response
        session: The requests session
        log_func: Optional logging function
    
    Returns:
        List of vulnerabilities found
    """
    vulnerabilities = []
    
    # Only check forms with a valid action URL
    if not form.get('action'):
        return []
        
    # Check for CSRF protection
    has_csrf = check_csrf_protection(form, response.text)
    if not has_csrf:
        vuln_data = {
            'type': 'insecure_design_csrf',
            'url': url,
            'details': {
                'form_action': form['action'],
                'form_method': form['method'],
                'description': 'Form missing CSRF protection',
                'severity': 'Medium',
                'recommendation': 'Implement CSRF tokens for all state-changing forms',
                'consequences': 'Without CSRF protection, attackers can trick users into submitting unauthorized requests'
            }
        }
        vulnerabilities.append(vuln_data)
        
        if log_func:
            log_func(f"Found insecure design: No CSRF protection for form at {url}")
    
    # Check for rate limiting
    has_rate_limiting = check_rate_limiting(form, session, log_func)
    if not has_rate_limiting:
        vuln_data = {
            'type': 'insecure_design_no_rate_limiting',
            'url': url,
            'details': {
                'form_action': form['action'],
                'form_method': form['method'],
                'description': 'Form missing rate limiting protection',
                'severity': 'Medium',
                'recommendation': 'Implement rate limiting for all forms to prevent abuse',
                'consequences': 'Without rate limiting, attackers can flood your application with requests, leading to DoS conditions or automated attacks'
            }
        }
        vulnerabilities.append(vuln_data)
        
        if log_func:
            log_func(f"Found insecure design: No rate limiting for form at {url}")
    
    return vulnerabilities
