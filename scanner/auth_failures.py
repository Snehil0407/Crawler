"""
A07 - Identification & Authentication Failures Scanner Module
"""
from typing import Dict, List, Any, Optional
import requests
import re
from bs4 import BeautifulSoup
import time
import random
import string

# Common admin login paths to check
ADMIN_LOGIN_PATHS = [
    '/admin',
    '/admin/login',
    '/administrator',
    '/administrator/login',
    '/login',
    '/wp-admin',
    '/wp-login',
    '/wp-login.php',
    '/admin.php',
    '/adminlogin',
    '/admin/login.php',
    '/admin/login.html',
    '/admin/index.php',
    '/panel',
    '/cpanel',
    '/dashboard',
    '/moderator',
    '/webadmin',
    '/adminarea',
    '/bb-admin',
    '/adminLogin',
    '/admin_area',
    '/panel-administracion',
    '/instadmin',
    '/memberadmin',
    '/administratorlogin',
    '/adm',
    '/account/login',
    '/admin/account',
    '/admin_login',
    '/siteadmin',
    '/siteadmin/login',
    '/admin/admin',
    '/moderator/admin',
    '/user/admin',
    '/adminpanel',
    '/super-admin',
]

# Common default credentials to test (only use a few to avoid account lockouts)
DEFAULT_CREDENTIALS = [
    {'username': 'admin', 'password': 'admin'},
    {'username': 'admin', 'password': 'password'},
    {'username': 'admin', 'password': '123456'},
    {'username': 'administrator', 'password': 'administrator'},
]

def check_authentication_failures(url: str, response: requests.Response, session: requests.Session, log_func=None) -> List[Dict[str, Any]]:
    """
    Check for identification and authentication failures
    
    Args:
        url: The URL to check
        response: The HTTP response
        session: The requests session
        log_func: Optional logging function
    
    Returns:
        List of vulnerabilities found
    """
    vulnerabilities = []
    
    if log_func:
        log_func(f"Checking authentication failures for {url}")
    
    # Check for login forms
    login_forms = find_login_forms(response)
    
    for form in login_forms:
        # Check for lack of CAPTCHA
        if not has_captcha(form):
            vuln_data = {
                'type': 'auth_failure_no_captcha',
                'url': url,
                'details': {
                    'description': 'Login form without CAPTCHA protection',
                    'severity': 'Medium',
                    'recommendation': 'Implement CAPTCHA or other anti-automation measures to prevent brute force attacks',
                    'consequences': 'Without CAPTCHA, attackers can automate brute force attacks against user accounts'
                }
            }
            vulnerabilities.append(vuln_data)
            
            if log_func:
                log_func(f"Found login form without CAPTCHA at {url}")
        
        # Check for lack of 2FA
        if not has_2fa_indicators(form, response):
            vuln_data = {
                'type': 'auth_failure_no_2fa',
                'url': url,
                'details': {
                    'description': 'No indication of two-factor authentication',
                    'severity': 'Medium',
                    'recommendation': 'Implement two-factor authentication for sensitive accounts',
                    'consequences': 'Without 2FA, compromised credentials can immediately lead to account takeover'
                }
            }
            vulnerabilities.append(vuln_data)
            
            if log_func:
                log_func(f"No 2FA indicators found at {url}")
        
        # Check for weak password policy
        if has_weak_password_policy(form, response):
            vuln_data = {
                'type': 'auth_failure_weak_password_policy',
                'url': url,
                'details': {
                    'description': 'Weak or non-existent password policy',
                    'severity': 'Medium',
                    'recommendation': 'Implement a strong password policy requiring a minimum length and complexity',
                    'consequences': 'Weak passwords are more susceptible to brute force and dictionary attacks'
                }
            }
            vulnerabilities.append(vuln_data)
            
            if log_func:
                log_func(f"Weak password policy detected at {url}")
        
        # Optionally check for brute force protection by sending a few incorrect login attempts
        if not has_brute_force_protection(form, session, url, log_func):
            vuln_data = {
                'type': 'auth_failure_no_brute_force_protection',
                'url': url,
                'details': {
                    'description': 'No brute force protection detected',
                    'severity': 'High',
                    'recommendation': 'Implement account lockout or rate limiting after multiple failed login attempts',
                    'consequences': 'Without brute force protection, attackers can attempt unlimited password guesses'
                }
            }
            vulnerabilities.append(vuln_data)
            
            if log_func:
                log_func(f"No brute force protection detected at {url}")
    
    # Check for default admin login pages
    if log_func:
        log_func(f"Checking for default admin login pages from {url}")
    
    default_login_vulns = check_default_admin_logins(url, session, log_func)
    vulnerabilities.extend(default_login_vulns)
    
    return vulnerabilities

