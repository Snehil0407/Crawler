const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Increase timeout for long-running scans
app.use((req, res, next) => {
    req.setTimeout(0); // No timeout
    res.setTimeout(0); // No timeout
    next();
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Initialize Firebase Admin SDK
let firebaseInitialized = false;

function initializeFirebase() {
    if (firebaseInitialized) return;
    
    try {
        // Check if Firebase is already initialized
        if (admin.apps.length === 0) {
            const serviceAccountPath = path.join(__dirname, '../firebase/serviceAccountKey.json');
            const serviceAccount = require(serviceAccountPath);
            
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: process.env.FIREBASE_DATABASE_URL || "https://websentinal-f92ec-default-rtdb.firebaseio.com"
            });
        }
        
        firebaseInitialized = true;
        console.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
        console.error('Error initializing Firebase:', error);
    }
}

// Initialize Firebase
initializeFirebase();

// Authentication middleware
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    // Handle demo user for testing
    if (token === 'demo-token') {
        req.user = {
            uid: 'demo-user-id',
            email: 'admin@websentinals.com'
        };
        return next();
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// Get Firebase database reference
const getDatabase = () => {
    if (!firebaseInitialized) {
        initializeFirebase();
    }
    return admin.database();
};

// Store for active scans
const activeScans = new Map();

// API Routes

// Root route - serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'WebSentinals API',
        version: '1.0.0'
    });
});

// Start scan endpoint
app.post('/api/start-scan', authenticateToken, async (req, res) => {
    try {
        const { url } = req.body;
        const userId = req.user.uid;
        
        if (!url) {
            return res.status(400).json({
                error: 'URL is required',
                success: false
            });
        }
        
        // Validate URL
        try {
            new URL(url);
        } catch (urlError) {
            return res.status(400).json({
                error: 'Invalid URL format',
                success: false
            });
        }
        
        const scanId = uuidv4();
        const timestamp = new Date().toISOString();
        
        // Store scan metadata in Firebase with user association
        const db = getDatabase();
        const scanRef = db.ref(`scans/${scanId}`);
        
        await scanRef.set({
            url: url,
            status: 'running',
            timestamp: timestamp,
            progress: 0,
            userId: userId, // Associate scan with user
            userEmail: req.user.email || 'unknown'
        });
        
        console.log(`Starting scan for URL: ${url} with ID: ${scanId}`);
        
        // Start the Python scanner process
        const pythonScript = path.join(__dirname, '../main.py');
        const scanProcess = spawn('python', [pythonScript, '--url', url, '--scan-id', scanId], {
            cwd: path.join(__dirname, '..'),
            env: { ...process.env, SCAN_ID: scanId, TARGET_URL: url }
        });
        
        // Store the process reference
        activeScans.set(scanId, {
            process: scanProcess,
            startTime: Date.now(),
            url: url,
            status: 'running'
        });
        
        // Handle process output
        scanProcess.stdout.on('data', (data) => {
            console.log(`Scan ${scanId} output:`, data.toString());
        });
        
        scanProcess.stderr.on('data', (data) => {
            console.error(`Scan ${scanId} error:`, data.toString());
        });
        
        // Handle process completion
        scanProcess.on('close', async (code) => {
            console.log(`Scan ${scanId} completed with code ${code}`);
            
            try {
                if (code === 0) {
                    // Scan completed successfully
                    await scanRef.update({
                        status: 'completed',
                        endTime: new Date().toISOString(),
                        exitCode: code
                    });
                } else {
                    // Scan failed
                    await scanRef.update({
                        status: 'failed',
                        endTime: new Date().toISOString(),
                        exitCode: code,
                        error: `Scanner process exited with code ${code}`
                    });
                }
            } catch (updateError) {
                console.error('Error updating scan status:', updateError);
            }
            
            // Remove from active scans
            activeScans.delete(scanId);
        });
        
        // Handle process errors
        scanProcess.on('error', async (error) => {
            console.error(`Failed to start scan ${scanId}:`, error);
            
            try {
                await scanRef.update({
                    status: 'failed',
                    endTime: new Date().toISOString(),
                    error: error.message
                });
            } catch (updateError) {
                console.error('Error updating scan status:', updateError);
            }
            
            activeScans.delete(scanId);
        });
        
        res.json({
            success: true,
            scanId: scanId,
            message: 'Scan started successfully',
            timestamp: timestamp
        });
        
    } catch (error) {
        console.error('Error starting scan:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            success: false
        });
    }
});

// Get scan status endpoint
app.get('/api/scan/:scanId/status', authenticateToken, async (req, res) => {
    try {
        const { scanId } = req.params;
        const userId = req.user.uid;
        
        const db = getDatabase();
        const scanRef = db.ref(`scans/${scanId}`);
        const snapshot = await scanRef.once('value');
        const scanData = snapshot.val();
        
        if (!scanData) {
            return res.status(404).json({
                error: 'Scan not found',
                success: false
            });
        }
        
        // Check if scan belongs to the user
        if (scanData.userId !== userId) {
            return res.status(403).json({
                error: 'Access denied - scan belongs to another user',
                success: false
            });
        }
        
        res.json({
            success: true,
            scanId: scanId,
            status: scanData.status,
            data: scanData
        });
        
    } catch (error) {
        console.error('Error getting scan status:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            success: false
        });
    }
});

