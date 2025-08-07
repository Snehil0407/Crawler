import React from 'react';
import { Shield, BarChart3, Bug, Clock, Bot } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { UserDropdown } from './UserDropdown';

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
  const { user } = useAuth();

  const handleTabClick = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  return (
    <header className={cn("bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-primary-500 to-primary-700 p-2 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">WebSentinals</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Web Security Audit Platform</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'scans', label: 'My Scans', icon: Clock },
              { id: 'reports', label: 'Reports', icon: Bug },
              { id: 'assistant', label: 'AI Assistant', icon: Bot },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleTabClick(id)}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  activeTab === id
                    ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center">
            {user && <UserDropdown />}
          </div>
        </div>
      </div>
    </header>
  );
};
