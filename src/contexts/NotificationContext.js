import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [permission, setPermission] = useState('default'); // Initialize with 'default' or the actual permission
    const supported = 'Notification' in window;

    useEffect(() => {
        if (supported) {
            Notification.requestPermission().then((perm) => setPermission(perm));
        }
    }, [supported]);

    return (
        <NotificationContext.Provider value={{ permission, supported }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);
