# OWASP Top 10 Vulnerability Scanner

This document describes the OWASP Top 10 vulnerability checks implemented in the scanner.

## A01: Broken Access Control

The scanner checks for broken access control vulnerabilities by attempting to access commonly restricted endpoints without authentication.

### What it checks:

- Attempts to access `/admin`, `/dashboard`, `/config`, `/settings`, `/hidden` and other commonly restricted endpoints
- Checks whether access is wrongly granted (e.g., 200 status code or sensitive content found)
- Verifies if authentication is properly enforced for sensitive areas

### Implementation Details

- Module: `broken_access.py`
- Main Function: `check_access_control(url, session, log_func)`
- Detects:
  - Unrestricted access to admin panels
  - Access to sensitive configuration interfaces
  - Unprotected dashboards and settings pages

### Example Vulnerability

```json
{
    "type": "broken_access_control",
    "url": "http://example.com/admin",
    "details": {
        "status_code": 200,
        "access_granted": true,
        "description": "Unrestricted access to /admin endpoint",
        "severity": "High",
        "recommendation": "Implement proper authentication and authorization checks for restricted areas",
        "consequences": "Unauthorized access to admin or restricted functionality, potentially leading to data breach or system compromise"
    }
}
```

## A02: Cryptographic Failures

The scanner checks for cryptographic failures including insecure communications and improper certificate validation.

### What it checks:

- Whether the site uses HTTPS
- If cookies have missing security attributes (Secure, HttpOnly)
- TLS version used (if accessible)

### Implementation Details

- Module: `crypto_failures.py`
- Main Function: `check_cryptographic_failures(url, response, log_func)`
- Detects:
  - Unencrypted HTTP connections
  - Insecure cookies
  - Outdated TLS versions

### Example Vulnerability

```json
{
    "type": "crypto_failure_insecure_cookies",
    "url": "http://example.com/login",
    "details": {
        "insecure_cookies": [
            {
                "name": "session_id",
                "issues": ["Missing Secure flag", "Missing HttpOnly flag"]
            }
        ],
        "description": "Cookies with missing security attributes",
        "severity": "Medium",
        "recommendation": "Set Secure, HttpOnly, and SameSite attributes on cookies",
        "consequences": "Cookies may be stolen via XSS attacks or transmitted over unencrypted connections"
    }
}
```

## A04: Insecure Design

The scanner identifies insecure design issues like missing CSRF protection and rate limiting.

### What it checks:

- Forms missing CSRF tokens
- Absence of rate limiting on sensitive operations (by submitting the same form multiple times)
- Insecure authentication workflows

### Implementation Details

- Module: `insecure_design.py`
- Main Function: `check_insecure_design(url, form, response, session, log_func)`
- Helper Functions:
  - `check_csrf_protection(form, response_text)`
  - `check_rate_limiting(form, session, log_func)`
- Detects:
  - Forms missing CSRF tokens
  - Absence of rate limiting on critical functions

### Example Vulnerability

```json
{
    "type": "insecure_design_no_csrf",
    "url": "http://example.com/update-profile",
    "details": {
        "form_action": "/update-profile",
        "description": "Form missing CSRF protection token",
        "severity": "Medium",
        "recommendation": "Implement CSRF tokens for all state-changing operations",
        "consequences": "Attackers can trick users into performing unwanted actions while authenticated"
    }
}
```

## A05: Security Misconfiguration

The scanner checks for security misconfigurations including missing security headers, open directory listing, and verbose error messages.

### What it checks:

- Missing security headers (Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, HSTS)
- Open directory listing (pages with "Index of" title)
- Verbose error messages or stack traces
- Default configuration files or credentials

### Implementation Details

- Module: `security_misconfiguration.py`
- Main Function: `check_security_misconfiguration(url, response, log_func)`
- Helper Functions:
  - `check_missing_headers(response)`
  - `has_directory_listing(response)`
  - `has_verbose_errors(response)`
  - `has_default_configs(url, response)`
- Detects:
  - Missing security headers
  - Exposed directory listings
  - Detailed error messages
  - Default configuration files

### Example Vulnerability

