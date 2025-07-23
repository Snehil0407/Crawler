// WebSentinals Frontend Application
// Firebase configuration for real-time features

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCnRIKn4bhWE5pTEzpdQ2VJF73j4WEv_2w",
  authDomain: "websentinal-f92ec.firebaseapp.com",
  databaseURL: "https://websentinal-f92ec-default-rtdb.firebaseio.com",
  projectId: "websentinal-f92ec",
  storageBucket: "websentinal-f92ec.firebasestorage.app",
  messagingSenderId: "1029931119218",
  appId: "1:1029931119218:web:1b666a2e129560c9d588eb",
  measurementId: "G-7DVNDBSZ6T"
};

// Global variables
let currentScanId = null;
let vulnerabilityChart = null;
let owaspChart = null;
let scanInterval = null;
let firebaseApp = null;
let database = null;

// DOM elements
const urlInput = document.getElementById('urlInput');
const scanBtn = document.getElementById('scanBtn');
const scanStatus = document.getElementById('scanStatus');
const statusText = document.getElementById('statusText');
const progressFill = document.getElementById('progressFill');
const vulnerabilitiesList = document.getElementById('vulnerabilitiesList');
const recentScansList = document.getElementById('recentScansList');
const refreshBtn = document.getElementById('refreshBtn');
const severityFilter = document.getElementById('severityFilter');
const modal = document.getElementById('vulnerabilityModal');

// Statistics counters
const criticalCount = document.getElementById('criticalCount');
const highCount = document.getElementById('highCount');
const mediumCount = document.getElementById('mediumCount');
const lowCount = document.getElementById('lowCount');

// Chart contexts
const vulnerabilityChartCtx = document.getElementById('vulnerabilityChart').getContext('2d');
const owaspChartCtx = document.getElementById('owaspChart').getContext('2d');

// OWASP Top 10 mapping
const owaspMapping = {
    'broken_access_control': 'A01: Broken Access Control',
    'crypto_failures': 'A02: Cryptographic Failures',
    'injection': 'A03: Injection',
    'insecure_design': 'A04: Insecure Design',
    'security_misconfiguration': 'A05: Security Misconfiguration',
    'vulnerable_components': 'A06: Vulnerable Components',
    'auth_failures': 'A07: Auth Failures',
    'integrity_failures': 'A08: Integrity Failures',
    'logging_monitoring': 'A09: Logging & Monitoring',
    'ssrf': 'A10: Server Side Request Forgery',
    'xss': 'A03: Cross-Site Scripting',
    'sql_injection': 'A03: SQL Injection'
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeFirebase();
    initializeEventListeners();
    initializeCharts();
    loadRecentScans();
});

// Initialize Firebase
function initializeFirebase() {
    try {
        // Initialize Firebase for real-time features (optional)
        // The dashboard will work primarily through backend API
        console.log('Firebase config loaded for WebSentinals');
        
        // Note: Full Firebase initialization can be added here if needed
        // for real-time updates from the frontend
        
    } catch (error) {
        console.log('Firebase frontend initialization skipped - using backend API');
    }
}

function initializeEventListeners() {
    scanBtn.addEventListener('click', startScan);
    refreshBtn.addEventListener('click', loadRecentScans);
    severityFilter.addEventListener('change', filterVulnerabilities);
    
    urlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            startScan();
        }
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
}

