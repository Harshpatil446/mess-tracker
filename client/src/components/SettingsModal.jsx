import { useState, useEffect } from 'react';
import { X, Bell } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

import api from '../services/api';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const SettingsModal = ({ isOpen, onClose }) => {
  const { user, updateLocalUser } = useAuth();
  const [time, setTime] = useState('10:00');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (user && user.notificationTime) {
      setTime(user.notificationTime);
    }
  }, [user]);

  const handleSubscribe = async () => {
    try {
      setStatus('Requesting permission...');
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        setStatus('Permission denied.');
        return;
      }

      setStatus('Setting up notifications...');
      const registration = await navigator.serviceWorker.ready;
      
      // Get VAPID key from backend
      const vapidRes = await api.get('/notifications/vapidPublicKey');
      const { publicKey } = vapidRes.data;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      // Save subscription to backend
      await api.post('/notifications/subscribe', { subscription });

      // Save time
      const timeRes = await api.post('/notifications/time', { time });
      
      // Update local user context so it persists on reload
      updateLocalUser({ notificationTime: time });

      setStatus('Notifications set successfully!');
      setTimeout(() => {
        setStatus('');
        onClose();
      }, 2000);
    } catch (error) {
      console.error(error);
      setStatus(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-emerald-500" />
            <h3 className="font-bold text-gray-800 dark:text-gray-100">Daily Reminders</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Set a daily reminder to update your mess/tiffin status so you never forget!
          </p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reminder Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 dark:text-gray-100 dark:[color-scheme:dark]"
            />
          </div>
          
          {status && (
            <p className={`text-xs font-medium ${status.includes('Error') || status.includes('denied') ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {status}
            </p>
          )}

          <button
            onClick={handleSubscribe}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-colors shadow-sm"
          >
            Enable Notifications
          </button>
        </div>
      </div>
    </div>
  );
};
