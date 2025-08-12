import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, Sun, Moon, LogOut, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/router';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export const UserDropdown: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Info Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center space-x-3 p-2 rounded-lg transition-all duration-200",
          "hover:bg-gray-100 dark:hover:bg-gray-800",
          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
          "dark:focus:ring-offset-gray-900",
          isOpen && "bg-gray-100 dark:bg-gray-800"
        )}
      >
        <div className="flex items-center space-x-2">
          <div className="bg-primary-100 dark:bg-primary-900 p-2 rounded-full">
            <User className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user.email}
            </p>
          </div>
        </div>
        <ChevronDown 
          className={cn(
            "h-4 w-4 text-gray-400 transition-transform duration-200",
            isOpen && "transform rotate-180"
          )} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={cn(
          "absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg",
          "border border-gray-200 dark:border-gray-700 z-50",
          "animate-fade-in"
        )}>
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-100 dark:bg-primary-900 p-2 rounded-full">
                <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
                {user.company && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                    {user.company}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Settings Section */}
          <div className="px-2 py-2">
            <div className="px-2 py-1">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Settings
              </h3>
            </div>
            
            {/* Theme Toggle */}
            <button
              onClick={() => {
                toggleTheme();
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-md",
                "text-gray-700 dark:text-gray-300",
                "hover:bg-gray-100 dark:hover:bg-gray-700",
                "transition-colors duration-200"
              )}
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
              <span className="flex-1 text-left">
                Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
              </span>
              <div className={cn(
                "w-10 h-5 rounded-full transition-colors duration-200",
                theme === 'dark' ? "bg-primary-600" : "bg-gray-300"
              )}>
                <div className={cn(
                  "w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 mt-0.5 ml-0.5",
                  theme === 'dark' && "translate-x-5"
                )} />
              </div>
            </button>

            {/* Settings Button */}
            <button
              className={cn(
                "w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-md",
                "text-gray-700 dark:text-gray-300",
                "hover:bg-gray-100 dark:hover:bg-gray-700",
                "transition-colors duration-200"
              )}
              onClick={() => {
                router.push('/settings');
                setIsOpen(false);
              }}
            >
              <Settings className="h-4 w-4" />
              <span className="flex-1 text-left">Settings</span>
            </button>
          </div>

          {/* Logout Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-2 py-2">
            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-md",
                "text-red-600 dark:text-red-400",
                "hover:bg-red-50 dark:hover:bg-red-900/20",
                "transition-colors duration-200"
              )}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
