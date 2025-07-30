import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

const Custom404: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="bg-gradient-to-r from-primary-500 to-primary-700 p-3 rounded-xl">
            <Shield className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Error Content */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-gray-900">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700">Page not found</h2>
          <p className="text-gray-600 max-w-sm mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
          
          <div className="text-sm text-gray-500">
            <Link href="/login" className="text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
            {' · '}
            <Link href="/register" className="text-primary-600 hover:text-primary-500">
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Custom404;
