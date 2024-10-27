import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { usePushNotifications } from '../utils/pushManager';
import './Chat.css';

const Chat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [userStatus, setUserStatus] = useState('offline');
  const [deviceId, setDeviceId] = useState('');
  const chatWindowRef = useRef(null);
  const socketRef = useRef(null);

  // Initialize push notifications
  const { subscription, registration } = usePushNotifications(socketRef.current);

  // Initialize socket connection
  useEffect(() => {
    socketRef.current = io(process.env.REACT_APP_SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    socketRef.current.on('connect_error', (error) => {
      setIsConnected(false);
      console.error('Connection error:', error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Initialize device ID
  useEffect(() => {
    const generateDeviceId = () => {
      return 'user-' + Math.random().toString(36).substr(2, 9);
    };

    const newDeviceId = generateDeviceId();
    setDeviceId(newDeviceId);

    if (socketRef.current?.connected) {
      socketRef.current.emit('registerDevice', { deviceId: newDeviceId });
    }
  }, [isConnected]);

  // Socket event handlers
  useEffect(() => {
    if (!socketRef.current || !deviceId) return;

    socketRef.current.on('message', (msg) => {
      setMessages(prev => [...prev, {
        ...msg,
        isMe: msg.sender === deviceId
      }]);
      scrollToBottom();
    });

    socketRef.current.on('previousMessages', (msgs) => {
      setMessages(msgs.map(msg => ({
        ...msg,
        isMe: msg.sender === deviceId
      })));
      scrollToBottom();
    });

    socketRef.current.on('userStatus', (data) => {
      setUserStatus(data.status);
    });

    return () => {
      socketRef.current.off('message');
      socketRef.current.off('previousMessages');
      socketRef.current.off('userStatus');
    };
  }, [deviceId, scrollToBottom]); // Include scrollToBottom here

  // Handle subscription and registration changes
  useEffect(() => {
    if (registration) {
      // Handle registration updates here if necessary
    }
    
    if (subscription) {
      // Handle subscription updates here if necessary
    }
  }, [registration, subscription]); // Add registration and subscription to dependencies

  // Utility functions
  const scrollToBottom = useCallback(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, []);

  const formatTime = useCallback((timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Handle message sending
  const sendMessage = useCallback((e) => {
    e.preventDefault();
    if (message.trim() && deviceId && socketRef.current?.connected) {
      const newMessage = {
        text: message.trim(),
        sender: deviceId,
        timestamp: new Date().toISOString()
      };

      socketRef.current.emit('chatMessage', newMessage);
      setMessage('');
    }
  }, [message, deviceId]);

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1 className="chat-title">Connectify</h1>
        <div className={`status-indicator ${userStatus}`}>
          {isConnected ? userStatus : 'Disconnected'}
        </div>
      </div>
      
      {!isConnected && (
        <div className="connection-error">
          Attempting to connect to server...
        </div>
      )}
      
      <div className="chat-window" ref={chatWindowRef}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`chat-message ${msg.isMe ? 'chat-message-right' : 'chat-message-left'}`}
          >
            <div className="message-content">
              <p>{msg.text}</p>
              <span className="message-time">
                {formatTime(msg.timestamp)}
              </span>
              <span className="message-sender">
                {msg.isMe ? 'You' : 'Other'}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <form className="chat-form" onSubmit={sendMessage}>
        <input
          className="chat-input"
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          maxLength={500}
        />
        <button 
          className="chat-send-button" 
          type="submit"
          disabled={!message.trim() || !deviceId || !isConnected}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;
