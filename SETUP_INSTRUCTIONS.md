# WebSentinals Dashboard Setup Guide

## Quick Start Instructions

### Step 1: Install Dependencies

#### Install Node.js Dependencies
```bash
cd backend
npm install
```

#### Install Python Dependencies (if not already done)
```bash
pip install -r requirements.txt
```

### Step 2: Firebase Configuration

1. **Update Firebase Config** in `frontend/app.js`:
   - Replace the placeholder values in `firebaseConfig` with your actual Firebase configuration
   - You can find these in your Firebase Console > Project Settings > General tab

2. **Setup Firebase Service Account** (if not already done):
   ```bash
   python setup_firebase_env.py
   ```

### Step 3: Start the Dashboard

#### Option A: Using the Startup Script (Windows)
```bash
start_dashboard.bat
```

#### Option B: Manual Start
```bash
cd backend
npm start
```

### Step 4: Access the Dashboard
Open your web browser and navigate to:
```
http://localhost:3000
```

## Dashboard Features

### 🎯 Main Features
1. **URL Scanner**: Enter any website URL to start a comprehensive vulnerability scan
2. **Real-time Progress**: Watch your scan progress with live updates
3. **Beautiful Visualizations**: Interactive charts showing vulnerability distribution
4. **Detailed Results**: Click on any vulnerability to see detailed information
5. **Recent Scans**: View and reload results from previous scans

### 📊 Dashboard Components

#### 1. Scanner Input
- Enter target website URL
- Click "Start Scan" to begin analysis
- Monitor real-time progress with status updates

#### 2. Statistics Cards
- **Critical**: Most severe security issues requiring immediate attention
- **High**: Significant vulnerabilities that should be addressed quickly
- **Medium**: Important issues that should be fixed soon
- **Low**: Minor issues or informational findings

#### 3. Vulnerability Charts
- **Pie Chart**: Distribution of vulnerabilities by severity
- **Bar Chart**: OWASP Top 10 category breakdown

#### 4. Vulnerability List
- Expandable vulnerability items with full details
- Filter by severity level
- Click to open detailed modal with remediation steps

#### 5. Recent Scans
- History of previous scans
- Click to reload any previous scan results
- Shows scan duration and vulnerability counts

### 🔍 Understanding Scan Results

Each vulnerability includes:
- **Type**: Category of vulnerability (XSS, SQL Injection, etc.)
- **Severity**: Risk level (Critical/High/Medium/Low)
- **Description**: What the vulnerability is and why it matters
- **URL**: Specific page or endpoint where the issue was found
- **Payload**: The test data that revealed the vulnerability (if applicable)
- **Recommendation**: Step-by-step instructions to fix the issue
- **Potential Impact**: What could happen if the vulnerability is exploited

### 🛠️ Troubleshooting

#### Common Issues:

1. **Scan doesn't start**:
   - Check if the URL is valid and includes http:// or https://
   - Ensure Python dependencies are installed
   - Check console for error messages

2. **Firebase connection issues**:
   - Verify Firebase configuration in `frontend/app.js`
   - Run `python test_firebase.py` to test connection
   - Check if service account key is properly configured

3. **Charts not displaying**:
   - Refresh the page
   - Check browser console for JavaScript errors
   - Ensure Chart.js is loading properly

4. **Scan results not updating**:
   - Check Firebase connection
   - Verify scan is actually running (check console logs)
   - Try refreshing the recent scans list

#### Debug Mode:
To see detailed logs, open your browser's Developer Tools (F12) and check the Console tab.

### 🚀 Advanced Usage

#### API Integration
The dashboard provides REST API endpoints for integration:

```javascript
// Start a scan programmatically
fetch('/api/start-scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://example.com' })
})
.then(response => response.json())
.then(data => console.log('Scan started:', data.scanId));
```

#### Custom Scanning Configuration
Modify scan parameters in `main.py`:
- `max_depth`: How deep to crawl the website
- `max_pages`: Maximum number of pages to scan
- `threads`: Number of concurrent scanning threads
- `scan_delay`: Delay between requests (be respectful!)

### 📱 Responsive Design
The dashboard is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

### 🔒 Security & Ethics
**Important**: Only scan websites you own or have explicit permission to test. This tool is for security professionals, developers, and website owners to improve their security posture.

---

## Support
If you encounter any issues:
1. Check the console logs in your browser (F12)
2. Verify all dependencies are installed
3. Ensure Firebase is properly configured
4. Check that Python and Node.js are working correctly

Happy scanning! 🛡️
