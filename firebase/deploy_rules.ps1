# Firebase Database Rules Deployment Script for PowerShell
# This script will deploy the database rules to fix the indexing warning

Write-Host "Firebase Database Rules Deployment" -ForegroundColor Yellow
Write-Host ("=" * 50)

# Check if Firebase CLI is installed
try {
    $firebaseVersion = firebase --version
    Write-Host "Firebase CLI found: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "Firebase CLI not found. Please install it with:" -ForegroundColor Red
    Write-Host "npm install -g firebase-tools" -ForegroundColor Cyan
    exit 1
}

# Change to project directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectPath = Split-Path -Parent $scriptPath
Set-Location $projectPath

Write-Host "Project directory: $projectPath" -ForegroundColor Cyan

# Login to Firebase (if not already logged in)
Write-Host "Checking Firebase authentication..." -ForegroundColor Yellow
try {
    firebase projects:list | Out-Null
    Write-Host "Already authenticated with Firebase" -ForegroundColor Green
} catch {
    Write-Host "Please login to Firebase..." -ForegroundColor Yellow
    firebase login --reauth
}

# Deploy database rules
Write-Host "Deploying database rules..." -ForegroundColor Yellow
try {
    firebase deploy --only database
    Write-Host "Database rules deployed successfully!" -ForegroundColor Green
    Write-Host "The Firebase indexing warning should now be resolved." -ForegroundColor Green
    Write-Host "The database will now use proper indexes for timestamp queries." -ForegroundColor Cyan
} catch {
    Write-Host "Failed to deploy database rules. Please check your Firebase configuration." -ForegroundColor Red
    Write-Host "Make sure you have the correct project selected:" -ForegroundColor Yellow
    Write-Host "firebase use websentinal-f92ec" -ForegroundColor Cyan
    exit 1
}

Write-Host "Deployment completed!" -ForegroundColor Green
