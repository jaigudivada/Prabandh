import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Bell, Shield, Save } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your application preferences.</p>
      </div>

      <div className="card space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance</h2>
          <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
            <div className="flex items-center gap-3 min-w-0">
              {darkMode ? <Moon className="h-5 w-5 shrink-0 text-gray-600 dark:text-gray-400" /> : <Sun className="h-5 w-5 shrink-0 text-gray-600" />}
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Dark Mode</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Toggle dark/light theme</p>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors ${darkMode ? 'bg-primary-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notifications</h2>
          <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
            <div className="flex items-center gap-3 min-w-0">
              <Bell className="h-5 w-5 shrink-0 text-gray-600 dark:text-gray-400" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Push Notifications</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Receive updates about issues</p>
              </div>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`relative shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications ? 'bg-primary-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account</h2>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="h-5 w-5 shrink-0 text-gray-600 dark:text-gray-400" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Role</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>

        <button onClick={handleSave} className="btn-primary gap-2 w-full sm:w-auto">
          <Save className="h-4 w-4" />
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}