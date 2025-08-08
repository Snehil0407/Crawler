# Firebase Authentication Setup

## Overview
This document outlines the Firebase authentication setup for the WebSentinals security scanner application, including Google Sign-In integration and email domain validation.

## Firebase Configuration
The application uses the following Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCnRIKn4bhWE5pTEzpdQ2VJF73j4WEv_2w",
  authDomain: "websentinal-f92ec.firebaseapp.com",
  databaseURL: "https://websentinal-f92ec-default-rtdb.firebaseio.com",
  projectId: "websentinal-f92ec",
  storageBucket: "websentinal-f92ec.firebasestorage.app",
  messagingSenderId: "1029931119218",
  appId: "1:1029931119218:web:1b666a2e129560c9d588eb",
  measurementId: "G-7DVNDBSZ6T"
};
```

## Features Implemented

### 1. Google Sign-In Authentication
- Users can sign in and register using their Google accounts
- Seamless integration with Firebase Authentication
- Proper error handling and user feedback

### 2. Email Domain Validation
The application implements strict email validation to ensure only legitimate users can access the system:

#### Blocked Patterns:
- Generic demo accounts: `demo@gmail.com`, `demo123@gmail.com`
- Test accounts: `test@gmail.com`, `test456@gmail.com`
- Generic user accounts: `user@gmail.com`, `admin@gmail.com`
- Numeric-only accounts: `123@gmail.com`
- Temporary accounts: `temp@gmail.com`, `fake@gmail.com`
- Sample accounts: `sample@gmail.com`, `example@gmail.com`

#### Validation Logic:
1. **Email Format Check**: Validates proper email format using regex
2. **Local Part Validation**: Checks if the username part contains blocked patterns
3. **Domain-Specific Rules**: Special handling for Gmail with additional restrictions
4. **Professional Email Preference**: Encourages use of corporate/institutional emails

### 3. Authentication Methods
The application supports multiple authentication methods:

1. **Email/Password Registration and Login**
   - Traditional email/password authentication
   - Password strength validation
   - Email domain validation applies to registration

2. **Google OAuth Integration**
   - One-click Google Sign-In
   - Automatic user profile creation
   - Email domain validation for Google accounts

3. **Demo Account Access**
   - Special demo account: `admin@websentinals.com` / `admin123`
   - Bypasses Firebase authentication for testing

## Implementation Details

### File Structure
```
frontend1/
├── lib/
│   ├── firebase.ts          # Firebase configuration and initialization
│   └── utils.ts             # Email validation utilities
├── contexts/
│   └── AuthContext.tsx      # Authentication context and logic
├── pages/
│   ├── login.tsx           # Login page component
│   └── register.tsx        # Registration page component
└── components/
    └── ProtectedRoute.tsx  # Route protection component
```

### Key Functions

#### `validateEmailDomain(email: string)`
Central email validation function that:
- Validates email format
- Checks against blocked patterns
- Returns validation result with error messages

#### `loginWithGoogle()` & `registerWithGoogle()`
Google authentication handlers that:
- Initiate Google OAuth flow
- Validate email domain after successful authentication
- Create user documents in Firestore
- Handle authentication errors gracefully

### Error Handling
The application provides clear, user-friendly error messages:

- **Generic Email Rejection**: "Access restricted. Please use a valid corporate or institutional email address. Generic email addresses like demo123@gmail.com are not allowed."
- **Invalid Format**: "Please enter a valid email address."
- **Authentication Errors**: Specific Firebase error messages with user-friendly alternatives

## Security Features

### 1. Domain Validation
Prevents abuse by blocking:
- Generic/demo email patterns
- Test accounts
- Temporary/fake email addresses

### 2. Firebase Security Rules
```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "scans": {
      "$scanId": {
        ".read": "auth != null && data.child('userId').val() === auth.uid",
        ".write": "auth != null && newData.child('userId').val() === auth.uid"
      }
    }
  }
}
```

### 3. Client-Side Protection
- Route protection for authenticated pages
- Session management with automatic logout
- Secure token handling through Firebase SDK

## Usage Examples

### Registration with Email Validation
```typescript
// Valid professional emails
"john.doe@company.com"     ✅ Allowed
"sarah@university.edu"     ✅ Allowed
"developer@startup.io"     ✅ Allowed

// Blocked generic patterns
"demo@gmail.com"           ❌ Blocked
"test123@gmail.com"        ❌ Blocked
"user@anywhere.com"        ❌ Blocked
```

### Google Sign-In Flow
1. User clicks "Continue with Google"
2. Google OAuth popup appears
3. User selects Google account
4. Email domain validation runs
5. If valid: User authenticated and redirected
6. If invalid: User signed out with error message

## Testing
Run the email validation tests:
```bash
# Test the validation logic
npm run test:email-validation
```

## Configuration Requirements

### Firebase Console Setup
1. Enable Authentication with Google provider
2. Configure authorized domains
3. Set up Firestore database
4. Deploy security rules

### Google Cloud Console
1. Configure OAuth consent screen
2. Add authorized redirect URIs
3. Verify domain ownership

## Maintenance Notes

### Adding New Blocked Patterns
Update the validation logic in `lib/utils.ts`:

```typescript
const blockedLocalPatterns = [
  /^demo\d*$/,
  /^test\d*$/,
  // Add new patterns here
];
```

### Modifying Error Messages
Update error messages in the `validateEmailDomain` function for consistent user experience.

### Analytics Integration
Firebase Analytics is configured and will track:
- Authentication events
- User sign-up methods
- Login success/failure rates

## Support
For issues related to authentication:
1. Check Firebase console for auth logs
2. Verify email validation test cases
3. Review browser console for detailed error messages
4. Ensure Firebase configuration is correct
