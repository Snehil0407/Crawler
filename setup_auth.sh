#!/bin/bash

# WebSentinals Authentication System Deployment Script

echo "🚀 Starting WebSentinals Authentication System Setup..."

# Check if running from correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the Crawler directory"
    exit 1
fi

echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

echo "📦 Installing frontend dependencies..."
cd frontend1
npm install
cd ..

echo "🔥 Starting Firebase services..."
echo "⚠️  Manual step required: Run 'firebase login' and 'firebase deploy --only database' to deploy database rules"

echo "🌟 Setup complete! To start the application:"
echo ""
echo "Terminal 1 (Backend):"
echo "cd backend && npm start"
echo ""
echo "Terminal 2 (Frontend):"
echo "cd frontend1 && npm run dev"
echo ""
echo "🌍 Access URLs:"
echo "Frontend: http://localhost:3001"
echo "Backend API: http://localhost:3000"
echo ""
echo "🔐 Demo Credentials:"
echo "Email: admin@websentinals.com"
echo "Password: admin123"
echo ""
echo "✨ Features added:"
echo "- Google Sign-In authentication"
echo "- User-specific scan visibility"
echo "- Unique user sessions"
echo "- Enhanced security with JWT tokens"
echo "- Firebase integration"
