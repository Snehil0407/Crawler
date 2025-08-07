# WebSentinals Authentication System Deployment Script (PowerShell)

Write-Host "🚀 Starting WebSentinals Authentication System Setup..." -ForegroundColor Green

# Check if running from correct directory
if (!(Test-Path "package.json")) {
    Write-Host "❌ Please run this script from the Crawler directory" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
Set-Location ..

Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend1
npm install
Set-Location ..

Write-Host "🔥 Firebase services setup..." -ForegroundColor Yellow
Write-Host "⚠️  Manual step required: Run 'firebase login' and 'firebase deploy --only database' to deploy database rules" -ForegroundColor Yellow

Write-Host "🌟 Setup complete! To start the application:" -ForegroundColor Green
Write-Host ""
Write-Host "Terminal 1 (Backend):" -ForegroundColor Cyan
Write-Host "cd backend; npm start"
Write-Host ""
Write-Host "Terminal 2 (Frontend):" -ForegroundColor Cyan
Write-Host "cd frontend1; npm run dev"
Write-Host ""
Write-Host "🌍 Access URLs:" -ForegroundColor Magenta
Write-Host "Frontend: http://localhost:3001"
Write-Host "Backend API: http://localhost:3000"
Write-Host ""
Write-Host "🔐 Demo Credentials:" -ForegroundColor Yellow
Write-Host "Email: admin@websentinals.com"
Write-Host "Password: admin123"
Write-Host ""
Write-Host "✨ Features added:" -ForegroundColor Green
Write-Host "- Google Sign-In authentication"
Write-Host "- User-specific scan visibility"
Write-Host "- Unique user sessions"
Write-Host "- Enhanced security with JWT tokens"
Write-Host "- Firebase integration"
