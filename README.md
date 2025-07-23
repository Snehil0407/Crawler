# Web Scanner Tool

A comprehensive web scanner tool for detecting common web vulnerabilities including SQL injection, XSS, and security headers.

## Features

- Web crawling with customizable depth
- SQL injection detection
- Enhanced Cross-site scripting (XSS) detection
  - Reflected XSS detection in forms and URL parameters
  - Comprehensive XSS payload testing
  - Context-aware vulnerability assessment
- Missing security headers detection
- Form scanning and analysis
- Firebase integration for result storage
- OWASP Top 10 Vulnerability Detection:
  - A01 - Broken Access Control
    - Detection of improperly protected restricted areas
    - Unauthorized access testing
  - A02 - Cryptographic Failures
    - HTTPS implementation checking
    - Insecure cookie attribute detection
    - TLS version validation
  - A04 - Insecure Design
    - CSRF token validation
    - Rate limiting detection
  - A05 - Security Misconfiguration
    - Missing security headers detection
    - Open directory listing identification
    - Verbose error messages/stack traces detection
    - Default configuration files checking
  - A06 - Vulnerable and Outdated Components
    - JavaScript/CSS library version extraction
    - Known vulnerable library version detection
    - Outdated and deprecated component identification
  - A07 - Identification and Authentication Failures
    - Login form protection analysis
    - Missing CAPTCHA/rate limiting detection
    - Default credential checking
    - Missing 2FA for admin interfaces
  - A08 - Software and Data Integrity Failures
    - Missing Subresource Integrity (SRI) checks
    - Insecure script loading (HTTP vs HTTPS)
    - Insecure package source detection
  - A09 - Security Logging and Monitoring Failures
    - Login monitoring/audit trail detection
    - Failed login attempt monitoring
    - Account lockout testing
  - A10 - Server-Side Request Forgery (SSRF)
    - URL parameter SSRF testing
    - Form input SSRF testing
    - API endpoint SSRF vulnerability detection

## Setup

### Prerequisites

- Python 3.9+
- Firebase project with Realtime Database

### Installation

1. Clone the repository
2. Install dependencies:

```bash
pip install -r requirements.txt
```

### Firebase Setup

This scanner stores all scan results in Firebase Realtime Database. To set up Firebase securely:

#### Option 1: Using Environment Variables with .env file (Recommended)

This method uses a .env file for local development and environment variables for production:

1. Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Realtime Database in your project
3. Generate a service account key:
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Download the JSON file
4. Copy the `.env.template` file to `.env`
   ```bash
   cp .env.template .env
   ```
5. Fill in your Firebase credentials in the `.env` file

The `.env` file is already in `.gitignore` to ensure credentials aren't committed to the repository.

#### Option 2: Using System Environment Variables (Recommended for Production)

For production deployment, set the environment variables directly in your system or deployment platform:

1. Set the following environment variables:
   ```
   FIREBASE_API_KEY=your_api_key
   FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   FIREBASE_APP_ID=your_app_id
   FIREBASE_MEASUREMENT_ID=your_measurement_id
   FIREBASE_PRIVATE_KEY_ID=your_private_key_id
   FIREBASE_PRIVATE_KEY=your_base64_encoded_private_key
   FIREBASE_CLIENT_EMAIL=your_client_email
   FIREBASE_CLIENT_ID=your_client_id
   ```
   
   To encode your private key as base64 (preserves newlines):
   ```bash
   # On Windows PowerShell
   $privateKey = Get-Content -Path "path\to\key.txt" -Raw
   [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($privateKey))
   
   # On Linux/Mac
   cat path/to/key.txt | base64
   ```

#### Option 2: Using Service Account Key File (Development Only)

For local development only:

1. Rename `firebase/serviceAccountKey.template.json` to `firebase/serviceAccountKey.json`
2. Update it with your Firebase service account credentials
3. Add `firebase/serviceAccountKey.json` to your `.gitignore` file (already done)

**⚠️ WARNING: Never commit service account credentials to Git repositories!**

## Usage

Run the scanner with:

```bash
python main.py
```

When prompted, enter the target URL to scan.

## Configuration

The scanner can be configured in `main.py` by modifying the following settings:

- `max_depth`: Maximum crawling depth (default: 3)
- `max_pages`: Maximum number of pages to scan (default: 100)
- `threads`: Number of concurrent threads (default: 4)
- `scan_delay`: Delay between requests in seconds (default: 1.0)
- `request_timeout`: Request timeout in seconds (default: 30)
- `verify_ssl`: Whether to verify SSL certificates (default: True)
- `follow_redirects`: Whether to follow redirects (default: True)

## Scan Results

All scan results are stored in Firebase Realtime Database under the 'scans' collection with the following structure:

```
scans/
  [scan_id]/
    timestamp: "2025-06-17T10:30:45.123456"
    summary: {...}
    vulnerabilities: [...]
    scanned_links: [...]
    scanned_forms: [...]
```

Each scan is assigned a unique ID that can be used to retrieve the results later. The scan ID is displayed in the console output after a scan is completed.

## XSS Detection Features

The scanner includes a sophisticated XSS (Cross-Site Scripting) detection module that:

1. **Comprehensive Detection:** Scans both form inputs and URL parameters for XSS vulnerabilities
2. **Advanced Payloads:** Tests with a comprehensive list of XSS payloads targeting different contexts
3. **Context Analysis:** Identifies the context where XSS payloads are reflected (script, attribute, HTML)
4. **Detailed Reporting:** Provides detailed information about detected vulnerabilities including:
   - Vulnerability type and severity
   - Affected parameters/inputs
   - XSS type (script tag, event handler, etc.)
   - Layman explanation of consequences if not fixed
5. **Bypass Detection:** Identifies successful attempts to bypass basic XSS filters

The scanner integrates these results with Firebase for centralized vulnerability management.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
