#!/usr/bin/env python3
"""
Deploy Firestore Security Rules to Firebase
This script deploys the firestore.rules file to Firebase
"""

import subprocess
import sys
import os

def run_command(command, shell=False):
    """Run a command and return the result"""
    try:
        result = subprocess.run(
            command,
            shell=shell,
            check=True,
            capture_output=True,
            text=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {e}")
        print(f"Error output: {e.stderr}")
        return None

def main():
    print("\033[96mDeploying Firestore Security Rules...\033[0m")
    
    # Check if Firebase CLI is installed
    firebase_version = run_command(['firebase', '--version'])
    if firebase_version:
        print(f"\033[92mFirebase CLI version: {firebase_version}\033[0m")
    else:
        print("\033[91mError: Firebase CLI is not installed or not in PATH\033[0m")
        print("\033[93mPlease install Firebase CLI: npm install -g firebase-tools\033[0m")
        sys.exit(1)
    
    # Check if firestore.rules exists
    if not os.path.exists('firestore.rules'):
        print("\033[91mError: firestore.rules file not found\033[0m")
        sys.exit(1)
    
    print()
    print("\033[93mDeploying Firestore rules only...\033[0m")
    
    # Deploy only Firestore rules (not database rules)
    result = run_command(['firebase', 'deploy', '--only', 'firestore:rules'])
    if result is not None:
        print()
        print("\033[92mFirestore security rules deployed successfully!\033[0m")
        print("\033[92mUsers can now create accounts and access their data.\033[0m")
    else:
        print("\033[91mError deploying Firestore rules\033[0m")
        print("\033[93mMake sure you're logged in with: firebase login\033[0m")
        sys.exit(1)

if __name__ == '__main__':
    main()
