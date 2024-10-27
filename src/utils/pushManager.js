import { useState, useEffect } from 'react';

// Convert a base64 URL string to a Uint8Array
const convertUrlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

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
      // Check for existing registration
      const existingReg = await navigator.serviceWorker.getRegistration();

      if (existingReg) {
        console.log('Found existing service worker');
        return existingReg;
      }

      console.log('Registering new service worker');
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;

      return reg;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  };

  const subscribeToNotifications = async (reg) => {
    try {
      // Check for existing subscription
      let sub = await reg.pushManager.getSubscription();

      if (sub) {
        console.log('Found existing push subscription');
        return sub;
      }

      // Get public key from environment
      const vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not found');
      }

      const convertedKey = convertUrlBase64ToUint8Array(vapidPublicKey);

      // Wait for service worker to be ready before subscribing
      await navigator.serviceWorker.ready;

      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });

      console.log('Created new push subscription');
      return sub;
    } catch (error) {
      console.error('Push subscription failed:', error);
      throw error;
    }
  };

  useEffect(() => {
    const initializePushNotifications = async () => {
      try {
        // Check notification permission
        if (Notification.permission === 'denied') {
          throw new Error('Notification permission denied');
        }

        // Request permission if not granted
        if (Notification.permission !== 'granted') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            throw new Error('Notification permission not granted');
          }
        }

        // Register service worker
        const reg = await registerServiceWorker();
        setRegistration(reg);

        // Ensure service worker is active before subscribing
        if (reg.active) {
          const sub = await subscribeToNotifications(reg);
          setSubscription(sub);

          // Send subscription to server if socket is connected
          if (socket?.connected && sub) {
            socket.emit('pushSubscription', { subscription: sub.toJSON() });
          }
        } else {
          // Wait for service worker to become active
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

    // Cleanup function
    return () => {
      if (registration) {
        // Don't unregister the service worker, just clean up the subscription if needed
        if (subscription) {
          subscription.unsubscribe().catch(console.error);
        }
      }
    };
  }, [socket]);

  return { subscription, registration, error };
};
