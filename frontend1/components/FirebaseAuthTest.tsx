// Firebase authentication test
import React, { useEffect, useState } from 'react';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

const FirebaseAuthTest: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [checkEmailResult, setCheckEmailResult] = useState<string>('');
  const [testEmail, setTestEmail] = useState('');
  const { checkIfUserExists } = useAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser);
      setUser(firebaseUser);
    });

    return () => unsubscribe();
  }, []);

  const testGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Testing Google sign-in...');
      console.log('Auth object:', auth);
      console.log('Google provider:', googleProvider);
      
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Sign-in successful:', result);
      
    } catch (error: any) {
      console.error('Sign-in error:', error);
      setError(`Error: ${error.code} - ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testCheckUserExists = async () => {
    if (!testEmail) {
      setCheckEmailResult('Please enter an email to test');
      return;
    }
    
    setLoading(true);
    try {
      const exists = await checkIfUserExists(testEmail);
      setCheckEmailResult(exists ? `User exists with email: ${testEmail}` : `No user found with email: ${testEmail}`);
    } catch (error: any) {
      setCheckEmailResult(`Error checking user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h2>Firebase Auth Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <p><strong>Firebase Config Status:</strong></p>
        <p>Auth Domain: {auth.app.options.authDomain}</p>
        <p>Project ID: {auth.app.options.projectId}</p>
        <p>API Key: {auth.app.options.apiKey ? 'Present' : 'Missing'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <p><strong>Current User:</strong></p>
        {user ? (
          <div>
            <p>Email: {user.email}</p>
            <p>Display Name: {user.displayName}</p>
            <p>UID: {user.uid}</p>
          </div>
        ) : (
          <p>No user signed in</p>
        )}
      </div>

      <button 
        onClick={testGoogleSignIn}
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: '#4285f4',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Testing...' : 'Test Google Sign-In'}
      </button>

      {error && (
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          backgroundColor: '#fee', 
          border: '1px solid #fcc',
          borderRadius: '5px',
          color: '#c00'
        }}>
          {error}
        </div>
      )}

      {/* Test Check User Exists */}
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
        <h3>Test User Exists Check</h3>
        <input
          type="email"
          placeholder="Enter email to check"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          style={{
            width: '70%',
            padding: '8px',
            marginRight: '10px',
            border: '1px solid #ccc',
            borderRadius: '3px'
          }}
        />
        <button
          onClick={testCheckUserExists}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Check
        </button>
        {checkEmailResult && (
          <div style={{ 
            marginTop: '10px', 
            padding: '8px', 
            backgroundColor: '#e7f3ff', 
            border: '1px solid #b3d9ff',
            borderRadius: '3px',
            fontSize: '14px'
          }}>
            {checkEmailResult}
          </div>
        )}
      </div>
    </div>
  );
};

export default FirebaseAuthTest;
