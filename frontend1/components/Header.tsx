import React from 'react';
import { Shield, BarChart3, Bug, Clock, LogOut, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeTab = 'dashboard', 
  onTabChange, 
  className 
}) => {
  const { user, logout } = useAuth();

  const handleTabClick = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  return (
    <header className={cn("bg-white shadow-sm border-b border-gray-200", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-primary-500 to-primary-700 p-2 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">WebSentinals</h1>
              <p className="text-xs text-gray-500">Web Security Audit Platform</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'scans', label: 'Recent Scans', icon: Clock },
              { id: 'reports', label: 'Reports', icon: Bug },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleTabClick(id)}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  activeTab === id
                    ? "text-primary-600 bg-primary-50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <div className="bg-primary-100 p-2 rounded-full">
                    <User className="h-4 w-4 text-primary-600" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
