import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [permission, setPermission] = useState('default');
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!('Notification' in window)) {
      setSupported(false);
      return;
    }

    setPermission(Notification.permission);

    const requestPermission = async () => {
      try {
        const result = await Notification.requestPermission();
        setPermission(result);
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    };

    if (permission === 'default') {
      requestPermission();
    }
  }, [permission]);

  return (
    <NotificationContext.Provider value={{ permission, supported }}>
      {children}
    </NotificationContext.Provider>
  );
};