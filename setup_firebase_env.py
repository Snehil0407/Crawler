#!/usr/bin/env python
"""
This script helps users set up their environment variables for Firebase.
It reads a service account key JSON file and outputs the commands to set
environment variables for different shells.
"""

import argparse
import json
import base64
import os
import sys

def generate_env_commands(key_file, shell_type):
    """Generate environment variable commands for the specified shell"""
    try:
        with open(key_file, 'r') as f:
            creds = json.load(f)
    except Exception as e:
        print(f"Error reading service account key file: {e}")
        return None
    
    # Base64 encode the private key to preserve newlines
    private_key_b64 = base64.b64encode(creds['private_key'].encode('utf-8')).decode('utf-8')
    
    # Create environment variables
    env_vars = {
        'FIREBASE_PROJECT_ID': creds['project_id'],
        'FIREBASE_PRIVATE_KEY_ID': creds['private_key_id'],
        'FIREBASE_PRIVATE_KEY': private_key_b64,
        'FIREBASE_CLIENT_EMAIL': creds['client_email'],
        'FIREBASE_CLIENT_ID': creds['client_id'],
        'FIREBASE_AUTH_DOMAIN': f"{creds['project_id']}.firebaseapp.com",
        'FIREBASE_DATABASE_URL': f"https://{creds['project_id']}-default-rtdb.firebaseio.com",
        'FIREBASE_STORAGE_BUCKET': f"{creds['project_id']}.appspot.com"
    }
    
    # Generate commands for the specified shell
    if shell_type == 'powershell':
        commands = [f'$env:{key}="{value}"' for key, value in env_vars.items()]
        return ';\n'.join(commands)
    elif shell_type == 'cmd':
        commands = [f'SET {key}={value}' for key, value in env_vars.items()]
        return '\n'.join(commands)
    elif shell_type == 'bash':
        commands = [f'export {key}="{value}"' for key, value in env_vars.items()]
        return '\n'.join(commands)
    elif shell_type == 'env':
        # Create a .env file
        commands = [f'{key}={value}' for key, value in env_vars.items()]
        return '\n'.join(commands)
    else:
        print(f"Unsupported shell type: {shell_type}")
        return None

def main():
    parser = argparse.ArgumentParser(description='Generate environment variable commands from a Firebase service account key file.')
    parser.add_argument('key_file', help='Path to the service account key JSON file')
    parser.add_argument('--shell', choices=['powershell', 'cmd', 'bash', 'env'], default='env', 
                        help='Shell type for command format (default: env file format)')
    parser.add_argument('--output', help='Output file (if not specified, prints to stdout)')
    
    args = parser.parse_args()
    
    commands = generate_env_commands(args.key_file, args.shell)
    if not commands:
        sys.exit(1)
    
    if args.output:
        with open(args.output, 'w') as f:
            f.write(commands)
        print(f"Commands written to {args.output}")
    else:
        print(commands)

if __name__ == "__main__":
    main()