function initializeCharts() {
    // Vulnerability Distribution Chart
    vulnerabilityChart = new Chart(vulnerabilityChartCtx, {
        type: 'doughnut',
        data: {
            labels: ['Critical', 'High', 'Medium', 'Low'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: [
                    '#ff4757',
                    '#ff6348',
                    '#ffa502',
                    '#2ed573'
                ],
                borderWidth: 0,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            }
        }
    });

    // OWASP Top 10 Chart
    owaspChart = new Chart(owaspChartCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Vulnerabilities Found',
                data: [],
                backgroundColor: '#667eea',
                borderColor: '#764ba2',
                borderWidth: 1,
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

async function startScan() {
    const url = urlInput.value.trim();
    
    if (!url) {
        alert('Please enter a valid URL');
        return;
    }
    
    if (!isValidUrl(url)) {
        alert('Please enter a valid URL (must include http:// or https://)');
        return;
    }
    
    // Update UI
    scanBtn.disabled = true;
    scanBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scanning...';
    scanStatus.style.display = 'block';
    statusText.textContent = 'Initializing scan...';
    progressFill.style.width = '10%';
    
    try {
        // Call backend to start scan
        const response = await fetch('/api/start-scan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });
        
        if (!response.ok) {
            throw new Error('Failed to start scan');
        }
        
        const result = await response.json();
        currentScanId = result.scanId;
        
        // Start monitoring scan progress
        monitorScanProgress(currentScanId);
        
    } catch (error) {
        console.error('Error starting scan:', error);
        alert('Failed to start scan. Please try again.');
        resetScanUI();
    }
}

function monitorScanProgress(scanId) {
    let progress = 10;
    const messages = [
        'Crawling website pages...',
        'Analyzing forms and inputs...',
        'Testing for SQL injection...',
        'Checking for XSS vulnerabilities...',
        'Scanning for security misconfigurations...',
        'Analyzing authentication mechanisms...',
        'Checking cryptographic implementations...',
        'Testing access controls...',
        'Finalizing scan results...'
    ];
    
    scanInterval = setInterval(() => {
        if (progress < 90) {
            progress += Math.random() * 15;
            progressFill.style.width = `${Math.min(progress, 90)}%`;
            
            const messageIndex = Math.floor((progress / 100) * messages.length);
            statusText.textContent = messages[Math.min(messageIndex, messages.length - 1)];
        }
    }, 2000);
    
    // Poll for scan completion
    const pollInterval = setInterval(async () => {
        try {
            const response = await fetch(`/api/scan/${scanId}/status`);
            if (response.ok) {
                const data = await response.json();
                console.log('Scan status:', data); // Debug log
                
                if (data.status === 'completed') {
                    clearInterval(pollInterval);
                    clearInterval(scanInterval);
                    progressFill.style.width = '100%';
                    statusText.textContent = 'Scan completed successfully!';
                    
                    // Get and display results
                    setTimeout(async () => {
                        await loadScanResults(scanId);
                        resetScanUI();
                    }, 1500);
                } else if (data.status === 'failed') {
                    clearInterval(pollInterval);
                    clearInterval(scanInterval);
                    alert('Scan failed: ' + (data.error || 'Unknown error'));
                    resetScanUI();
                } else if (data.status === 'running') {
                    // Update progress based on Firebase data if available
                    if (data.progress && data.progress > 0) {
                        progressFill.style.width = Math.min(data.progress, 90) + '%';
                    }
                    if (data.current_task) {
                        statusText.textContent = data.current_task;
                    }
                }
            }
        } catch (error) {
            console.error('Error polling scan status:', error);
        }
    }, 3000); // Check every 3 seconds
    
    // Timeout after 30 minutes (vulnerability scans can take a long time)
    setTimeout(() => {
        if (scanInterval || pollInterval) {
            clearInterval(scanInterval);
            clearInterval(pollInterval);
            alert('Scan timed out after 30 minutes. The scan may still be running in the background.');
            resetScanUI();
        }
    }, 1800000); // 30 minutes
}

function displayScanResults(scanData) {
    const { summary, vulnerabilities, scanned_links, scanned_forms } = scanData;
    
    // Update statistics
    updateStatistics(vulnerabilities || []);
    
    // Update charts
    updateCharts(vulnerabilities || []);
    
    // Display vulnerabilities
    displayVulnerabilities(vulnerabilities || []);
    
    // Refresh recent scans
    loadRecentScans();
    
    // Show success message
    showNotification('Scan completed successfully!', 'success');
}

function updateStatistics(vulnerabilities) {
    const stats = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
    };
    
    vulnerabilities.forEach(vuln => {
        const severity = getSeverity(vuln);
        stats[severity]++;
    });
    
    // Animate counter updates
    animateCounter(criticalCount, stats.critical);
    animateCounter(highCount, stats.high);
    animateCounter(mediumCount, stats.medium);
    animateCounter(lowCount, stats.low);
}

function updateCharts(vulnerabilities) {
    const severityStats = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
    };
    
    const owaspStats = {};
    
    vulnerabilities.forEach(vuln => {
        const severity = getSeverity(vuln);
        severityStats[severity]++;
        
        const owaspCategory = getOwaspCategory(vuln.type);
        owaspStats[owaspCategory] = (owaspStats[owaspCategory] || 0) + 1;
    });
    
    // Update vulnerability distribution chart
    vulnerabilityChart.data.datasets[0].data = [
        severityStats.critical,
        severityStats.high,
        severityStats.medium,
        severityStats.low
    ];
    vulnerabilityChart.update();
    
    // Update OWASP chart
    const owaspLabels = Object.keys(owaspStats);
    const owaspData = Object.values(owaspStats);
    
    owaspChart.data.labels = owaspLabels;
    owaspChart.data.datasets[0].data = owaspData;
    owaspChart.update();
}

function displayVulnerabilities(vulnerabilities) {
    if (vulnerabilities.length === 0) {
        vulnerabilitiesList.innerHTML = `
            <div class="no-data">
                <i class="fas fa-shield-check"></i>
                <p>Great! No vulnerabilities were found in your website.</p>
            </div>
        `;
        return;
    }
    
    const vulnerabilityItems = vulnerabilities.map(vuln => {
        const severity = getSeverity(vuln);
        return `
            <div class="vulnerability-item fade-in" onclick="showVulnerabilityDetail('${vuln.id || Date.now()}', ${JSON.stringify(vuln).replace(/"/g, '&quot;')})">
                <div class="vulnerability-header">
                    <h4 class="vulnerability-title">${formatVulnerabilityTitle(vuln.type)}</h4>
                    <span class="severity-badge ${severity}">${severity}</span>
                </div>
                <p class="vulnerability-description">${vuln.details?.description || 'No description available'}</p>
                <div class="vulnerability-meta">
                    <span><i class="fas fa-link"></i> ${vuln.url}</span>
                    <span><i class="fas fa-clock"></i> ${formatTimestamp(vuln.timestamp)}</span>
                    ${vuln.details?.form ? `<span><i class="fas fa-wpforms"></i> Form vulnerability</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    vulnerabilitiesList.innerHTML = vulnerabilityItems;
}

function showVulnerabilityDetail(id, vulnerability) {
    const vuln = typeof vulnerability === 'string' ? JSON.parse(vulnerability.replace(/&quot;/g, '"')) : vulnerability;
    
    document.getElementById('modalTitle').textContent = formatVulnerabilityTitle(vuln.type);
    document.getElementById('modalSeverity').textContent = getSeverity(vuln).toUpperCase();
    document.getElementById('modalSeverity').className = `severity-badge ${getSeverity(vuln)}`;
    document.getElementById('modalDescription').textContent = vuln.details?.description || 'No description available';
    document.getElementById('modalUrl').textContent = vuln.url;
    document.getElementById('modalRecommendation').textContent = vuln.details?.recommendation || 'No recommendation available';
    
    // Show/hide optional sections
    if (vuln.details?.payload) {
        document.getElementById('modalPayloadSection').style.display = 'block';
        document.getElementById('modalPayload').textContent = vuln.details.payload;
    } else {
        document.getElementById('modalPayloadSection').style.display = 'none';
    }
    
    if (vuln.details?.consequences) {
        document.getElementById('modalConsequencesSection').style.display = 'block';
        document.getElementById('modalConsequences').textContent = vuln.details.consequences;
    } else {
        document.getElementById('modalConsequencesSection').style.display = 'none';
    }
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

window.closeModal = closeModal;
window.showVulnerabilityDetail = showVulnerabilityDetail;

async function loadRecentScans() {
    try {
        const response = await fetch('/api/scans?limit=5');
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                displayRecentScans(data.scans || []);
            }
        }
    } catch (error) {
        console.error('Error loading recent scans:', error);
    }
}

function displayRecentScans(scans) {
    if (scans.length === 0) {
        recentScansList.innerHTML = `
            <div class="no-data">
                <i class="fas fa-clock"></i>
                <p>No recent scans available.</p>
            </div>
        `;
        return;
    }
    
    const scanItems = scans.map(scan => {
        const totalVulns = scan.summary?.scan_info?.total_vulnerabilities || 0;
        const duration = scan.summary?.scan_info?.duration || 0;
        const url = scan.summary?.scan_info?.target_url || scan.url || 'Unknown URL';
        
        return `
            <div class="scan-item fade-in" onclick="loadHistoricalScan('${scan.id}')">
                <div class="scan-info">
                    <div class="scan-url">${url}</div>
                    <div class="scan-time">${formatTimestamp(scan.timestamp)}</div>
                </div>
                <div class="scan-stats">
                    <div class="scan-stat">
                        <i class="fas fa-bug"></i>
                        ${totalVulns} issues
                    </div>
                    <div class="scan-stat">
                        <i class="fas fa-clock"></i>
                        ${Math.round(duration)}s
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    recentScansList.innerHTML = scanItems;
}

async function loadScanResults(scanId) {
    try {
        const response = await fetch(`/api/scan/${scanId}/results`);
        if (!response.ok) {
            throw new Error('Failed to load results');
        }
        
        const data = await response.json();
        if (data.success && data.results) {
            displayScanResults(data.results);
        }
    } catch (error) {
        console.error('Error loading scan results:', error);
        alert('Failed to load scan results');
    }
}

async function loadHistoricalScan(scanId) {
    await loadScanResults(scanId);
}

window.loadHistoricalScan = loadHistoricalScan;

function filterVulnerabilities() {
    const selectedSeverity = severityFilter.value;
    const items = document.querySelectorAll('.vulnerability-item');
    
    items.forEach(item => {
        const badge = item.querySelector('.severity-badge');
        const itemSeverity = badge.textContent.toLowerCase();
        
        if (selectedSeverity === 'all' || itemSeverity === selectedSeverity) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Utility functions
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function getSeverity(vulnerability) {
    const severity = vulnerability.details?.severity?.toLowerCase() || 'medium';
    return ['critical', 'high', 'medium', 'low'].includes(severity) ? severity : 'medium';
}

function getOwaspCategory(vulnType) {
    for (const [key, category] of Object.entries(owaspMapping)) {
        if (vulnType.includes(key)) {
            return category;
        }
    }
    return 'Other';
}

function formatVulnerabilityTitle(type) {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleString();
}

function animateCounter(element, target) {
    const start = parseInt(element.textContent) || 0;
    const increment = Math.ceil((target - start) / 30);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = current;
    }, 50);
}

function resetScanUI() {
    scanBtn.disabled = false;
    scanBtn.innerHTML = '<i class="fas fa-rocket"></i> Start Scan';
    scanStatus.style.display = 'none';
    progressFill.style.width = '0%';
    currentScanId = null;
    
    if (scanInterval) {
        clearInterval(scanInterval);
        scanInterval = null;
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: type === 'success' ? '#2ed573' : '#667eea',
        color: 'white',
        padding: '15px 20px',
        borderRadius: '10px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        zIndex: '9999',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        animation: 'slideIn 0.3s ease'
    });
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add CSS for notifications
const notificationCSS = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;

const style = document.createElement('style');
style.textContent = notificationCSS;
document.head.appendChild(style);
