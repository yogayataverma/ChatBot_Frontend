// NotificationContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [permission, setPermission] = useState(Notification.permission);
  const [supported, setSupported] = useState('Notification' in window);

  useEffect(() => {
    if (supported && permission === 'default') {
      Notification.requestPermission().then((perm) => setPermission(perm));
    }
  }, [supported, permission]);

  return (
    <NotificationContext.Provider value={{ permission, supported }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
