'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  ArrowLeft, 
  Sun, 
  Moon, 
  Monitor, 
  Bell, 
  Eye, 
  EyeOff, 
  Save,
  Laptop,
  Chrome,
  Clock,
  User
} from 'lucide-react';
import { useTheme } from 'next-themes';

interface UserSettings {
  displayName: string;
  email: string;
  photoURL: string | null;
  settings: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    sessionCapture: {
      enabled: boolean;
      captureApps: boolean;
      captureBrowsers: boolean;
      saveLocation: 'local' | 'cloud' | 'none';
    }
  }
}

export default function Settings() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    displayName: '',
    email: '',
    photoURL: null,
    settings: {
      theme: 'system',
      notifications: true,
      sessionCapture: {
        enabled: true,
        captureApps: true,
        captureBrowsers: true,
        saveLocation: 'local'
      }
    }
  });

  // Load user settings
  useEffect(() => {
    if (session?.user?.id) {
      fetchUserSettings();
    }
  }, [session]);

  // Update theme when userSettings.settings.theme changes
  useEffect(() => {
    if (!isLoading && userSettings.settings.theme) {
      setTheme(userSettings.settings.theme);
    }
  }, [userSettings.settings.theme, isLoading, setTheme]);

  const fetchUserSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/user/settings');
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      
      const data = await response.json();
      setUserSettings(data);
    } catch (err) {
      setError('Error loading settings. Please try again.');
      console.error('Error fetching user settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle notification setting
  const toggleNotification = () => {
    setUserSettings({
      ...userSettings,
      settings: {
        ...userSettings.settings,
        notifications: !userSettings.settings.notifications
      }
    });
  };

  // Toggle session setting
  const toggleSessionSetting = (key: keyof typeof userSettings.settings.sessionCapture) => {
    setUserSettings({
      ...userSettings,
      settings: {
        ...userSettings.settings,
        sessionCapture: {
          ...userSettings.settings.sessionCapture,
          [key]: !userSettings.settings.sessionCapture[key]
        }
      }
    });
  };
  
  // Handle theme change
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setUserSettings({
      ...userSettings,
      settings: {
        ...userSettings.settings,
        theme: newTheme
      }
    });
  };
  
  // Handle save location change
  const handleSaveLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as 'local' | 'cloud' | 'none';
    setUserSettings({
      ...userSettings,
      settings: {
        ...userSettings.settings,
        sessionCapture: {
          ...userSettings.settings.sessionCapture,
          saveLocation: value
        }
      }
    });
  };
  
  // Handle name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserSettings({
      ...userSettings,
      displayName: e.target.value
    });
  };
  
  // Save settings
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: userSettings.displayName,
          settings: userSettings.settings
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update settings');
      }
      
      setSuccessMessage('Settings saved successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setError('Error saving settings. Please try again.');
      console.error('Error updating user settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Back to Dashboard */}
      <div className="mb-6">
        <a 
          href="/dashboard"
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span className="text-sm">Back to Dashboard</span>
        </a>
      </div>
      
      {/* Settings Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account preferences and application settings</p>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}
      
      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 rounded-lg">
          {successMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Settings Sections */}
        <div className="space-y-8">
          {/* Profile Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <h2 className="text-lg font-medium text-gray-800 dark:text-white flex items-center">
                <User className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                Profile Settings
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Display Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    value={userSettings.displayName}
                    onChange={handleNameChange}
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white bg-gray-100 dark:bg-gray-600"
                    value={userSettings.email}
                    disabled
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Profile Image
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 text-xl font-medium overflow-hidden">
                      {userSettings.photoURL ? (
                        <img src={userSettings.photoURL} alt={userSettings.displayName} className="h-full w-full object-cover" />
                      ) : (
                        userSettings.displayName.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <button 
                      type="button" 
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Change Image
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Theme Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <h2 className="text-lg font-medium text-gray-800 dark:text-white">Appearance</h2>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    type="button"
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border ${
                      userSettings.settings.theme === 'light' 
                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => handleThemeChange('light')}
                  >
                    <Sun className={`w-6 h-6 ${
                      userSettings.settings.theme === 'light' 
                        ? 'text-blue-500 dark:text-blue-400' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`} />
                    <span className={
                      userSettings.settings.theme === 'light' 
                        ? 'text-blue-600 dark:text-blue-400 font-medium' 
                        : 'text-gray-700 dark:text-gray-300'
                    }>Light</span>
                  </button>
                  
                  <button
                    type="button"
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border ${
                      userSettings.settings.theme === 'dark' 
                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => handleThemeChange('dark')}
                  >
                    <Moon className={`w-6 h-6 ${
                      userSettings.settings.theme === 'dark' 
                        ? 'text-blue-500 dark:text-blue-400' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`} />
                    <span className={
                      userSettings.settings.theme === 'dark' 
                        ? 'text-blue-600 dark:text-blue-400 font-medium' 
                        : 'text-gray-700 dark:text-gray-300'
                    }>Dark</span>
                  </button>
                  
                  <button
                    type="button"
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border ${
                      userSettings.settings.theme === 'system' 
                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => handleThemeChange('system')}
                  >
                    <Monitor className={`w-6 h-6 ${
                      userSettings.settings.theme === 'system' 
                        ? 'text-blue-500 dark:text-blue-400' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`} />
                    <span className={
                      userSettings.settings.theme === 'system' 
                        ? 'text-blue-600 dark:text-blue-400 font-medium' 
                        : 'text-gray-700 dark:text-gray-300'
                    }>System</span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {userSettings.settings.theme === 'system' && "Matches your device's theme setting"}
                  {userSettings.settings.theme === 'light' && "Uses light theme regardless of device settings"}
                  {userSettings.settings.theme === 'dark' && "Uses dark theme regardless of device settings"}
                </p>
              </div>
            </div>
          </div>
          
          {/* Notification Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <h2 className="text-lg font-medium text-gray-800 dark:text-white flex items-center">
                <Bell className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                Notifications
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Notifications</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Receive notifications about projects and sessions</p>
                </div>
                <button
                  type="button"
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    userSettings.settings.notifications ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                  onClick={toggleNotification}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-200 shadow ring-0 transition duration-200 ease-in-out ${
                      userSettings.settings.notifications ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
          
          {/* Session Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <h2 className="text-lg font-medium text-gray-800 dark:text-white flex items-center">
                <Clock className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                Session Settings
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Capture environment</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Save your working environment (desktop only)</p>
                  </div>
                  <button
                    type="button"
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      userSettings.settings.sessionCapture.enabled ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                    onClick={() => toggleSessionSetting('enabled')}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-200 shadow ring-0 transition duration-200 ease-in-out ${
                        userSettings.settings.sessionCapture.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                
                {userSettings.settings.sessionCapture.enabled && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Capture applications</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Track which applications are open during sessions</p>
                      </div>
                      <button
                        type="button"
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          userSettings.settings.sessionCapture.captureApps ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                        onClick={() => toggleSessionSetting('captureApps')}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-200 shadow ring-0 transition duration-200 ease-in-out ${
                            userSettings.settings.sessionCapture.captureApps ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Capture browser tabs</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Record which browser tabs are open during sessions</p>
                      </div>
                      <button
                        type="button"
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          userSettings.settings.sessionCapture.captureBrowsers ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                        onClick={() => toggleSessionSetting('captureBrowsers')}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-200 shadow ring-0 transition duration-200 ease-in-out ${
                            userSettings.settings.sessionCapture.captureBrowsers ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    
                    <div>
                      <label htmlFor="snapshot-storage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Environment Snapshot Storage
                      </label>
                      <select
                        id="snapshot-storage"
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
                        value={userSettings.settings.sessionCapture.saveLocation}
                        onChange={handleSaveLocationChange}
                      >
                        <option value="local">Store locally only (default)</option>
                        <option value="cloud">Store in the cloud</option>
                        <option value="none">Don't store snapshots</option>
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {userSettings.settings.sessionCapture.saveLocation === 'local' && "Snapshots are stored only on your device and never uploaded"}
                        {userSettings.settings.sessionCapture.saveLocation === 'cloud' && "Snapshots are securely stored in the cloud for access across devices"}
                        {userSettings.settings.sessionCapture.saveLocation === 'none' && "No snapshots will be saved, you'll need to set up your environment manually each time"}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}