def find_login_forms(response: requests.Response) -> List[Dict[str, Any]]:
    """
    Find login forms in a response
    
    Args:
        response: The HTTP response
    
    Returns:
        List of login forms found
    """
    login_forms = []
    
    try:
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Look for forms with password fields
        for form in soup.find_all('form'):
            has_password_field = False
            
            for input_field in form.find_all('input'):
                if input_field.get('type') == 'password':
                    has_password_field = True
                    break
            
            if has_password_field:
                # Found a login form
                form_data = {
                    'action': form.get('action', ''),
                    'method': form.get('method', 'get').lower(),
                    'inputs': []
                }
                
                # Extract input fields
                for input_field in form.find_all('input'):
                    input_data = {
                        'name': input_field.get('name', ''),
                        'type': input_field.get('type', 'text'),
                        'value': input_field.get('value', '')
                    }
                    form_data['inputs'].append(input_data)
                
                login_forms.append(form_data)
    
    except Exception as e:
        print(f"Error finding login forms: {str(e)}")
    
    return login_forms

def has_captcha(form: Dict[str, Any]) -> bool:
    """
    Check if a form has CAPTCHA protection
    
    Args:
        form: The form data
    
    Returns:
        True if CAPTCHA is present, False otherwise
    """
    # Look for common CAPTCHA indicators in form inputs
    captcha_indicators = [
        'captcha',
        'recaptcha',
        'g-recaptcha',
        'h-captcha',
        'cf-turnstile'
    ]
    
    for input_field in form['inputs']:
        input_name = input_field.get('name', '').lower()
        input_id = input_field.get('id', '').lower()
        
        for indicator in captcha_indicators:
            if indicator in input_name or indicator in input_id:
                return True
    
    return False

def has_2fa_indicators(form: Dict[str, Any], response: requests.Response) -> bool:
    """
    Check if there are indicators of two-factor authentication
    
    Args:
        form: The form data
        response: The HTTP response
    
    Returns:
        True if 2FA indicators are present, False otherwise
    """
    # Look for common 2FA indicators in the response content
    content = response.text.lower()
    
    twofa_indicators = [
        'two-factor',
        'two factor',
        '2fa',
        'second factor',
        'authentication app',
        'authenticator app',
        'google authenticator',
        'authy',
        'verification code',
        'security code',
        'one-time password',
        'one time password',
        'otp',
        'two-step',
        'two step',
        'multi-factor',
        'multi factor',
        'mfa'
    ]
    
    for indicator in twofa_indicators:
        if indicator in content:
            return True
    
    return False

def has_weak_password_policy(form: Dict[str, Any], response: requests.Response) -> bool:
    """
    Check if there are indicators of a weak password policy
    
    Args:
        form: The form data
        response: The HTTP response
    
    Returns:
        True if weak password policy indicators are present, False otherwise
    """
    # Look for common password policy indicators in the response content
    content = response.text.lower()
    
    strong_policy_indicators = [
        'password must contain',
        'password requirements',
        'password should include',
        'password must include',
        'password must be at least',
        'minimum of',
        'at least one uppercase',
        'at least one lowercase',
        'at least one number',
        'at least one special',
        'password strength',
        'strong password'
    ]
    
    for indicator in strong_policy_indicators:
        if indicator in content:
            return False  # Strong policy found
    
    # No strong policy indicators found
    return True

