# Firestore Security Rules Fix

## Problem
When users tried to create a new account, they received the error: "missing or insufficient permission"

## Root Cause
The application uses Firebase Firestore for storing user data, but Firestore security rules were not configured. Without proper security rules, Firestore denies all read and write operations by default.

## Solution
Created and deployed Firestore security rules (`firestore.rules`) that allow:

1. **User Registration**: Users can create their own user document during registration
2. **User Data Access**: Users can read and update their own user data
3. **Scan Management**: Users can create, read, update, and delete their own scans
4. **Data Privacy**: Users cannot access other users' data

## Security Rules Summary

### Users Collection (`/users/{userId}`)
- **Read**: User can only read their own document
- **Create**: User can create their own document during registration
- **Update**: User can only update their own document
- **Delete**: Disabled for safety

### Scans Collection (`/scans/{scanId}`)
- **Read**: User can only read their own scans
- **Create**: User can create scans with proper userId
- **Update**: User can only update their own scans
- **Delete**: User can only delete their own scans

## Files Changed

1. **`firestore.rules`** (NEW): Firestore security rules
2. **`firebase.json`**: Updated to include Firestore rules configuration
3. **`deploy_firestore_rules.ps1`** (NEW): PowerShell script to deploy rules
4. **`deploy_firestore_rules.py`** (NEW): Python script to deploy rules

## How to Deploy Rules

### Option 1: PowerShell
```powershell
.\deploy_firestore_rules.ps1
```

### Option 2: Python
```bash
python deploy_firestore_rules.py
```

### Option 3: Firebase CLI (Manual)
```bash
firebase deploy --only firestore:rules
```

## Verification

After deploying the rules, users should be able to:
- ✅ Create new accounts
- ✅ Login with existing accounts
- ✅ Access their own user data
- ✅ Create and manage their scans
- ❌ Access other users' data (properly restricted)

## Notes

- The application uses both Realtime Database and Firestore
- Realtime Database rules were already configured in `firebase/database.rules.json`
- Firestore rules are now configured in `firestore.rules`
- Both rule sets are necessary for the application to function properly
