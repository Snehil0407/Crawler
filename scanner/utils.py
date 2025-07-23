import re
import urllib.parse
from typing import Dict, List, Optional, Tuple
import requests
from bs4 import BeautifulSoup
import hashlib
import json
from datetime import datetime

def normalize_url(url: str) -> str:
    """Normalize URL by removing fragments and normalizing path"""
    parsed = urllib.parse.urlparse(url)
    # Remove fragment
    parsed = parsed._replace(fragment='')
    # Normalize path
    path = parsed.path
    if not path:
        path = '/'
    # Remove trailing slash
    if path.endswith('/') and len(path) > 1:
        path = path[:-1]
    parsed = parsed._replace(path=path)
    return urllib.parse.urlunparse(parsed)

def is_valid_url(url: str) -> bool:
    """Check if URL is valid"""
    try:
        result = urllib.parse.urlparse(url)
        return all([result.scheme, result.netloc])
    except:
        return False

def get_base_url(url: str) -> str:
    """Get base URL (scheme + netloc)"""
    parsed = urllib.parse.urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}"

def is_same_domain(url1: str, url2: str) -> bool:
    """Check if two URLs belong to the same domain"""
    return get_base_url(url1) == get_base_url(url2)

def extract_links(html: str, base_url: str) -> List[str]:
    """Extract all links from HTML content"""
    soup = BeautifulSoup(html, 'html.parser')
    links = []
    
    for tag in soup.find_all(['a', 'link', 'script', 'img']):
        href = tag.get('href') or tag.get('src')
        if href:
            # Handle relative URLs
            if not href.startswith(('http://', 'https://')):
                href = urllib.parse.urljoin(base_url, href)
            # Remove fragments and normalize
            href = normalize_url(href)
            if is_valid_url(href) and is_same_domain(href, base_url):
                links.append(href)
    
    return list(set(links))  # Remove duplicates

def extract_forms(html: str, base_url: str) -> List[Dict]:
    """Extract all forms from HTML content"""
    soup = BeautifulSoup(html, 'html.parser')
    forms = []
    
    for form in soup.find_all('form'):
        form_data = {
            'action': form.get('action', ''),
            'method': form.get('method', 'get').lower(),
            'inputs': []
        }
        
        # Handle relative form action
        if form_data['action']:
            if not form_data['action'].startswith(('http://', 'https://')):
                form_data['action'] = urllib.parse.urljoin(base_url, form_data['action'])
        else:
            form_data['action'] = base_url
        
        # Extract form inputs
        for input_tag in form.find_all(['input', 'textarea', 'select']):
            input_data = {
                'type': input_tag.get('type', 'text'),
                'name': input_tag.get('name', ''),
                'value': input_tag.get('value', '')
            }
            if input_data['name']:  # Only include inputs with names
                form_data['inputs'].append(input_data)
        
        forms.append(form_data)
    
    return forms

def generate_hash(content: str) -> str:
    """Generate SHA-256 hash of content"""
    return hashlib.sha256(content.encode()).hexdigest()

def parse_cookies(cookie_str: str) -> Dict[str, str]:
    """Parse cookie string into dictionary"""
    cookies = {}
    if cookie_str:
        for cookie in cookie_str.split(';'):
            if '=' in cookie:
                name, value = cookie.strip().split('=', 1)
                cookies[name] = value
    return cookies

def format_timestamp(timestamp: datetime) -> str:
    """Format timestamp for logging"""
    return timestamp.strftime('%Y-%m-%d %H:%M:%S')

def save_json(data: Dict, filename: str):
    """Save data to JSON file"""
    with open(filename, 'w') as f:
        json.dump(data, f, indent=4)

def load_json(filename: str) -> Dict:
    """Load data from JSON file"""
    with open(filename, 'r') as f:
        return json.load(f)

def get_response_time(response: requests.Response) -> float:
    """Get response time in seconds"""
    return response.elapsed.total_seconds()

def is_error_response(response: requests.Response) -> bool:
    """Check if response indicates an error"""
    return response.status_code >= 400

