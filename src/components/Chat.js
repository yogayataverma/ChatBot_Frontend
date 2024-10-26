import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { getDeviceFingerprint } from '../utils/deviceFingerprint';
import './Chat.css';

// Connect to your backend server
const socket = io('https://chatbot-backend-etdm.onrender.com');

const Chat = () => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
    const [isTabActive, setIsTabActive] = useState(true);
    const [userStatus, setUserStatus] = useState('offline');
    const [deviceId, setDeviceId] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const chatWindowRef = useRef(null);
    const notificationSound = useRef(new Audio('/notification.mp3'));

    // Initialize device fingerprint
    useEffect(() => {
        const initializeDevice = async () => {
            try {
                const id = await getDeviceFingerprint();
                setDeviceId(id);
                socket.emit('registerDevice', { deviceId: id });
                setIsConnected(true);
                console.log('Device registered:', id);
            } catch (error) {
                console.error('Error initializing device:', error);
                // Fallback to random ID if fingerprinting fails
                const fallbackId = 'user-' + Math.random().toString(36).substr(2, 9);
                setDeviceId(fallbackId);
                socket.emit('registerDevice', { deviceId: fallbackId });
            }
        };

        initializeDevice();

        return () => {
            if (isConnected) {
                socket.emit('unregisterDevice', { deviceId });
            }
        };
    }, []);

    // Notification permission
    const requestNotificationPermission = async () => {
        try {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
            console.log('Notification permission:', permission);
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        }
    };

    // Show notification
    const showNotification = useCallback((msg) => {
        try {
            notificationSound.current.play().catch(console.error);
        } catch (error) {
            console.error('Error playing notification sound:', error);
        }

        if (notificationPermission === 'granted' && !isTabActive) {
            try {
                const notification = new Notification('New Message in Connectify', {
                    body: `${msg.sender === deviceId ? 'You' : 'Other'}: ${msg.text}`,
                    icon: '/chat-icon.png',
                    badge: '/chat-badge.png',
                    vibrate: [200, 100, 200]
                });

                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };
            } catch (error) {
                console.error('Error showing notification:', error);
            }
        }
    }, [notificationPermission, isTabActive, deviceId]);

    // Tab visibility
    useEffect(() => {
        const handleVisibilityChange = () => setIsTabActive(!document.hidden);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Socket event handlers
    useEffect(() => {
        if (!deviceId) return;

        // Previous messages
        socket.on('previousMessages', (msgs) => {
            setMessages(msgs.map(msg => ({
                ...msg,
                isMe: msg.sender === deviceId
            })));
            scrollToBottom();
        });

        // New message
        socket.on('message', (msg) => {
            setMessages(prev => [...prev, {
                ...msg,
                isMe: msg.sender === deviceId
            }]);
            showNotification(msg);
            scrollToBottom();
        });

        // User status
        socket.on('userStatus', (data) => {
            setUserStatus(data.status);
        });

        // Error handling
        socket.on('error', (error) => {
            console.error('Socket error:', error);
            // You could add a toast notification here
        });

        return () => {
            socket.off('previousMessages');
            socket.off('message');
            socket.off('userStatus');
            socket.off('error');
        };
    }, [deviceId, showNotification]);

    // Scroll chat to bottom
    const scrollToBottom = () => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    };

    // Send message
    const sendMessage = (e) => {
        e.preventDefault();
        if (message.trim() && deviceId) {
            const newMessage = {
                text: message,
                sender: deviceId,
                timestamp: new Date(),
                isMe: true
            };
            
            socket.emit('chatMessage', newMessage);

            setMessages(prev => [...prev, newMessage]);
            setMessage('');
            scrollToBottom();
        }
    };

    // Format timestamp
    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h1 className="chat-title">Connectify</h1>
                <div className={`status-indicator ${userStatus}`}>
                    {userStatus === 'online' ? 'Online' : 'Offline'}
                </div>
            </div>
            
            {notificationPermission === 'default' && (
                <button 
                    className="notification-permission-button"
                    onClick={requestNotificationPermission}
                >
                    Enable Notifications
                </button>
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
                    disabled={!message.trim() || !deviceId}
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default Chat;