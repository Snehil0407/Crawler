# WebSentinals Authentication System with Google Sign-In

This update adds comprehensive user authentication including Google Sign-In, unique user sessions, and user-specific scan visibility to the WebSentinals vulnerability scanner.

## 🚀 New Features

### Authentication Methods
- **Email/Password Registration & Login**: Traditional form-based authentication
- **Google Sign-In**: One-click registration and login with Google accounts
- **Demo Account**: For testing purposes (admin@websentinals.com / admin123)

### User Management
- **Unique User IDs**: Each user gets a unique session ID
- **User-Specific Scans**: Users can only see their own scans
- **User Profiles**: Store user information (name, company, etc.)
- **Secure Sessions**: Firebase Authentication handles secure sessions

### Security Features
- **Backend API Protection**: All scan endpoints require authentication
- **Firebase Database Rules**: User-based access control at database level
- **Token-Based Authentication**: JWT tokens for API requests
- **Automatic Session Management**: Automatic token refresh and expiration handling

## 🔧 Implementation Details

### Frontend Changes
1. **Firebase Integration**: Added Firebase SDK for authentication
2. **Updated AuthContext**: Now supports multiple authentication methods
3. **Enhanced Login/Register Pages**: Added Google Sign-In buttons
4. **API Client Updates**: Automatic token injection for authenticated requests
5. **User-Specific UI**: Dashboard shows only user's scans

### Backend Changes
1. **Authentication Middleware**: Verifies JWT tokens on protected endpoints
2. **User Association**: All scans are associated with user IDs
3. **Access Control**: Users can only access their own scan data
4. **Demo User Support**: Special handling for demo accounts

### Database Structure
```
users/
  {userId}/
    firstName: string
    lastName: string
    email: string
    company?: string
    provider: 'email' | 'google'
    createdAt: timestamp

scans/
  {scanId}/
    url: string
    status: string
    timestamp: string
    userId: string          # NEW - Associates scan with user
    userEmail: string       # NEW - For admin reference
    ...existing scan data
```

## 🔧 Setup Instructions

### 1. Firebase Configuration
The Firebase configuration is already set up in `lib/firebase.ts`. Make sure these environment variables are configured:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCnRIKn4bhWE5pTEzpdQ2VJF73j4WEv_2w
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=websentinal-f92ec.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=websentinal-f92ec
```

### 2. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Enable Google OAuth in APIs & Services
4. Add your domain to authorized origins:
   - `http://localhost:3001` (development)
   - Your production domain

### 3. Firebase Database Rules
Deploy the updated database rules:
```bash
cd "Web Sentinals/Crawler"
firebase login
firebase use websentinal-f92ec
firebase deploy --only database
```

### 4. Install Dependencies
Frontend dependencies are already installed. If needed:
```bash
cd frontend1
npm install
```

## 🧪 Testing

### Demo Account
- **Email**: admin@websentinals.com
- **Password**: admin123
- **User ID**: demo-user-id

### Google Sign-In Testing
1. Use a real Google account
2. First sign-in will create a new user profile
3. Subsequent sign-ins will use existing profile

### API Testing
All protected endpoints now require authentication:
- `POST /api/start-scan` - Start a new scan
- `GET /api/scan/:scanId/status` - Get scan status
- `GET /api/scan/:scanId/results` - Get scan results
- `GET /api/scans` - List user's scans
- `GET /api/dashboard/recent-scans` - Get user's recent scans
- `DELETE /api/scan/:scanId` - Delete user's scan

## 🔐 Security Considerations

### Current Security Features
- Firebase Authentication handles secure password storage
- JWT tokens for API authentication
- User-based access control in database rules
- HTTPS enforcement (in production)
- Token expiration and automatic refresh

### Additional Recommendations
1. **Rate Limiting**: Implement rate limiting on authentication endpoints
2. **2FA**: Add two-factor authentication for enhanced security
3. **Audit Logging**: Log authentication events and scan access
4. **Session Management**: Implement session timeout and concurrent session limits

## 🚀 Running the Application

### Development Mode
```bash
# Backend (Terminal 1)
cd backend
npm start

# Frontend (Terminal 2)
cd frontend1
npm run dev
```

### Access URLs
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Login Page**: http://localhost:3001/login
- **Register Page**: http://localhost:3001/register

## 📱 User Flow

### New User Registration
1. Visit `/register`
2. Choose between:
   - **Email/Password**: Fill form and create account
   - **Google Sign-Up**: One-click registration with Google
3. Automatically redirected to dashboard after successful registration

### Existing User Login
1. Visit `/login`
2. Choose between:
   - **Email/Password**: Enter credentials
   - **Google Sign-In**: One-click login
   - **Demo Account**: Use provided demo credentials
3. Redirected to dashboard with personalized scan history

### Scan Management
1. Start scans from dashboard (authenticated users only)
2. View scan progress and results
3. Access scan history (only user's own scans)
4. Delete unwanted scans

## 🔄 Migration Notes

### Backward Compatibility
- Existing scans without `userId` will be accessible to all authenticated users
- New scans will be properly associated with the creating user
- Demo account maintains access to demonstrate functionality

### Data Migration (if needed)
If you need to associate existing scans with specific users, run a migration script to add `userId` fields to existing scan records.

## 🆘 Troubleshooting

### Common Issues

1. **Google Sign-In Not Working**
   - Check Google OAuth configuration
   - Verify authorized domains
   - Ensure Firebase project is properly linked

2. **API Authentication Errors**
   - Check if user is properly authenticated
   - Verify token is being sent with requests
   - Check backend authentication middleware

3. **Scan Access Denied**
   - User trying to access another user's scan
   - Check scan ownership in Firebase database
   - Verify user authentication status

4. **Demo Account Issues**
   - Clear localStorage and try again
   - Check if demo token is being sent
   - Verify backend demo user handling

## 📞 Support

For issues related to authentication or user management, check:
1. Browser console for authentication errors
2. Network tab for API request/response details
3. Firebase console for user management and database access
4. Backend logs for authentication middleware errors

The authentication system is now fully functional with Google Sign-In support and user-specific scan isolation!
