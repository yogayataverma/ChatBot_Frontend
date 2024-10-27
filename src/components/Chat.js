import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useNotification } from '../contexts/NotificationContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import './Chat.css';

const Chat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [userStatus, setUserStatus] = useState('offline');
  const [deviceId, setDeviceId] = useState('');
  const chatWindowRef = useRef(null);
  const socketRef = useRef(null);
  const { permission, supported } = useNotification();

  const { subscription, registration, error } = usePushNotifications(socketRef.current);

  const scrollToBottom = useCallback(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, []);

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

    const handleMessage = (msg) => {
      setMessages(prev => [...prev, {
        ...msg,
        isMe: msg.sender === deviceId
      }]);
      scrollToBottom();
    };

    const handlePreviousMessages = (msgs) => {
      setMessages(msgs.map(msg => ({
        ...msg,
        isMe: msg.sender === deviceId
      })));
      scrollToBottom();
    };

    const handleUserStatus = (data) => {
      setUserStatus(data.status);
    };

    socketRef.current.on('message', handleMessage);
    socketRef.current.on('previousMessages', handlePreviousMessages);
    socketRef.current.on('userStatus', handleUserStatus);

    return () => {
      socketRef.current.off('message', handleMessage);
      socketRef.current.off('previousMessages', handlePreviousMessages);
      socketRef.current.off('userStatus', handleUserStatus);
    };
  }, [deviceId, scrollToBottom]);

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
        {!supported && (
          <div className="notification-warning">
            Notifications are not supported in this browser
          </div>
        )}
        {permission === 'denied' && (
          <div className="notification-warning">
            Please enable notifications to receive message alerts
          </div>
        )}
      </div>
      
      {!isConnected && (
        <div className="connection-error">
          Attempting to connect to server...
        </div>
      )}
      
      <MessageList
        messages={messages}
        chatWindowRef={chatWindowRef}
      />
      
      <MessageInput
        message={message}
        setMessage={setMessage}
        sendMessage={sendMessage}
        isDisabled={!deviceId || !isConnected}
      />
    </div>
  );
};

export default Chat;