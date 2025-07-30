# Authentication System

This document explains the authentication system implemented for the WebSentinals dashboard.

## Features

- **Login Page** (`/login`) - User authentication with email and password
- **Registration Page** (`/register`) - New user registration with validation
- **Protected Routes** - Dashboard requires authentication
- **User Context** - Global authentication state management
- **Automatic Redirects** - Redirect logic for authenticated/unauthenticated users

## Demo Credentials

For testing purposes, use these credentials:
- **Email**: `admin@websentinals.com`
- **Password**: `admin123`

## Pages

### Login Page (`/login`)
- Email and password authentication
- Password visibility toggle
- Remember me option
- Demo credentials display
- Link to registration page
- Error handling and loading states

### Registration Page (`/register`)
- Full registration form with validation
- Real-time form validation
- Password strength requirements
- Terms and conditions acceptance
- Success redirect to login page

### Dashboard (`/`)
- Protected route requiring authentication
- User information display in header
- Logout functionality

## Components

### AuthContext (`contexts/AuthContext.tsx`)
Provides global authentication state and methods:
- `user` - Current user information
- `isAuthenticated` - Authentication status
- `isLoading` - Loading state
- `login(email, password)` - Login method
- `logout()` - Logout method
- `register(userData)` - Registration method

### ProtectedRoute (`components/ProtectedRoute.tsx`)
Wrapper component for protected pages:
- Checks authentication status
- Redirects to login if not authenticated
- Shows loading spinner during auth check

### Updated Header (`components/Header.tsx`)
- Displays user information when logged in
- Logout button
- User avatar/icon

## Usage

### Protecting a Route
```tsx
import ProtectedRoute from '../components/ProtectedRoute';

export default function MyPage() {
  return (
    <ProtectedRoute>
      <div>Protected content</div>
    </ProtectedRoute>
  );
}
```

### Using Authentication Context
```tsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return <div>Welcome, {user.firstName}!</div>;
}
```

## Form Validation

### Login Form
- Email format validation
- Required field validation
- Server-side error display

### Registration Form
- Email format validation
- Password strength requirements:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
- Password confirmation match
- Required field validation
- Terms acceptance validation

## Security Features

- Client-side form validation
- Password visibility toggle
- Secure password requirements
- Token-based authentication (mock implementation)
- Automatic logout functionality
- Protected route enforcement

## Future Enhancements

1. **Backend Integration**
   - Replace mock authentication with real API calls
   - Implement JWT token management
   - Add refresh token functionality

2. **Enhanced Security**
   - Two-factor authentication
   - Password reset functionality
   - Account verification

3. **User Management**
   - Profile editing
   - Password change
   - Account settings

4. **Session Management**
   - Auto-logout on inactivity
   - Remember me persistence
   - Multiple device handling

## Styling

The authentication pages use:
- Tailwind CSS for styling
- Consistent design with the main dashboard
- Responsive design for mobile devices
- Gradient backgrounds and modern UI elements
- Lucide React icons for visual elements

## Error Handling

- Form validation errors
- Network error handling
- User-friendly error messages
- Loading states for better UX
- 404 page for non-existent routes
