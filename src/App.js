import React from 'react';
import { NotificationProvider } from './contexts/NotificationContext'; // Adjust path accordingly
import Chat from './components/Chat';

function App() {
  return (
    <NotificationProvider>
      <div className="App">
        <Chat />
      </div>
    </NotificationProvider>
  );
}

export default App;
