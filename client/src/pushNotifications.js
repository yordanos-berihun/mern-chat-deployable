import { api, API_BASE } from './apiClient';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      return null;
    }
  }
  return null;
};

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  
  const permission = await Notification.requestPermission();
  return permission;
};

export const subscribeToPush = async () => {
  const registration = await registerServiceWorker();
  if (!registration) return null;
  
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') return null;
  
  try {
    const token = localStorage.getItem('token');
    const { publicKey } = await api.get('/api/notifications/vapid-public-key');
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });
    
    await api.post('/api/notifications/subscribe', { subscription });
    
    return subscription;
  } catch (error) {
    console.error('Push subscription failed:', error);
    return null;
  }
};

export const unsubscribeFromPush = async () => {
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return;
  
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  
  try {
    await api.post('/api/notifications/unsubscribe', { endpoint: subscription.endpoint });
    
    await subscription.unsubscribe();
  } catch (error) {
    console.error('Unsubscribe failed:', error);
  }
};

export const updateNotificationSettings = async (settings) => {
  await api.put('/api/notifications/settings', { settings });
};
