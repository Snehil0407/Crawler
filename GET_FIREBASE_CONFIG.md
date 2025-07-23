/* 
 * IMPORTANT: You need to get these values from Firebase Console
 * 
 * 1. Go to https://console.firebase.google.com/
 * 2. Select your project: websentinal-f92ec
 * 3. Click the gear icon (⚙️) > Project settings
 * 4. Scroll down to "Your apps" section
 * 5. If you see a web app, copy its config
 * 6. If no web app exists, click "Add app" > Web (</>) and create one
 * 7. Copy the config and replace the values in frontend/app.js
 */

// This is what the config should look like (with your actual values):
const firebaseConfig = {
    apiKey: "AIzaSy...", // Get this from Firebase Console
    authDomain: "websentinal-f92ec.firebaseapp.com",
    databaseURL: "https://websentinal-f92ec-default-rtdb.firebaseio.com", 
    projectId: "websentinal-f92ec",
    storageBucket: "websentinal-f92ec.firebasestorage.app",
    messagingSenderId: "107696029553657251222", // Already correct
    appId: "1:107696029553657251222:web:...", // Get this from Firebase Console
    measurementId: "G-..." // Optional, for Analytics
};

/* 
 * Steps to get the missing values:
 * 
 * 1. API Key: In Firebase Console > Project Settings > General tab > Web API Key
 * 2. App ID: In Firebase Console > Project Settings > General tab > Your apps section
 * 
 * Once you have these, replace the values in frontend/app.js
 */
