# Deploy Firestore Security Rules to Firebase
# This script deploys the firestore.rules file to Firebase

Write-Host "Deploying Firestore Security Rules..." -ForegroundColor Cyan

# Check if Firebase CLI is installed
try {
    $firebaseVersion = firebase --version
    Write-Host "Firebase CLI version: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Firebase CLI is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Firebase CLI: npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}

# Check if firestore.rules exists
if (-not (Test-Path "firestore.rules")) {
    Write-Host "Error: firestore.rules file not found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Deploying Firestore rules only..." -ForegroundColor Yellow

# Deploy only Firestore rules (not database rules)
try {
    firebase deploy --only firestore:rules
    Write-Host ""
    Write-Host "Firestore security rules deployed successfully!" -ForegroundColor Green
    Write-Host "Users can now create accounts and access their data." -ForegroundColor Green
} catch {
    Write-Host "Error deploying Firestore rules: $_" -ForegroundColor Red
    Write-Host "Make sure you're logged in with: firebase login" -ForegroundColor Yellow
    exit 1
}
