# Firebase Setup Instructions

You're seeing a Firebase initialization error because your Firebase service account credentials are not properly set up. This document will guide you through the process of setting up Firebase credentials correctly.

## Step 1: Obtain a Firebase Service Account Key

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project (websentinal-f92ec)
3. Go to Project Settings (gear icon) > Service accounts
4. Click on "Generate new private key"
5. Save the downloaded JSON file securely

## Step 2: Set Up Environment Variables

Use the provided `setup_firebase_env.py` script to set up environment variables from your service account key file:

### For PowerShell (Windows):

```powershell
python setup_firebase_env.py path/to/your/serviceAccountKey.json --shell powershell > firebase_env.ps1
./firebase_env.ps1
```

### For Command Prompt (Windows):

```cmd
python setup_firebase_env.py path/to/your/serviceAccountKey.json --shell cmd > firebase_env.bat
firebase_env.bat
```

### For Bash (Linux/macOS):

```bash
python setup_firebase_env.py path/to/your/serviceAccountKey.json --shell bash > firebase_env.sh
source firebase_env.sh
```

### Using .env file (Recommended):

```bash
python setup_firebase_env.py path/to/your/serviceAccountKey.json --shell env > .env
```

## Step 3: Verify Environment Variables

Make sure the following environment variables are set:

- FIREBASE_PROJECT_ID
- FIREBASE_PRIVATE_KEY_ID
- FIREBASE_PRIVATE_KEY
- FIREBASE_CLIENT_EMAIL
- FIREBASE_CLIENT_ID
- FIREBASE_AUTH_DOMAIN
- FIREBASE_DATABASE_URL
- FIREBASE_STORAGE_BUCKET

## Step 4: Run Your Application

After setting up the environment variables, try running your application again. It should now be able to initialize Firebase properly.

## Alternative: Manual Setup

If you prefer to set the environment variables manually:

1. Open your service account key JSON file
2. For each field in the file, create a corresponding environment variable:
   - FIREBASE_PROJECT_ID=project_id value
   - FIREBASE_PRIVATE_KEY_ID=private_key_id value
   - FIREBASE_CLIENT_EMAIL=client_email value
   - FIREBASE_CLIENT_ID=client_id value

3. For the private key, encode it in base64 to preserve newlines:
   ```python
   import base64
   with open('serviceAccountKey.json', 'r') as f:
       data = json.load(f)
       private_key = data['private_key']
       encoded = base64.b64encode(private_key.encode('utf-8')).decode('utf-8')
       print(f"FIREBASE_PRIVATE_KEY={encoded}")
   ```

4. Set the resulting value as the FIREBASE_PRIVATE_KEY environment variable

## Troubleshooting

- If you get errors about invalid private key format, make sure your private key is properly encoded and contains all newlines.
- Check if your service account has the necessary permissions to access Firebase services.
- Verify that the project ID in your service account key matches the project you're trying to access.
