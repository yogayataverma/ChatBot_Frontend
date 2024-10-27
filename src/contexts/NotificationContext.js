import React, { createContext, useContext, useState, useEffect } from 'react';

// Create NotificationContext
const NotificationContext = createContext();

// NotificationProvider component
export const NotificationProvider = ({ children }) => {
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  return (
    <NotificationContext.Provider value={{ permission }}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use NotificationContext
export const useNotification = () => {
  return useContext(NotificationContext);
};
