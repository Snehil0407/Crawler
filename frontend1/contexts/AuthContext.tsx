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
        return null;
      }
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  };

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await getUserData(firebaseUser);
        setUser(userData);
      } else {
        // Check for demo user in localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            if (user.id === 'demo-user-id') {
              setUser(user);
            } else {
              setUser(null);
            }
          } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('user');
            setUser(null);
          }
        } else {
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
      const result = await signInWithPopup(auth, googleProvider);
      await createUserDocument(result.user, { provider: 'google' });
      const userData = await getUserData(result.user);
      setUser(userData);
      return true;
    } catch (error) {
      console.error('Google login failed:', error);
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      console.log('Starting registration process...', userData.email);
      
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
        throw new Error('An account with this email already exists.');
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
      const result = await signInWithPopup(auth, googleProvider);
      await createUserDocument(result.user, { provider: 'google' });
      const userData = await getUserData(result.user);
      setUser(userData);
      return true;
    } catch (error) {
      console.error('Google registration failed:', error);
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
    registerWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