def get_error_type(response: requests.Response) -> str:
    """Get error type from response"""
    if response.status_code >= 500:
        return 'server_error'
    elif response.status_code >= 400:
        return 'client_error'
    return 'unknown'

def extract_headers(response: requests.Response) -> Dict[str, Dict]:
    """Extract security-related headers from response and identify missing ones"""
    security_headers = {
        'X-Frame-Options': {
            'description': 'Protects against clickjacking attacks',
            'consequences': 'Without this header, attackers could embed your site in a malicious webpage and trick users into clicking on elements they didn\'t intend to, potentially leading to unwanted actions or data theft.'
        },
        'X-Content-Type-Options': {
            'description': 'Prevents MIME-sniffing attacks',
            'consequences': 'Without this header, browsers might interpret files as a different type than what you intended, allowing attackers to potentially execute malicious scripts even when they shouldn\'t be executable.'
        },
        'X-XSS-Protection': {
            'description': 'Provides protection against cross-site scripting',
            'consequences': 'Without this header, malicious scripts could be injected into your webpage and execute in users\' browsers, potentially stealing cookies, session tokens, or other sensitive information.'
        },
        'Content-Security-Policy': {
            'description': 'Controls resources the browser is allowed to load',
            'consequences': 'Without this header, your site could load resources from any source, making it vulnerable to script injection attacks that could compromise user data or take control of page behavior.'
        },
        'Strict-Transport-Security': {
            'description': 'Forces HTTPS connections',
            'consequences': 'Without this header, communications between your site and users might be downgraded to insecure HTTP, allowing attackers to intercept and modify data in transit, or perform man-in-the-middle attacks.'
        },
        'Referrer-Policy': {
            'description': 'Controls how much referrer information is included with requests',
            'consequences': 'Without this header, sensitive information might be leaked in the referrer header when users navigate from your site to other sites, potentially exposing private data or user activity.'
        }
    }
    
    found_headers = {}
    missing_headers = {}
    
    for header, info in security_headers.items():
        if header in response.headers:
            found_headers[header] = response.headers[header]
        else:
            missing_headers[header] = info
    
    return {
        'found': found_headers,
        'missing': missing_headers
    }

def is_vulnerable_to_xss(response: requests.Response, payload: str) -> bool:
    """Check if response indicates XSS vulnerability"""
    try:
        from .xss_scanner import is_vulnerable_to_xss_advanced
        return is_vulnerable_to_xss_advanced(response, payload)
    except ImportError:
        # Fallback to basic detection if the advanced module isn't available
        return payload in response.text

def is_vulnerable_to_sql_injection(response: requests.Response, payload: str) -> bool:
    """Check if response indicates SQL injection vulnerability"""
    # Common SQL error messages
    sql_errors = [
        'SQL syntax',
        'mysql_fetch_array',
        'mysql_fetch_assoc',
        'mysql_num_rows',
        'mysql_result',
        'mysql_query',
        'mysql error',
        'ORA-',
        'SQLite/JDBCDriver',
        'SQLite.Exception',
        'System.Data.SQLite.SQLiteException',
        'Warning: mysql_',
        'PostgreSQL.*ERROR',
        'Warning.*pg_',
        'valid PostgreSQL result',
        'Npgsql.',
        'Microsoft SQL Server',
        'ODBC SQL Server Driver',
        'SQLServer JDBC Driver',
        'com.microsoft.sqlserver.jdbc',
        'SQLServerException',
        'SQLServer JDBC Driver',
        'SQLServerDriver',
        'SQLServer',
        'SQLite/JDBCDriver',
        'SQLite.Exception',
        'System.Data.SQLite.SQLiteException',
        'Warning: mysql_',
        'valid MySQL result',
        'check the manual that corresponds to your (MySQL|MariaDB) server version',
        'Unknown column',
        'MySqlClient.',
        'com.mysql.jdbc.exceptions'
    ]
    
    content = response.text.lower()
    return any(error.lower() in content for error in sql_errors)
