# Firebase Google Authentication Setup Guide

## Current Issue Analysis
Based on your Firebase configuration, here are the most likely causes for Google Authentication not working:

## ✅ Firebase Configuration Checklist

### 1. Firebase Console Setup
Please verify these settings in your Firebase Console (https://console.firebase.google.com/):

#### Authentication Settings:
1. Go to **Authentication > Sign-in method**
2. Ensure **Google** is enabled
3. Check that your **Support email** is set
4. Verify **Authorized domains** includes:
   - `localhost` (for development)
   - Your production domain

#### Project Settings:
1. Go to **Project Settings > General**
2. Verify your Web API Key matches: `AIzaSyCnRIKn4bhWE5pTEzpdQ2VJF73j4WEv_2w`
3. Check that the Auth Domain is: `websentinal-f92ec.firebaseapp.com`

### 2. Google Cloud Console (OAuth Setup)
Visit https://console.cloud.google.com/ and check:

1. **API & Services > Credentials**
2. Find your OAuth 2.0 client ID
3. Verify **Authorized JavaScript origins** include:
   - `http://localhost:3000` (for Next.js dev)
   - `http://localhost:8080` (if using different port)
   - Your production domain
4. Verify **Authorized redirect URIs** include:
   - `https://websentinal-f92ec.firebaseapp.com/__/auth/handler`

### 3. Common Error Solutions

#### "auth/unauthorized-domain"
- Add your domain to Authorized domains in Firebase Console
- For local development, add `localhost`

#### "auth/popup-blocked"
- Browser is blocking the popup
- User needs to allow popups for your site

#### "auth/popup-closed-by-user"
- User closed the popup before completing authentication
- Not an error, just user action

#### "auth/network-request-failed"
- Internet connectivity issue
- Firewall blocking Google APIs

### 4. Development Environment

#### For localhost testing:
1. Make sure you're running on `http://localhost:3000`
2. If using a different port, update Firebase console
3. Check browser console for detailed error messages

#### Browser Settings:
1. Enable popups for your site
2. Clear browser cache and cookies
3. Try in incognito mode
4. Test in different browsers

### 5. Code Configuration

Your current Firebase config looks correct:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCnRIKn4bhWE5pTEzpdQ2VJF73j4WEv_2w",
  authDomain: "websentinal-f92ec.firebaseapp.com",
  // ... other settings
};
```

## 🧪 Testing Steps

1. Visit: http://localhost:3000/auth-test
2. Click "Test Direct Google Auth" to test basic Firebase connection
3. Check the logs for specific error messages
4. Try "Test Google Login" to test the full authentication flow

## 🔧 Quick Fixes

### Fix 1: Update Firebase Console
1. Go to Firebase Console > Authentication > Sign-in method
2. Click on Google provider
3. Add `localhost` to authorized domains
4. Save changes

### Fix 2: Check Google Cloud Console
1. Go to Google Cloud Console > APIs & Services > Credentials
2. Find your OAuth client ID
3. Add `http://localhost:3000` to Authorized JavaScript origins
4. Save changes

### Fix 3: Environment Variables (if using)
Create `.env.local` file with:
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCnRIKn4bhWE5pTEzpdQ2VJF73j4WEv_2w
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=websentinal-f92ec.firebaseapp.com
# ... other config
```

## 📞 Need Help?

If Google Auth still doesn't work:
1. Check browser console for error messages
2. Run the auth test page and share the error logs
3. Verify your Firebase project billing status
4. Check if Google API quotas are exceeded

The most common issue is domain authorization - make sure `localhost` is added to both Firebase Console and Google Cloud Console authorized domains.