def has_brute_force_protection(form: Dict[str, Any], session: requests.Session, url: str, log_func=None) -> bool:
    """
    Check if a form has brute force protection by sending a few incorrect login attempts
    
    Args:
        form: The form data
        session: The requests session
        url: The URL of the form
        log_func: Optional logging function
    
    Returns:
        True if brute force protection is detected, False otherwise
    """
    # Only test if we have username and password fields
    username_field = None
    password_field = None
    
    for input_field in form['inputs']:
        if input_field['type'] == 'text' or input_field['type'] == 'email':
            username_field = input_field['name']
        elif input_field['type'] == 'password':
            password_field = input_field['name']
    
    if not username_field or not password_field:
        return False
    
    # Form the action URL
    action_url = form['action']
    if not action_url.startswith(('http://', 'https://')):
        # Relative URL, join with base URL
        from urllib.parse import urljoin
        action_url = urljoin(url, action_url)
    
    # Generate random credentials for testing
    random_username = ''.join(random.choices(string.ascii_lowercase, k=8)) + '@example.com'
    random_password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
    
    # Try a few login attempts with incorrect credentials
    for i in range(3):
        data = {}
        
        # Fill all inputs to avoid missing required fields
        for input_field in form['inputs']:
            if input_field['name']:
                if input_field['name'] == username_field:
                    data[input_field['name']] = random_username
                elif input_field['name'] == password_field:
                    data[input_field['name']] = random_password + str(i)  # Vary password slightly
                elif input_field['type'] not in ['submit', 'button', 'image', 'reset', 'file']:
                    data[input_field['name']] = input_field['value'] or ''
        
        try:
            if log_func:
                log_func(f"Sending test login attempt {i+1} to {action_url}")
            
            if form['method'] == 'post':
                response = session.post(action_url, data=data, allow_redirects=True, timeout=10)
            else:
                response = session.get(action_url, params=data, allow_redirects=True, timeout=10)
            
            # Check for indicators of brute force protection
            if response.status_code == 429:  # Too Many Requests
                return True
            
            content = response.text.lower()
            protection_indicators = [
                'too many attempts',
                'too many login attempts',
                'account locked',
                'account has been locked',
                'try again later',
                'temporary lockout',
                'captcha',
                'recaptcha',
                'too many failed',
                'rate limit',
                'wait before trying',
                'wait for',
                'locked for',
                'security measure'
            ]
            
            for indicator in protection_indicators:
                if indicator in content:
                    return True
            
            # Add a small delay between attempts
            time.sleep(1)
        
        except Exception as e:
            if log_func:
                log_func(f"Error testing brute force protection: {str(e)}")
            return False
    
    # No brute force protection detected
    return False

def check_default_admin_logins(base_url: str, session: requests.Session, log_func=None) -> List[Dict[str, Any]]:
    """
    Check for default admin login pages
    
    Args:
        base_url: The base URL to check from
        session: The requests session
        log_func: Optional logging function
    
    Returns:
        List of vulnerabilities found
    """
    from urllib.parse import urljoin
    vulnerabilities = []
    
    # Extract the base domain
    from urllib.parse import urlparse
    parsed_url = urlparse(base_url)
    base_domain = f"{parsed_url.scheme}://{parsed_url.netloc}"
    
    # Check each admin login path
    for path in ADMIN_LOGIN_PATHS:
        admin_url = urljoin(base_domain, path)
        
        try:
            response = session.get(admin_url, allow_redirects=True, timeout=10)
            
            # Check if it's a login page
            if response.status_code == 200:
                content = response.text.lower()
                login_indicators = [
                    'login', 'sign in', 'username', 'password', 'admin', 'administrator',
                    'log in', 'signin', 'auth', 'authentication', 'credentials'
                ]
                
                is_login_page = False
                for indicator in login_indicators:
                    if indicator in content:
                        is_login_page = True
                        break
                
                if is_login_page:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    # Check if it has login form elements
                    has_form = len(soup.find_all('form')) > 0
                    has_password = len(soup.find_all('input', {'type': 'password'})) > 0
                    
                    if has_form and has_password:
                        vuln_data = {
                            'type': 'auth_failure_default_login_page',
                            'url': admin_url,
                            'details': {
                                'description': f'Default admin login page found at {path}',
                                'severity': 'Medium',
                                'recommendation': 'Change the default admin login URL to a custom path',
                                'consequences': 'Default login pages are prime targets for brute force and credential stuffing attacks'
                            }
                        }
                        vulnerabilities.append(vuln_data)
                        
                        if log_func:
                            log_func(f"Found default admin login page at {admin_url}")
                        
                        # Optionally, we could test for default credentials here
                        # But we'll skip it to avoid lockouts
        
        except Exception as e:
            if log_func:
                log_func(f"Error checking admin login at {admin_url}: {str(e)}")
    
    return vulnerabilities