// Get scan results endpoint
app.get('/api/scan/:scanId/results', authenticateToken, async (req, res) => {
    try {
        const { scanId } = req.params;
        const userId = req.user.uid;
        
        const db = getDatabase();
        const scanRef = db.ref(`scans/${scanId}`);
        const snapshot = await scanRef.once('value');
        const scanData = snapshot.val();
        
        if (!scanData) {
            return res.status(404).json({
                error: 'Scan not found',
                success: false
            });
        }
        
        // Check if scan belongs to the user
        if (scanData.userId !== userId) {
            return res.status(403).json({
                error: 'Access denied - scan belongs to another user',
                success: false
            });
        }
        
        res.json({
            success: true,
            scanId: scanId,
            results: scanData
        });
        
    } catch (error) {
        console.error('Error getting scan results:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            success: false
        });
    }
});

// List all scans endpoint (user-specific)
app.get('/api/scans', authenticateToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const userId = req.user.uid;
        
        const db = getDatabase();
        // Get all scans and filter by user
        const scansRef = db.ref('scans').orderByChild('userId').equalTo(userId);
        const snapshot = await scansRef.once('value');
        const scans = snapshot.val() || {};
        
        // Convert to array and sort by timestamp (newest first)
        const scanArray = Object.entries(scans).map(([id, data]) => ({
            id,
            ...data
        })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, limit); // Apply limit after sorting
        
        res.json({
            success: true,
            scans: scanArray,
            count: scanArray.length
        });
        
    } catch (error) {
        console.error('Error listing scans:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            success: false
        });
    }
});

// Get recent scans for dashboard endpoint (user-specific)
app.get('/api/dashboard/recent-scans', authenticateToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const userId = req.user.uid;
        
        const db = getDatabase();
        // Get user's scans and filter completed ones
        const scansRef = db.ref('scans').orderByChild('userId').equalTo(userId);
        const snapshot = await scansRef.once('value');
        const scans = snapshot.val() || {};
        
        // Convert to array, filter completed scans, and sort by timestamp (newest first)
        const scanArray = Object.entries(scans)
            .map(([id, data]) => ({
                id,
                ...data
            }))
            .filter(scan => scan.status === 'completed')
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
        
        res.json({
            success: true,
            scans: scanArray,
            count: scanArray.length
        });
        
    } catch (error) {
        console.error('Error listing recent scans for dashboard:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            success: false
        });
    }
});

// Stop scan endpoint
app.post('/api/scan/:scanId/stop', async (req, res) => {
    try {
        const { scanId } = req.params;
        
        const activeScan = activeScans.get(scanId);
        if (!activeScan) {
            return res.status(404).json({
                error: 'Active scan not found',
                success: false
            });
        }
        
        // Kill the Python process
        activeScan.process.kill('SIGTERM');
        
        // Update Firebase
        const db = getDatabase();
        const scanRef = db.ref(`scans/${scanId}`);
        await scanRef.update({
            status: 'stopped',
            endTime: new Date().toISOString()
        });
        
        activeScans.delete(scanId);
        
        res.json({
            success: true,
            message: 'Scan stopped successfully',
            scanId: scanId
        });
        
    } catch (error) {
        console.error('Error stopping scan:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            success: false
        });
    }
});

// Get active scans endpoint
app.get('/api/active-scans', (req, res) => {
    try {
        const activeScansArray = Array.from(activeScans.entries()).map(([id, data]) => ({
            scanId: id,
            url: data.url,
            status: data.status,
            startTime: data.startTime,
            duration: Date.now() - data.startTime
        }));
        
        res.json({
            success: true,
            activeScans: activeScansArray,
            count: activeScansArray.length
        });
        
    } catch (error) {
        console.error('Error getting active scans:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            success: false
        });
    }
});

// Delete scan endpoint
app.delete('/api/scan/:scanId', authenticateToken, async (req, res) => {
    try {
        const { scanId } = req.params;
        const userId = req.user.uid;
        
        // Check if scan is currently active
        if (activeScans.has(scanId)) {
            return res.status(400).json({
                error: 'Cannot delete active scan',
                message: 'Please stop the scan before deleting it',
                success: false
            });
        }
        
        const db = getDatabase();
        const scanRef = db.ref(`scans/${scanId}`);
        
        // Check if scan exists
        const snapshot = await scanRef.once('value');
        if (!snapshot.exists()) {
            return res.status(404).json({
                error: 'Scan not found',
                message: 'The specified scan does not exist',
                success: false
            });
        }
        
        const scanData = snapshot.val();
        
        // Check if scan belongs to the user
        if (scanData.userId !== userId) {
            return res.status(403).json({
                error: 'Access denied - scan belongs to another user',
                success: false
            });
        }
        
        // Delete the scan from Firebase
        await scanRef.remove();
        
        res.json({
            success: true,
            message: 'Scan deleted successfully',
            scanId: scanId
        });
        
    } catch (error) {
        console.error('Error deleting scan:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            success: false
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        success: false
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: 'The requested endpoint does not exist',
        success: false
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`WebSentinals backend server running on port ${PORT}`);
    console.log(`Frontend available at: http://localhost:${PORT}`);
    console.log(`API available at: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    
    // Stop all active scans
    activeScans.forEach((scan, scanId) => {
        console.log(`Stopping scan ${scanId}...`);
        scan.process.kill('SIGTERM');
    });
    
    process.exit(0);
});

module.exports = app;
