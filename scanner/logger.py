import logging
import sys
from datetime import datetime
import os

class ScannerLogger:
    def __init__(self, log_file=None):
        self.logger = logging.getLogger('scanner')
        self.logger.setLevel(logging.DEBUG)
        
        # Create formatters
        file_formatter = logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s'
        )
        console_formatter = logging.Formatter(
            '%(levelname)s: %(message)s'
        )
        
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.INFO)
        console_handler.setFormatter(console_formatter)
        self.logger.addHandler(console_handler)
        
        # File handler
        if log_file:
            os.makedirs(os.path.dirname(log_file), exist_ok=True)
            file_handler = logging.FileHandler(log_file)
            file_handler.setLevel(logging.DEBUG)
            file_handler.setFormatter(file_formatter)
            self.logger.addHandler(file_handler)
    
    def debug(self, message):
        self.logger.debug(message)
    
    def info(self, message):
        self.logger.info(message)
    
    def warning(self, message):
        self.logger.warning(message)
    
    def error(self, message):
        self.logger.error(message)
    
    def critical(self, message):
        self.logger.critical(message)
    
    def vulnerability(self, message):
        """Special method for logging vulnerabilities"""
        self.logger.warning(f"VULNERABILITY: {message}")
    
    def scan_start(self, url):
        """Log scan start"""
        self.info(f"Starting scan of {url}")
    
    def scan_complete(self, stats):
        """Log scan completion with statistics"""
        self.info("Scan completed")
        self.info(f"Statistics: {stats}")
    
    def form_found(self, form_data):
        """Log discovered form"""
        self.debug(f"Found form: {form_data}")
    
    def link_found(self, url):
        """Log discovered link"""
        self.debug(f"Found link: {url}")
    
    def vulnerability_found(self, vuln_data):
        """Log discovered vulnerability"""
        self.vulnerability(f"Found vulnerability: {vuln_data}")
    
    def login_success(self, username):
        """Log successful login"""
        self.info(f"Successfully logged in as {username}")
    
    def login_failure(self, username):
        """Log failed login"""
        self.warning(f"Failed to login as {username}")
    
    def request_error(self, url, error):
        """Log request error"""
        self.error(f"Error requesting {url}: {error}")
    
    def scan_progress(self, current, total):
        """Log scan progress"""
        self.info(f"Progress: {current}/{total} URLs scanned") 