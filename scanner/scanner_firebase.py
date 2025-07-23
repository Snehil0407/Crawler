# scanner_firebase.py

import os
import json
import uuid
from datetime import datetime
import sys
import os.path

# Add the parent directory to sys.path to find the firebase module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from firebase.firebase_service import FirebaseService

class ScannerFirebase:
    """Handles Firebase operations for the scanner"""
    
    def __init__(self):
        """Initialize Firebase service"""
        self.firebase = None
        self.initialized = False
        
        try:
            self.firebase = FirebaseService.get_instance()
            self.firebase.initialize()
            self.initialized = True
        except Exception as e:
            print(f"Failed to initialize Firebase: {str(e)}")
    
    def is_initialized(self):
        """Check if Firebase is initialized"""
        return self.initialized and self.firebase is not None
    
    def save_scan_results(self, scan_id, results, logger=None):
        """Save scan results to Firebase"""
        if not self.initialized or not self.firebase:
            if logger:
                logger.error("Firebase not initialized")
            return {
                'success': False,
                'message': 'Firebase not initialized'
            }
            
        # Ensure we have a scan ID
        if not scan_id:
            scan_id = str(uuid.uuid4())
            
        try:
            # Save to Firebase
            result = self.firebase.save_scan_results(scan_id, results)
            
            if logger:
                if result.get('success'):
                    logger.info(f"Results saved to Firebase with scan ID: {scan_id}")
                else:
                    logger.error(f"Failed to save results to Firebase: {result.get('message')}")
            
            return result
        except Exception as e:
            error_msg = f"Error saving to Firebase: {str(e)}"
            if logger:
                logger.error(error_msg)
            return {
                'success': False,
                'message': error_msg
            }
    
    def get_scan_results(self, scan_id, logger=None):
        """Get scan results from Firebase"""
        if not self.initialized or not self.firebase:
            if logger:
                logger.error("Firebase not initialized")
            return None
            
        try:
            return self.firebase.get_scan_results(scan_id)
        except Exception as e:
            if logger:
                logger.error(f"Error retrieving scan results from Firebase: {str(e)}")
            return None
    
    def list_scans(self, limit=10, logger=None):
        """List recent scans from Firebase"""
        if not self.initialized or not self.firebase:
            if logger:
                logger.error("Firebase not initialized")
            return []
            
        try:
            return self.firebase.list_scans(limit)
        except Exception as e:
            if logger:
                logger.error(f"Error listing scans from Firebase: {str(e)}")
            return []
