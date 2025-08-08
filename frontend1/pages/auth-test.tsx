import React, { useState, useEffect } from 'react';
import { auth, db, googleProvider } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

const AuthTestPage: React.FC = () => {
  const [email, setEmail] = useState('testuser@example.com');
  const [password, setPassword] = useState('testpassword123');
  const [firstName, setFirstName] = useState('Test');
  const [lastName, setLastName] = useState('User');
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { user, login, register, logout, loginWithGoogle, registerWithGoogle, isAuthenticated } = useAuth();
  const router = useRouter();

  const addLog = (message: string, isError = false) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${isError ? '❌' : '✅'} ${message}`;
    setLogs(prev => [...prev, logMessage]);
    console.log(logMessage);
  };

  const testFirebaseConnection = async () => {
    addLog('Testing Firebase connection...');
    try {
      addLog(`Auth object exists: ${!!auth}`);
      addLog(`Firestore object exists: ${!!db}`);
      addLog(`Current Firebase user: ${auth.currentUser?.email || 'None'}`);
      addLog(`Auth Context user: ${user?.email || 'None'}`);
      addLog(`Is authenticated: ${isAuthenticated}`);
      addLog('Firebase connection test completed');
    } catch (error: any) {
      addLog(`Firebase connection error: ${error.message}`, true);
    }
  };

  const testFullRegistration = async () => {
    setIsLoading(true);
    addLog('=== Starting Full Registration Test ===');
    
    try {
      // First logout if someone is logged in
      if (auth.currentUser) {
        await signOut(auth);
        addLog('Logged out existing user');
      }

      addLog('Calling AuthContext register function...');
      const success = await register({
        firstName: firstName,
        lastName: lastName,
        email: email,
        company: 'Test Company',
        password: password
      });

      if (success) {
        addLog('✨ Registration successful via AuthContext!');
        addLog(`Current user: ${user?.email}`);
        addLog(`Is authenticated: ${isAuthenticated}`);
      } else {
        addLog('Registration failed via AuthContext', true);
      }
    } catch (error: any) {
      addLog(`Registration error: ${error.message}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  const testFullLogin = async () => {
    setIsLoading(true);
    addLog('=== Starting Full Login Test ===');
    
    try {
      addLog('Calling AuthContext login function...');
      const success = await login(email, password);

      if (success) {
        addLog('✨ Login successful via AuthContext!');
        addLog(`Current user: ${user?.email}`);
        addLog(`Is authenticated: ${isAuthenticated}`);
        
        // Test redirect to dashboard
        setTimeout(() => {
          addLog('Redirecting to dashboard...');
          router.push('/');
        }, 2000);
      } else {
        addLog('Login failed via AuthContext', true);
      }
    } catch (error: any) {
      addLog(`Login error: ${error.message}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  const testDirectFirebaseAuth = async () => {
    setIsLoading(true);
    addLog('=== Testing Direct Firebase Auth ===');
    
    try {
      // Test direct Firebase login
      addLog('Attempting direct Firebase signInWithEmailAndPassword...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      addLog(`Direct Firebase login successful: ${userCredential.user.uid}`);
      
      // Test Firestore access
      addLog('Testing Firestore document access...');
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (userDoc.exists()) {
        addLog('User document found in Firestore');
        addLog(`Document data: ${JSON.stringify(userDoc.data())}`);
      } else {
        addLog('No user document found in Firestore', true);
      }
      
    } catch (error: any) {
      addLog(`Direct Firebase auth error: ${error.code} - ${error.message}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  const testGoogleLogin = async () => {
    setIsLoading(true);
    addLog('=== Starting Google Login Test ===');
    
    try {
      addLog('Calling AuthContext loginWithGoogle function...');
      const success = await loginWithGoogle();

      if (success) {
        addLog('✨ Google login successful via AuthContext!');
        addLog(`Current user: ${user?.email}`);
        addLog(`Is authenticated: ${isAuthenticated}`);
      } else {
        addLog('Google login failed via AuthContext', true);
      }
    } catch (error: any) {
      addLog(`Google login error: ${error.message}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  const testGoogleRegister = async () => {
    setIsLoading(true);
    addLog('=== Starting Google Register Test ===');
    
    try {
      addLog('Calling AuthContext registerWithGoogle function...');
      const success = await registerWithGoogle();

      if (success) {
        addLog('✨ Google registration successful via AuthContext!');
        addLog(`Current user: ${user?.email}`);
        addLog(`Is authenticated: ${isAuthenticated}`);
      } else {
        addLog('Google registration failed via AuthContext', true);
      }
    } catch (error: any) {
      addLog(`Google registration error: ${error.message}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  const testDirectGoogleAuth = async () => {
    setIsLoading(true);
    addLog('=== Testing Direct Google Auth ===');
    
    try {
      addLog('Testing Google provider configuration...');
      addLog(`Google provider exists: ${!!googleProvider}`);
      
      addLog('Attempting direct Firebase signInWithPopup...');
      const result = await signInWithPopup(auth, googleProvider);
      addLog(`Direct Google auth successful: ${result.user.uid}`);
      addLog(`User email: ${result.user.email}`);
      addLog(`User display name: ${result.user.displayName}`);
      
    } catch (error: any) {
      addLog(`Direct Google auth error: ${error.code} - ${error.message}`, true);
      if (error.code === 'auth/unauthorized-domain') {
        addLog('❗ Domain not authorized. Add your domain to Firebase console.', true);
      } else if (error.code === 'auth/popup-blocked') {
        addLog('❗ Popup blocked by browser. Please allow popups.', true);
      } else if (error.code === 'auth/popup-closed-by-user') {
        addLog('❗ User closed the popup window.', true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const testLogout = async () => {
    setIsLoading(true);
    addLog('=== Testing Logout ===');
    
    try {
      await logout();
      addLog('Logout successful');
      addLog(`Current user: ${user?.email || 'None'}`);
      addLog(`Is authenticated: ${isAuthenticated}`);
    } catch (error: any) {
      addLog(`Logout error: ${error.message}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const goToDashboard = () => {
    router.push('/');
  };

  useEffect(() => {
    testFirebaseConnection();
  }, [user, isAuthenticated]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">🔧 Authentication Debug Center</h1>
        
        {/* Current Status */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p><strong>Auth Context User:</strong> {user?.email || 'Not logged in'}</p>
              <p><strong>Is Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
              <p><strong>Firebase User:</strong> {auth.currentUser?.email || 'None'}</p>
            </div>
            <div>
              <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
              <p><strong>Display Name:</strong> {user?.firstName} {user?.lastName || 'N/A'}</p>
              <p><strong>Provider:</strong> {user?.provider || 'N/A'}</p>
            </div>
          </div>
          
          {isAuthenticated && (
            <button
              onClick={goToDashboard}
              className="mt-4 bg-green-500 text-white py-2 px-6 rounded hover:bg-green-600"
            >
              🚀 Go to Dashboard
            </button>
          )}
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Test Controls */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="testuser@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="testpassword123"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={testFirebaseConnection}
                disabled={isLoading}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Test Connection
              </button>
              
              <button
                onClick={testFullRegistration}
                disabled={isLoading}
                className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50"
              >
                {isLoading ? 'Testing Registration...' : 'Test Full Registration'}
              </button>
              
              <button
                onClick={testFullLogin}
                disabled={isLoading}
                className="w-full bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600 disabled:opacity-50"
              >
                {isLoading ? 'Testing Login...' : 'Test Full Login'}
              </button>
              
              <button
                onClick={testDirectFirebaseAuth}
                disabled={isLoading}
                className="w-full bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600 disabled:opacity-50"
              >
                Test Direct Firebase Auth
              </button>
              
              <button
                onClick={testGoogleLogin}
                disabled={isLoading}
                className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 disabled:opacity-50"
              >
                {isLoading ? 'Testing Google Login...' : 'Test Google Login'}
              </button>
              
              <button
                onClick={testGoogleRegister}
                disabled={isLoading}
                className="w-full bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 disabled:opacity-50"
              >
                {isLoading ? 'Testing Google Register...' : 'Test Google Register'}
              </button>
              
              <button
                onClick={testDirectGoogleAuth}
                disabled={isLoading}
                className="w-full bg-pink-500 text-white py-2 px-4 rounded hover:bg-pink-600 disabled:opacity-50"
              >
                Test Direct Google Auth
              </button>
              
              <button
                onClick={testLogout}
                disabled={isLoading}
                className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 disabled:opacity-50"
              >
                Test Logout
              </button>
              
              <button
                onClick={clearLogs}
                className="w-full bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
              >
                Clear Logs
              </button>
            </div>
          </div>

          {/* Test Results */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            
            <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-500">Ready for testing...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1 break-words">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/login')}
              className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Go to Login Page
            </button>
            
            <button
              onClick={() => router.push('/register')}
              className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
            >
              Go to Register Page
            </button>
            
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
            >
              Clear Storage & Reload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthTestPage;
