# crawler/config.py

import os
from typing import Dict, Any
import json

def load_payloads(filename: str) -> list:
    """Load payloads from a file in the payloads directory"""
    payloads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'payloads')
    filepath = os.path.join(payloads_dir, filename)
    
    try:
        with open(filepath, 'r') as f:
            payloads = [line.strip() for line in f if line.strip()]
        return payloads
    except FileNotFoundError:
        print(f"Warning: Payloads file '{filename}' not found. Using default payloads.")
        if 'sql' in filename.lower():
            return [
                "' OR 1=1--",
                "' OR 1=1#",
                "' OR 1=1/*"
            ]
        elif 'xss' in filename.lower():
            return [
                "<script>alert(1)</script>",
                "<img src=x onerror=alert(1)>",
                "<svg onload=alert(1)>",
                "javascript:alert(1)",
                "<body onload=alert(1)>"
            ]
        return []

class ScannerConfig:
    def __init__(self, config_file: str = None):
        self.config: Dict[str, Any] = {
            # Crawler settings
            'max_depth': 3,
            'max_pages': 100,
            'request_timeout': 30,
            'user_agent': 'Scanner/1.0',
            'follow_redirects': True,
            'verify_ssl': True,
            
            # Scanner settings
            'threads': 4,
            'scan_delay': 1.0,  # seconds between requests
            'max_retries': 3,
            
            # Output settings
            'output_dir': 'scan_results',
            'log_file': 'scanner.log',
            
            # Authentication
            'auth_required': False,
            'auth_url': '',
            'auth_username': '',
            'auth_password': '',
            
            # Scan options
            'scan_forms': True,
            'scan_links': True,
            'scan_headers': True,
            'scan_cookies': True,
            'scan_xss': True,
            
            # OWASP Top 10 scan options
            'scan_broken_access': True,  # A01
            'scan_crypto_failures': True,  # A02
            'scan_insecure_design': True,  # A04
            
            # Custom headers
            'custom_headers': {},
            
            # Proxy settings
            'use_proxy': False,
            'proxy_url': '',
            
            # Rate limiting
            'rate_limit': 0,  # requests per second, 0 for no limit
            
            # Excluded paths
            'excluded_paths': [],
            
            # Included paths
            'included_paths': [],
            
            # Custom payloads
            'sql_payloads': [
                "' OR '1'='1",
                "' OR '1'='1' --",
                "' OR '1'='1' #",
                "' OR '1'='1'/*",
                "admin' --",
                "admin' #",
                "admin'/*",
                "' OR 1=1--",
                "' OR 1=1#",
                "' OR 1=1/*"
            ],            # Scanner payloads
            'sql_payloads': load_payloads('sql.txt'),
            'xss_payloads': load_payloads('xss.txt')
        }
        
        # Load from environment variables
        self._load_from_env()
        
        # Load from config file if provided
        if config_file:
            self._load_from_file(config_file)
    
    def _load_from_env(self):
        """Load configuration from environment variables"""
        env_mapping = {
            'SCANNER_MAX_DEPTH': ('max_depth', int),
            'SCANNER_MAX_PAGES': ('max_pages', int),
            'SCANNER_TIMEOUT': ('request_timeout', int),
            'SCANNER_USER_AGENT': ('user_agent', str),
            'SCANNER_FOLLOW_REDIRECTS': ('follow_redirects', bool),
            'SCANNER_VERIFY_SSL': ('verify_ssl', bool),
            'SCANNER_THREADS': ('threads', int),
            'SCANNER_DELAY': ('scan_delay', float),
            'SCANNER_MAX_RETRIES': ('max_retries', int),
            'SCANNER_OUTPUT_DIR': ('output_dir', str),
            'SCANNER_LOG_FILE': ('log_file', str),
            'SCANNER_AUTH_REQUIRED': ('auth_required', bool),
            'SCANNER_AUTH_URL': ('auth_url', str),
            'SCANNER_AUTH_USERNAME': ('auth_username', str),
            'SCANNER_AUTH_PASSWORD': ('auth_password', str),
            'SCANNER_USE_PROXY': ('use_proxy', bool),
            'SCANNER_PROXY_URL': ('proxy_url', str),
            'SCANNER_RATE_LIMIT': ('rate_limit', int)
        }
        
        for env_var, (config_key, type_cast) in env_mapping.items():
            if env_var in os.environ:
                try:
                    self.config[config_key] = type_cast(os.environ[env_var])
                except ValueError:
                    print(f"Warning: Invalid value for {env_var}")
    
    def _load_from_file(self, config_file: str):
        """Load configuration from JSON file"""
        try:
            with open(config_file, 'r') as f:
                file_config = json.load(f)
                self.config.update(file_config)
        except Exception as e:
            print(f"Error loading config file: {e}")
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value"""
        return self.config.get(key, default)
    
    def set(self, key: str, value: Any):
        """Set configuration value"""
        self.config[key] = value
    
    def save(self, config_file: str):
        """Save configuration to file"""
        try:
            with open(config_file, 'w') as f:
                json.dump(self.config, f, indent=4)
        except Exception as e:
            print(f"Error saving config file: {e}")
    
    def get_all(self) -> Dict[str, Any]:
        """Get all configuration values"""
        return self.config.copy()

    def load_payloads(filename: str) -> list:
        """Load payloads from a file in the payloads directory"""
        payloads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'payloads')
        filepath = os.path.join(payloads_dir, filename)
        
        try:
            with open(filepath, 'r') as f:
                payloads = [line.strip() for line in f if line.strip()]
            return payloads
        except FileNotFoundError:
            print(f"Warning: Payloads file '{filename}' not found. Using default payloads.")
            if 'sql' in filename.lower():
                return [
                    "' OR 1=1--",
                    "' OR 1=1#",
                    "' OR 1=1/*"
                ]
            elif 'xss' in filename.lower():
                return [
                    "<script>alert(1)</script>",
                    "<img src=x onerror=alert(1)>",
                    "<svg onload=alert(1)>",
                    "javascript:alert(1)",
                    "<body onload=alert(1)>"
                ]
            return []

# Target settings
TARGET_DOMAIN    = os.getenv("TARGET_DOMAIN", "https://example.com")

# Scanning parameters
MAX_THREADS      = int(os.getenv("MAX_THREADS", 5))
REQUEST_TIMEOUT  = int(os.getenv("REQUEST_TIMEOUT", 10))  # seconds

# Authentication (placeholders)
LOGIN_URL        = os.getenv("LOGIN_URL", "")
USERNAME         = os.getenv("LOGIN_USER", "")
PASSWORD         = os.getenv("LOGIN_PASS", "")
