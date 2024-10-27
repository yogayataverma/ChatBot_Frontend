import { useState, useEffect } from 'react';
import { convertUrlBase64ToUint8Array } from '../utils/helpers';

export const usePushNotifications = (socket) => {
  const [subscription, setSubscription] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [error, setError] = useState(null);

  const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker is not supported in this browser');
    }

    if (!('PushManager' in window)) {
      throw new Error('Push notifications are not supported in this browser');
    }

    try {
      const existingReg = await navigator.serviceWorker.getRegistration();
      
      if (existingReg) {
        console.log('Found existing service worker');
        return existingReg;
      }

      console.log('Registering new service worker');
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      await navigator.serviceWorker.ready;
      return reg;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  };

  const subscribeToNotifications = async (reg) => {
    try {
      console.log('Attempting to subscribe to push notifications');
      
      let sub = await reg.pushManager.getSubscription();
      
      if (sub) {
        console.log('Found existing push subscription:', sub);
        return sub;
      }

      const vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not found in environment variables');
      }

      console.log('Creating new push subscription...');
      const convertedKey = convertUrlBase64ToUint8Array(vapidPublicKey);
      
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });

      console.log('Successfully created push subscription:', sub);
      return sub;
    } catch (error) {
      console.error('Detailed push subscription error:', error);
      throw error;
    }
  };

  useEffect(() => {
    const initializePushNotifications = async () => {
      try {
        if (Notification.permission === 'denied') {
          throw new Error('Notification permission denied');
        }

        const reg = await registerServiceWorker();
        setRegistration(reg);

        if (reg.active) {
          const sub = await subscribeToNotifications(reg);
          setSubscription(sub);

          if (socket?.connected && sub) {
            socket.emit('pushSubscription', { subscription: sub.toJSON() });
          }
        } else {
          reg.addEventListener('activate', async () => {
            const sub = await subscribeToNotifications(reg);
            setSubscription(sub);

            if (socket?.connected && sub) {
              socket.emit('pushSubscription', { subscription: sub.toJSON() });
            }
          });
        }
      } catch (error) {
        setError(error.message);
        console.error('Push notification initialization failed:', error);
      }
    };

    initializePushNotifications();

    return () => {
      if (registration && subscription) {
        subscription.unsubscribe().catch(console.error);
      }
    };
  }, [socket]);

  return { subscription, registration, error };
};