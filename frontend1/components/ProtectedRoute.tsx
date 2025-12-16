import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    console.log('ProtectedRoute - Auth state check:', { 
      isLoading, 
      isAuthenticated, 
      hasUser: !!user,
      userEmail: user?.email 
    });

    // Wait for initial auth check to complete
    if (!isLoading) {
      setHasCheckedAuth(true);
      
      // Only redirect if we've completed the initial auth check and user is not authenticated
      if (!isAuthenticated) {
        console.log('ProtectedRoute - Redirecting to login because user is not authenticated');
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, router, user]);

  // Show loading spinner while checking authentication or haven't completed initial check
  if (isLoading || !hasCheckedAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Render children if authenticated
  return <>{children}</>;
};

export default ProtectedRoute;
