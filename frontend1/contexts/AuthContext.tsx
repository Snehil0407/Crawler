import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { validateEmailDomain } from '../lib/utils';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  provider?: 'email' | 'google';
  createdAt?: Date;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<boolean>;
  registerWithGoogle: () => Promise<boolean>;
  checkIfUserExists: (email: string) => Promise<boolean>;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Helper function to create user document in Firestore
  const createUserDocument = async (firebaseUser: FirebaseUser, additionalData: any = {}) => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      const { displayName, email } = firebaseUser;
      const [firstName, lastName] = displayName?.split(' ') || ['', ''];
      
      try {
        await setDoc(userRef, {
          firstName: additionalData.firstName || firstName || '',
          lastName: additionalData.lastName || lastName || '',
          email,
          company: additionalData.company || '',
          provider: additionalData.provider || 'email',
          createdAt: new Date(),
          ...additionalData
        });
      } catch (error) {
        console.error('Error creating user document:', error);
      }
    }

    return userRef;
  };

  // Helper function to get user data from Firestore
  const getUserData = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    try {
      console.log('Getting user data for:', firebaseUser.uid);
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('User document found:', userData);
        return {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          company: userData.company || '',
          provider: userData.provider || 'email',
          createdAt: userData.createdAt?.toDate()
        };
      } else {
        console.log('No user document found for:', firebaseUser.uid);
        console.log('Creating fallback user object from Firebase user data');
        
        // Create a fallback user object from Firebase user data
        const fallbackUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          firstName: firebaseUser.displayName?.split(' ')[0] || 'User',
          lastName: firebaseUser.displayName?.split(' ')[1] || '',
          company: '',
          provider: 'google', // Most likely Google if no doc exists
          createdAt: new Date()
        };
        
        // Try to create the user document for future logins
        try {
          await createUserDocument(firebaseUser, {
            firstName: fallbackUser.firstName,
            lastName: fallbackUser.lastName,
            company: fallbackUser.company,
            provider: fallbackUser.provider
          });
          console.log('User document created successfully');
        } catch (docError) {
          console.warn('Could not create user document, continuing with fallback:', docError);
        }
        
        return fallbackUser;
      }
    } catch (error) {
      console.error('Error getting user data:', error);
      
      // Even if Firestore fails, create a minimal user object from Firebase auth
      console.log('Firestore failed, creating minimal user object from Firebase auth');
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        firstName: firebaseUser.displayName?.split(' ')[0] || 'User',
        lastName: firebaseUser.displayName?.split(' ')[1] || '',
        company: '',
        provider: 'google',
        createdAt: new Date()
      };
    }
  };

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed. Firebase user:', firebaseUser?.email || 'None');
      
      if (firebaseUser) {
        console.log('Firebase user authenticated, getting user data...');
        const userData = await getUserData(firebaseUser);
        
        if (userData) {
          console.log('User data retrieved successfully:', userData.email);
          setUser(userData);
        } else {
          console.error('Failed to get user data, but Firebase user exists. This should not happen with new fallback logic.');
          setUser(null);
        }
      } else {
        console.log('No Firebase user, checking for demo user...');
        // Check for demo user in localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            if (user.id === 'demo-user-id') {
              console.log('Demo user found in localStorage');
              setUser(user);
            } else {
              console.log('Invalid user data in localStorage, clearing...');
              localStorage.removeItem('user');
              setUser(null);
            }
          } catch (error) {
            console.error('Error parsing user data from localStorage:', error);
            localStorage.removeItem('user');
            setUser(null);
          }
        } else {
          console.log('No user found anywhere, setting to null');
          setUser(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Starting login process for:', email);
      
      // Check for demo credentials first
      if (email === 'admin@websentinals.com' && password === 'admin123') {
        const demoUser: User = {
          id: 'demo-user-id',
          email: email,
          firstName: 'Admin',
          lastName: 'User',
          company: 'WebSentinals',
          provider: 'email'
        };
        localStorage.setItem('user', JSON.stringify(demoUser));
        setUser(demoUser);
        console.log('Demo user login successful');
        return true;
      }

      // Try Firebase authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase authentication successful:', userCredential.user.uid);
      
      // Try to get user data from Firestore
      let userData = await getUserData(userCredential.user);
      
      // If no user data in Firestore, create a basic user object
      if (!userData) {
        console.log('No user document found, creating basic user data');
        userData = {
          id: userCredential.user.uid,
          email: userCredential.user.email || '',
          firstName: userCredential.user.displayName?.split(' ')[0] || 'User',
          lastName: userCredential.user.displayName?.split(' ')[1] || '',
          company: '',
          provider: 'email'
        };
        
        // Try to create the user document for future logins
        try {
          await createUserDocument(userCredential.user, {
            firstName: userData.firstName,
            lastName: userData.lastName,
            company: userData.company,
            provider: 'email'
          });
          console.log('User document created for existing user');
        } catch (docError) {
          console.warn('Could not create user document:', docError);
          // Continue anyway with the basic user data
        }
      }
      
      setUser(userData);
      console.log('Login successful, user data set:', userData);
      return true;
    } catch (error: any) {
      console.error('Login failed:', error);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email address.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      } else if (error.code === 'auth/user-disabled') {
        throw new Error('This account has been disabled. Please contact support.');
      } else {
        throw new Error(error.message || 'Login failed. Please try again.');
      }
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      console.log('Starting Google authentication...');
      console.log('Auth object:', auth);
      console.log('Google provider:', googleProvider);
      
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Google sign-in popup completed successfully');
      console.log('User info:', result.user);
      
      // Validate email domain
      const email = result.user.email;
      if (!email) {
        console.error('No email received from Google account');
        await signOut(auth);
        throw new Error('Unable to retrieve email address from Google account.');
      }

      console.log('Validating email domain for:', email);
      const validation = validateEmailDomain(email);
      if (!validation.isValid) {
        console.error('Email validation failed:', validation.error);
        // Sign out the user and show error
        await signOut(auth);
        throw new Error(validation.error);
      }
      
      console.log('Email validation passed, creating user document...');
      await createUserDocument(result.user, { provider: 'google' });
      
      console.log('Getting user data...');
      const userData = await getUserData(result.user);
      console.log('User data retrieved:', userData);
      
      setUser(userData);
      console.log('Google authentication completed successfully');
      return true;
    } catch (error: any) {
      console.error('Google login failed with error:', error);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked by browser. Please allow popups and try again.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error('This domain is not authorized for authentication. Please contact support.');
      } else {
        // Re-throw the error to be handled by the calling component
        throw new Error(error.message || 'Google sign-in failed. Please try again.');
      }
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      console.log('Starting registration process...', userData.email);
      
      // Validate email domain for regular registration too
      const validation = validateEmailDomain(userData.email);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      console.log('Firebase user created:', userCredential.user.uid);
      
      // Create user document in Firestore
      await createUserDocument(userCredential.user, {
        firstName: userData.firstName,
        lastName: userData.lastName,
        company: userData.company,
        provider: 'email'
      });
      console.log('User document created in Firestore');
      
      // Get user data
      const newUser = await getUserData(userCredential.user);
      console.log('User data retrieved:', newUser);
      
      setUser(newUser);
      return true;
    } catch (error: any) {
      console.error('Registration failed:', error);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('You already have an account with this email address. Please sign in instead.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please choose a stronger password.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Email/password authentication is not enabled. Please contact support.');
      } else {
        throw new Error(error.message || 'Registration failed. Please try again.');
      }
    }
  };

  const registerWithGoogle = async (): Promise<boolean> => {
    try {
      console.log('Starting Google registration...');
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Google registration popup completed successfully');
      
      // Validate email domain
      const email = result.user.email;
      if (!email) {
        console.error('No email received from Google account during registration');
        await signOut(auth);
        throw new Error('Unable to retrieve email address from Google account.');
      }

      console.log('Validating email domain for registration:', email);
      const validation = validateEmailDomain(email);
      if (!validation.isValid) {
        console.error('Email validation failed during registration:', validation.error);
        // Sign out the user and show error
        await signOut(auth);
        throw new Error(validation.error);
      }
      
      // Check if this is a new user by looking at creation time vs last sign in time
      const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
      console.log('Is new user?', isNewUser);
      
      if (!isNewUser) {
        console.log('User already exists, but they are using signup button - we will log them in instead');
        // User already exists, but since they successfully authenticated with Google,
        // we should log them in instead of showing an error
        console.log('Getting user data for existing user...');
        const userData = await getUserData(result.user);
        console.log('Existing user data retrieved:', userData);
        
        setUser(userData);
        console.log('Existing user logged in successfully via signup flow');
        return true;
      }
      
      console.log('Email validation passed for registration, creating user document...');
      await createUserDocument(result.user, { provider: 'google' });
      
      console.log('Getting user data for registration...');
      const userData = await getUserData(result.user);
      console.log('User data retrieved for registration:', userData);
      
      setUser(userData);
      console.log('Google registration completed successfully');
      return true;
    } catch (error: any) {
      console.error('Google registration failed with error:', error);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-up was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked by browser. Please allow popups and try again.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error('This domain is not authorized for authentication. Please contact support.');
      } else {
        // Re-throw the error to be handled by the calling component
        throw new Error(error.message || 'Google sign-up failed. Please try again.');
      }
    }
  };

  // Function to check if a user already exists by email
  const checkIfUserExists = async (email: string): Promise<boolean> => {
    try {
      console.log('Checking if user exists with email:', email);
      
      // Try to get user by email from Firebase Auth
      // Note: This is a workaround since Firebase doesn't have a direct "check user exists" method
      // We'll need to use fetchSignInMethodsForEmail which is deprecated but still works
      const { fetchSignInMethodsForEmail } = await import('firebase/auth');
      const methods = await fetchSignInMethodsForEmail(auth, email);
      
      console.log('Sign-in methods found for email:', methods);
      return methods.length > 0;
    } catch (error: any) {
      console.error('Error checking if user exists:', error);
      
      // If the error is "user not found", that means the user doesn't exist
      if (error.code === 'auth/user-not-found') {
        return false;
      }
      
      // For other errors, we'll assume the user might exist to be safe
      return false;
    }
  };

  const logout = async () => {
    try {
      // Check if it's a demo user
      if (user?.id === 'demo-user-id') {
        localStorage.removeItem('user');
        setUser(null);
        router.push('/login');
        return;
      }

      // Firebase logout
      await signOut(auth);
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    loginWithGoogle,
    logout,
    register,
    registerWithGoogle,
    checkIfUserExists
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
