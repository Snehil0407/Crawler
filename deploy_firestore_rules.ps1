# Deploy Firestore rules
Write-Host "Deploying Firestore rules..." -ForegroundColor Green

# Check if Firebase CLI is installed
try {
    firebase --version | Out-Null
    Write-Host "Firebase CLI found" -ForegroundColor Green
} catch {
    Write-Host "Error: Firebase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}

# Deploy the rules
try {
    Write-Host "Deploying Firestore security rules..." -ForegroundColor Yellow
    firebase deploy --only firestore:rules
    Write-Host "Firestore rules deployed successfully!" -ForegroundColor Green
} catch {
    Write-Host "Error deploying Firestore rules: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "Deployment completed!" -ForegroundColor Green
