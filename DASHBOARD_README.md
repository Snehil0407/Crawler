# WebSentinals - Web Vulnerability Scanner Dashboard

A professional web vulnerability scanner and audit platform that provides comprehensive security analysis of websites with a beautiful, modern dashboard interface.

![WebSentinals Dashboard](https://via.placeholder.com/800x400/667eea/ffffff?text=WebSentinals+Dashboard)

## Features

### 🔒 Security Analysis
- **OWASP Top 10 Coverage**: Complete analysis of all OWASP Top 10 vulnerabilities
- **SQL Injection Detection**: Advanced payload testing for SQL injection vulnerabilities
- **Cross-Site Scripting (XSS)**: Comprehensive XSS vulnerability detection
- **Security Headers Analysis**: Missing security headers detection and recommendations
- **Authentication Failures**: Detection of authentication and session management issues
- **Cryptographic Failures**: Analysis of encryption and cryptographic implementations

### 🎨 Professional Dashboard
- **Real-time Scanning**: Live progress updates during vulnerability scans
- **Beautiful Charts**: Interactive pie charts and bar graphs for vulnerability visualization
- **Severity-based Classification**: Critical, High, Medium, and Low severity categorization
- **Detailed Reports**: Comprehensive vulnerability details with remediation steps
- **Recent Scans History**: Track and review previous security assessments

### 🚀 Technical Features
- **Firebase Integration**: Cloud-based result storage and real-time synchronization
- **Multi-threaded Scanning**: Efficient concurrent scanning for faster results
- **Form Analysis**: Automated testing of web forms for security vulnerabilities
- **Link Crawling**: Comprehensive website crawling and analysis
- **JSON API**: RESTful API for integration with other tools

## Technology Stack

### Backend
- **Python**: Core scanning engine with advanced vulnerability detection
- **Node.js**: Express.js API server for handling web requests
- **Firebase**: Realtime database for storing and retrieving scan results

### Frontend
- **HTML5/CSS3**: Modern, responsive design with CSS Grid and Flexbox
- **Vanilla JavaScript**: ES6+ with Firebase SDK integration
- **Chart.js**: Beautiful, interactive charts and visualizations
- **Font Awesome**: Professional iconography

## Installation & Setup

### Prerequisites
- Python 3.8 or higher
- Node.js 16.x or higher
- Firebase project with Realtime Database enabled

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/websentinals.git
cd websentinals
```

### 2. Python Environment Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Configure Python environment (if using conda/venv)
python -m venv websentinals-env
# On Windows:
websentinals-env\Scripts\activate
# On macOS/Linux:
source websentinals-env/bin/activate
```

### 3. Firebase Setup
```bash
# Run Firebase setup script
python setup_firebase_env.py

# This will guide you through:
# - Creating Firebase service account
# - Downloading service account key
# - Setting up environment variables
```

### 4. Backend Setup
```bash
cd backend
npm install

# Copy and configure environment variables
cp .env.template .env
# Edit .env file with your Firebase configuration
```

### 5. Start the Application
```bash
# Start the backend server (from backend directory)
npm start

# Or for development with auto-reload:
npm run dev
```

### 6. Access the Dashboard
Open your web browser and navigate to:
```
http://localhost:3000
```

## Usage

### 1. Starting a Vulnerability Scan
1. Enter the target website URL in the dashboard input field
2. Click "Start Scan" button
3. Monitor real-time progress in the status indicator
4. View results automatically when scan completes

### 2. Viewing Scan Results
- **Overview Statistics**: Critical, High, Medium, Low severity counts
- **Vulnerability Charts**: Visual representation of security issues
- **Detailed Vulnerability List**: Expandable items with full details
- **Recent Scans**: History of previous security assessments

### 3. Understanding Results
Each vulnerability includes:
- **Severity Level**: Risk assessment (Critical/High/Medium/Low)
- **Description**: What the vulnerability is and why it matters
- **Affected URL**: Specific location where the issue was found
- **Payload**: The test payload that revealed the vulnerability (if applicable)
- **Recommendation**: Step-by-step remediation guidance
- **Potential Impact**: What could happen if the vulnerability is exploited

## API Endpoints

### Scan Management
- `POST /api/start-scan`: Start a new vulnerability scan
- `GET /api/scan/:scanId/status`: Get current scan status
- `GET /api/scan/:scanId/results`: Retrieve scan results
- `POST /api/scan/:scanId/stop`: Stop an active scan

### Data Retrieval
- `GET /api/scans`: List all recent scans
- `GET /api/active-scans`: Get currently running scans
- `GET /api/health`: Health check endpoint

### Example API Usage
```javascript
// Start a scan
const response = await fetch('/api/start-scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://example.com' })
});

const result = await response.json();
console.log('Scan ID:', result.scanId);
```

## Configuration

### Scanner Configuration
Modify scanner settings in `main.py`:
```python
config.set('max_depth', 3)          # Maximum crawl depth
config.set('max_pages', 100)        # Maximum pages to scan
config.set('threads', 4)            # Number of concurrent threads
config.set('scan_delay', 1.0)       # Delay between requests (seconds)
config.set('request_timeout', 30)   # Request timeout (seconds)
```

### OWASP Top 10 Modules
Enable/disable specific vulnerability checks:
```python
config.set('scan_broken_access', True)      # A01: Broken Access Control
config.set('scan_crypto_failures', True)    # A02: Cryptographic Failures
config.set('scan_insecure_design', True)    # A04: Insecure Design
config.set('scan_forms', True)              # Form vulnerability testing
config.set('scan_headers', True)            # Security header analysis
```

## Project Structure

```
websentinals/
├── frontend/                 # Dashboard frontend
│   ├── index.html           # Main HTML file
│   ├── styles.css           # CSS styling
│   └── app.js               # JavaScript application logic
├── backend/                 # Node.js API server
│   ├── server.js            # Express.js server
│   ├── package.json         # Node.js dependencies
│   └── .env                 # Environment configuration
├── scanner/                 # Python scanning engine
│   ├── scanner.py           # Main scanner class
│   ├── crawler.py           # Web crawler
│   ├── sqli.py              # SQL injection detection
│   ├── xss_scanner.py       # XSS vulnerability detection
│   └── [other modules]      # Additional vulnerability scanners
├── firebase/                # Firebase integration
│   ├── firebase_service.py  # Firebase service class
│   └── serviceAccountKey.json # Firebase credentials
├── main.py                  # Main Python entry point
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## Security Considerations

### Ethical Usage
- Only scan websites you own or have explicit permission to test
- Respect robots.txt and website terms of service
- Use reasonable delays between requests to avoid overloading servers
- Report vulnerabilities responsibly through proper disclosure channels

### Data Protection
- Scan results are stored in Firebase with appropriate access controls
- No sensitive data (passwords, tokens) should be logged or stored
- Consider implementing additional encryption for sensitive scan results

## Troubleshooting

### Common Issues

#### 1. Firebase Connection Issues
```bash
# Verify Firebase credentials
python test_firebase.py

# Regenerate service account key if needed
python setup_firebase_env.py
```

#### 2. Python Module Errors
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Check Python version
python --version  # Should be 3.8+
```

#### 3. Scanner Timeout Issues
```bash
# Increase timeout in scanner configuration
config.set('request_timeout', 60)  # Increase to 60 seconds
```

#### 4. Node.js Server Issues
```bash
# Clear Node modules and reinstall
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Debug Mode
Enable verbose logging for troubleshooting:
```bash
# Run scanner with verbose output
python main.py --verbose --url https://example.com
```

## Contributing

We welcome contributions to WebSentinals! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines
- Follow PEP 8 for Python code
- Use ESLint for JavaScript code formatting
- Add tests for new vulnerability detection modules
- Update documentation for new features

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **OWASP Foundation** for vulnerability classification standards
- **Firebase Team** for cloud infrastructure
- **Chart.js Community** for visualization tools
- **Open Source Security Community** for inspiration and best practices

## Roadmap

### Version 2.0 Planned Features
- [ ] **PDF Report Generation**: Professional security assessment reports
- [ ] **Email Notifications**: Automated alerts for critical vulnerabilities
- [ ] **Multi-target Scanning**: Batch scanning of multiple websites
- [ ] **Custom Payloads**: User-defined test payloads for specialized testing
- [ ] **Integration APIs**: Webhook support for CI/CD pipelines
- [ ] **Advanced Analytics**: Trend analysis and vulnerability tracking over time

### Long-term Goals
- [ ] **Machine Learning Integration**: AI-powered vulnerability detection
- [ ] **Mobile App**: iOS/Android companion app for on-the-go monitoring
- [ ] **Enterprise Features**: Role-based access, team collaboration, compliance reporting
- [ ] **Plugin System**: Extensible architecture for custom vulnerability modules

## Support

For support and questions:
- **GitHub Issues**: [Create an issue](https://github.com/yourusername/websentinals/issues)
- **Documentation**: Check this README and inline code comments
- **Community**: Join discussions in the GitHub repository

---

**WebSentinals** - Making the web a safer place, one scan at a time. 🛡️
