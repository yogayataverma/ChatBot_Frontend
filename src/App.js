import React from 'react';
import { NotificationProvider } from './contexts/NotificationContext'; // Adjust the path as necessary
import Chat from './components/Chat';

const App = () => {
    return (
        <NotificationProvider>
            <Chat />
        </NotificationProvider>
    );
};

export default App;