```json
{
    "type": "security_misconfiguration_missing_header",
    "url": "http://example.com/login",
    "details": {
        "header": "Content-Security-Policy",
        "description": "Missing Content-Security-Policy header: Helps prevent XSS and data injection attacks",
        "severity": "High",
        "recommendation": "Implement a strict Content-Security-Policy",
        "consequences": "Without CSP, the site is more vulnerable to cross-site scripting (XSS) attacks"
    }
}
```
  - Insecure authentication workflows

### Example Vulnerability

```json
{
    "type": "insecure_design_csrf",
    "url": "http://example.com/update_profile",
    "details": {
        "form_action": "/update_profile",
        "form_method": "POST",
        "description": "Form missing CSRF protection",
        "severity": "Medium",
        "recommendation": "Implement CSRF tokens for all state-changing forms",
        "consequences": "Without CSRF protection, attackers can trick users into submitting unauthorized requests"
    }
}
```

## Integration with Scanner

The scanner integrates these modules by:

1. Loading them conditionally with try/except blocks
2. Adding configuration options to enable/disable each check
3. Running appropriate checks during the scanning process
4. Storing results in the same format as other vulnerabilities

## Testing

The test application (`test_app/app.py`) includes intentional vulnerabilities for each of these categories to verify that the scanner correctly identifies them.

## Firebase Integration

Scan results for these new vulnerability types are stored in Firebase using the same format and structure as the existing vulnerabilities, ensuring compatibility with the existing reporting system.

- Attempts to access a predefined list of restricted endpoints (e.g., `/admin`, `/dashboard`, `/config`)
- Evaluates the response to determine if access was incorrectly granted
- Examines content for indications of administrative interfaces
- Identifies potential privilege escalation opportunities

### Configuration:

```python
config.set('scan_broken_access', True)  # Enable/disable broken access control scanning
```

### Implementation:

The scanner uses the `broken_access.py` module to:

1. Generate a list of target restricted URLs derived from the base URL
2. Make unauthenticated requests to each target
3. Analyze responses for status codes and content that indicates improper access
4. Report detected vulnerabilities with detailed information and remediation advice

## A02: Cryptographic Failures

The scanner checks for cryptographic failures including missing HTTPS, insecure cookies, and outdated TLS versions.

### What it checks:

- Verifies if the site uses HTTPS
- Checks cookies for missing security attributes:
  - Secure flag
  - HttpOnly flag
  - SameSite attribute
- Optionally analyzes TLS version to identify outdated implementations

### Configuration:

```python
config.set('scan_crypto_failures', True)  # Enable/disable cryptographic failures scanning
```

### Implementation:

The scanner uses the `crypto_failures.py` module to:

1. Check if the URL uses HTTPS
2. Examine cookies from responses for security attributes
3. Optionally validate TLS version through socket connections
4. Report each type of cryptographic failure as a separate vulnerability

## A04: Insecure Design

The scanner checks for insecure design issues including missing CSRF protections and lack of rate limiting.

### What it checks:

- Analyzes forms for missing CSRF tokens
- Tests for rate limiting by submitting the same form multiple times
- Identifies implementation flaws that could lead to abuse

### Configuration:

```python
config.set('scan_insecure_design', True)  # Enable/disable insecure design scanning
```

### Implementation:

The scanner uses the `insecure_design.py` module to:

1. Check forms for CSRF token presence
2. Test rate limiting by submitting multiple requests
3. Analyze responses for indicators of protection mechanisms
4. Report detected vulnerabilities with severity ratings and remediation advice

## Usage Example

To enable all OWASP Top 10 checks in your scanner configuration:

```python
from scanner import Scanner, ScannerConfig

# Configure scanner
config = ScannerConfig()

# Enable OWASP Top 10 checks
config.set('scan_broken_access', True)  # A01
config.set('scan_crypto_failures', True)  # A02
config.set('scan_insecure_design', True)  # A04

# Create scanner with configuration
scanner = Scanner(config)

# Start scan
scan_id = scanner.start_scan("https://example.com")

# Get results
results = scanner.get_results()
```

## Interpreting Results

Each vulnerability is reported with:

- Vulnerability type
- Affected URL
- Timestamp
- Detailed information:
  - Description
  - Severity (High, Medium, Low)
  - Recommendation for fixing the issue
  - Potential consequences if not addressed

The results are available in both programmatic form and saved to JSON files for further analysis.
