import React, { createContext, useContext, useState, useEffect } from 'react';

// Create NotificationContext
const NotificationContext = createContext();

// NotificationProvider component
export const NotificationProvider = ({ children }) => {
  const [permission, setPermission] = useState('default');
  const supported = 'Notification' in window;  // Direct assignment, no need for setSupported

  useEffect(() => {
    if (supported) {
      setPermission(Notification.permission);
    }
  }, [supported]);

  return (
    <NotificationContext.Provider value={{ permission, supported }}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use NotificationContext
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
