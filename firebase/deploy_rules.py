#!/usr/bin/env python3
"""
Script to deploy Firebase database rules to fix indexing warnings
"""

import os
import sys
import subprocess
import json

def check_firebase_cli():
    """Check if Firebase CLI is installed"""
    try:
        result = subprocess.run(['firebase', '--version'], 
                              capture_output=True, text=True, check=True)
        print(f"Firebase CLI found: {result.stdout.strip()}")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("Firebase CLI not found. Please install it with:")
        print("npm install -g firebase-tools")
        return False

def login_firebase():
    """Login to Firebase"""
    try:
        result = subprocess.run(['firebase', 'login', '--reauth'], 
                              check=True)
        print("Firebase login successful")
        return True
    except subprocess.CalledProcessError:
        print("Firebase login failed")
        return False

def deploy_database_rules():
    """Deploy database rules to Firebase"""
    try:
        # Change to the project directory
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_dir = os.path.dirname(script_dir)
        os.chdir(project_dir)
        
        # Check if firebase.json exists, if not create it
        firebase_config_path = os.path.join(project_dir, 'firebase.json')
        if not os.path.exists(firebase_config_path):
            firebase_config = {
                "database": {
                    "rules": "firebase/database.rules.json"
                }
            }
            with open(firebase_config_path, 'w') as f:
                json.dump(firebase_config, f, indent=2)
            print("Created firebase.json configuration file")
        
        # Deploy the rules
        result = subprocess.run(['firebase', 'deploy', '--only', 'database'], 
                              check=True, capture_output=True, text=True)
        print("Database rules deployed successfully!")
        print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Failed to deploy database rules: {e}")
        print(f"Error output: {e.stderr}")
        return False

def main():
    """Main function"""
    print("🔥 Firebase Database Rules Deployment Script")
    print("=" * 50)
    
    # Check if Firebase CLI is installed
    if not check_firebase_cli():
        sys.exit(1)
    
    # Login to Firebase
    print("\n📝 Logging into Firebase...")
    if not login_firebase():
        sys.exit(1)
    
    # Deploy database rules
    print("\n🚀 Deploying database rules...")
    if not deploy_database_rules():
        sys.exit(1)
    
    print("\n✅ Database rules deployed successfully!")
    print("\nThe Firebase indexing warning should now be resolved.")
    print("The database will now use proper indexes for timestamp queries.")

if __name__ == "__main__":
    main()
