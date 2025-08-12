import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { ArrowLeft, User, Lock, Save, Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ProtectedRoute from '../components/ProtectedRoute';

const SettingsPage: React.FC = () => {
  const { user, updateUserProfile, changePassword } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  // Combined form states
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    company: user?.company || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // UI states
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.currentPassword) {
      setMessage({ type: 'error', text: 'Current password is required to make any changes' });
      return;
    }

    // If changing password, validate new password
    if (isChangingPassword) {
      if (!formData.newPassword || !formData.confirmPassword) {
        setMessage({ type: 'error', text: 'Please fill in both new password fields' });
        return;
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        setMessage({ type: 'error', text: 'New passwords do not match' });
        return;
      }

      if (formData.newPassword.length < 6) {
        setMessage({ type: 'error', text: 'New password must be at least 6 characters long' });
        return;
      }
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // Always update profile information
      await updateUserProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        company: formData.company
      });

      // If changing password, update password as well
      if (isChangingPassword && formData.newPassword) {
        await changePassword(formData.currentPassword, formData.newPassword);
        setMessage({ type: 'success', text: 'Profile and password updated successfully!' });
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        setIsChangingPassword(false);
      } else {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setFormData(prev => ({
          ...prev,
          currentPassword: ''
        }));
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update settings' });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Don't render if user provider is Google (can't change password)
  const canChangePassword = user?.provider === 'email';

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Head>
          <title>Settings - WebSentinals</title>
          <meta name="description" content="Account settings and preferences" />
        </Head>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className={cn(
                "flex items-center space-x-2 text-gray-600 dark:text-gray-400",
                "hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 mb-4"
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Account Settings
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your account information and security settings
            </p>
          </div>

          {/* Combined Settings Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Account Settings
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Update your profile information and password. Current password is required for any changes.
              </p>
            </div>
            <div className="p-6">
              <form onSubmit={handleFormSubmit} className="space-y-6">
                {/* Profile Information Section */}
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                    Profile Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        className={cn(
                          "w-full px-3 py-2 border border-gray-300 dark:border-gray-600",
                          "rounded-md shadow-sm bg-white dark:bg-gray-700",
                          "text-gray-900 dark:text-gray-100",
                          "focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                          "dark:focus:ring-primary-400 dark:focus:border-primary-400"
                        )}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        className={cn(
                          "w-full px-3 py-2 border border-gray-300 dark:border-gray-600",
                          "rounded-md shadow-sm bg-white dark:bg-gray-700",
                          "text-gray-900 dark:text-gray-100",
                          "focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                          "dark:focus:ring-primary-400 dark:focus:border-primary-400"
                        )}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className={cn(
                        "w-full px-3 py-2 border border-gray-300 dark:border-gray-600",
                        "rounded-md shadow-sm bg-gray-100 dark:bg-gray-600",
                        "text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      )}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Email address cannot be changed
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                      className={cn(
                        "w-full px-3 py-2 border border-gray-300 dark:border-gray-600",
                        "rounded-md shadow-sm bg-white dark:bg-gray-700",
                        "text-gray-900 dark:text-gray-100",
                        "focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                        "dark:focus:ring-primary-400 dark:focus:border-primary-400"
                      )}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                {/* Password Change Section */}
                {canChangePassword && (
                  <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Password
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsChangingPassword(!isChangingPassword)}
                        className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500"
                      >
                        {isChangingPassword ? 'Cancel password change' : 'Change password'}
                      </button>
                    </div>
                    
                    {isChangingPassword && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords.new ? "text" : "password"}
                              value={formData.newPassword}
                              onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                              className={cn(
                                "w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600",
                                "rounded-md shadow-sm bg-white dark:bg-gray-700",
                                "text-gray-900 dark:text-gray-100",
                                "focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                                "dark:focus:ring-primary-400 dark:focus:border-primary-400"
                              )}
                              minLength={6}
                              required={isChangingPassword}
                              placeholder="Enter new password"
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility('new')}
                              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords.confirm ? "text" : "password"}
                              value={formData.confirmPassword}
                              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              className={cn(
                                "w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600",
                                "rounded-md shadow-sm bg-white dark:bg-gray-700",
                                "text-gray-900 dark:text-gray-100",
                                "focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                                "dark:focus:ring-primary-400 dark:focus:border-primary-400"
                              )}
                              minLength={6}
                              required={isChangingPassword}
                              placeholder="Confirm new password"
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility('confirm')}
                              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Current Password - Always Required */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        value={formData.currentPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className={cn(
                          "w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600",
                          "rounded-md shadow-sm bg-white dark:bg-gray-700",
                          "text-gray-900 dark:text-gray-100",
                          "focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                          "dark:focus:ring-primary-400 dark:focus:border-primary-400"
                        )}
                        required
                        placeholder="Enter your current password to confirm changes"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('current')}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Required to verify your identity before making any changes
                    </p>
                  </div>
                </div>

                {message && (
                  <div className={cn(
                    "p-3 rounded-md text-sm",
                    message.type === 'success'
                      ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                      : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                  )}>
                    {message.text}
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={cn(
                      "flex items-center justify-center space-x-2 py-2 px-6 rounded-md",
                      "bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600",
                      "text-white font-medium transition-colors duration-200",
                      "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                      "dark:focus:ring-offset-gray-800",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    <Save className="h-4 w-4" />
                    <span>{isLoading ? 'Saving Changes...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Info for Google users */}
          {!canChangePassword && (
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                  <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Password Settings
                </h2>
              </div>
              <p className="text-blue-700 dark:text-blue-300">
                You signed in using Google authentication. To change your password, 
                please visit your Google account settings.
              </p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default SettingsPage;
