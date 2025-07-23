"""
A01 - Broken Access Control Scanner Module
"""
from typing import Dict, List, Any, Tuple
import requests

# Common restricted endpoints that should require authentication
RESTRICTED_ENDPOINTS = [
    '/admin',
    '/dashboard',
    '/config',
    '/settings',
    '/hidden',
    '/administrator',
    '/admin-panel',
    '/backend',
    '/cp',
    '/management',
    '/moderator',
    '/webadmin',
    '/control',
    '/superuser',
    '/supervisor',
    '/wp-admin',
    '/adminpanel',
    '/admin-dashboard',
    '/manager',
    '/panel',
    '/admin.php',
    '/admin/index.php',
    '/login.php?admin=true'
]

def check_access_control(url: str, session: requests.Session, log_func=None) -> List[Dict[str, Any]]:
    """
    Check for broken access control vulnerabilities
    
    Args:
        url: The base URL to check
        session: The requests session to use
        log_func: Optional logging function
    
    Returns:
        List of vulnerabilities found
    """
    from urllib.parse import urlparse, urljoin
    
    vulnerabilities = []
    base_url = url
    parsed_url = urlparse(url)
    
    # Extract the base domain
    if parsed_url.path:
        base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
        
    if log_func:
        log_func(f"Checking broken access control for {base_url}")
    
    # Test each restricted endpoint
    for endpoint in RESTRICTED_ENDPOINTS:
        target_url = urljoin(base_url, endpoint)
        
        try:
            # Make request without authentication
            response = session.get(
                target_url, 
                timeout=10,
                allow_redirects=True
            )
            
            # Check if access was granted when it shouldn't be
            access_granted = False
            status_code = response.status_code
            
            # Consider it vulnerable if:
            # 1. Status code is 200 OK
            # 2. Not redirected to login page
            # 3. Response contains admin-like keywords
            if status_code == 200:
                admin_indicators = [
                    'admin', 'dashboard', 'manage', 'control panel', 
                    'settings', 'configuration', 'config', 'setup',
                    'administrator', 'superuser', 'moderator'
                ]
                
                content_lower = response.text.lower()
                
                # Check if response contains admin page indicators but not login forms
                has_admin_content = any(indicator in content_lower for indicator in admin_indicators)
                has_login_form = 'login' in content_lower and ('password' in content_lower or 'username' in content_lower)
                
                access_granted = has_admin_content and not has_login_form
            
            if access_granted or status_code == 200:
                vuln_data = {
                    'type': 'broken_access_control',
                    'url': target_url,
                    'details': {
                        'status_code': status_code,
                        'access_granted': access_granted,
                        'description': f"Unrestricted access to {endpoint} endpoint",
                        'severity': 'High',
                        'recommendation': "Implement proper authentication and authorization checks for restricted areas",
                        'consequences': "Unauthorized access to admin or restricted functionality, potentially leading to data breach or system compromise"
                    }
                }
                vulnerabilities.append(vuln_data)
                
                if log_func:
                    log_func(f"Found broken access control vulnerability: {target_url}")
                    
        except Exception as e:
            if log_func:
                log_func(f"Error checking broken access control for {target_url}: {str(e)}")
    
    return vulnerabilities
