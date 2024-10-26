import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { getDeviceFingerprint } from '../utils/deviceFingerprint';
import './Chat.css';
import notificationSoundFile from '../assets/notification.mp3';

const Chat = () => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
    const [isTabActive, setIsTabActive] = useState(true);
    const [userStatus, setUserStatus] = useState('offline');
    const [deviceId, setDeviceId] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const chatWindowRef = useRef(null);
    const notificationSound = useRef(new Audio(notificationSoundFile));
    const socketRef = useRef(null);

    // Initialize socket connection with error handling
    useEffect(() => {
        try {
            socketRef.current = io('http://localhost:4000', {
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            socketRef.current.on('connect', () => {
                console.log('Connected to server');
                setIsConnected(true);
            });

            socketRef.current.on('connect_error', (error) => {
                console.error('Connection error:', error);
                setIsConnected(false);
            });

            return () => {
                if (socketRef.current) {
                    socketRef.current.disconnect();
                }
            };
        } catch (error) {
            console.error('Socket initialization error:', error);
        }
    }, []);

    // Initialize device fingerprint
    useEffect(() => {
        const initializeDevice = async () => {
            try {
                const id = await getDeviceFingerprint();
                setDeviceId(id);
                if (socketRef.current?.connected) {
                    socketRef.current.emit('registerDevice', { deviceId: id });
                }
            } catch (error) {
                console.error('Error initializing device:', error);
                const fallbackId = 'user-' + Math.random().toString(36).substr(2, 9);
                setDeviceId(fallbackId);
                if (socketRef.current?.connected) {
                    socketRef.current.emit('registerDevice', { deviceId: fallbackId });
                }
            }
        };

        if (isConnected) {
            initializeDevice();
        }
    }, [isConnected]);

    // Scroll chat to bottom
    const scrollToBottom = useCallback(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, []);

    // Request notification permission
    const requestNotificationPermission = async () => {
        try {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        }
    };

    // Show notification
    const showNotification = useCallback((msg) => {
        try {
            if (msg.sender !== deviceId) {
                notificationSound.current.play().catch(console.error);
            }
        } catch (error) {
            console.error('Error playing notification sound:', error);
        }

        if (notificationPermission === 'granted' && !isTabActive && msg.sender !== deviceId) {
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

    // Tab visibility handler
    useEffect(() => {
        const handleVisibilityChange = () => setIsTabActive(!document.hidden);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Socket event handlers
    useEffect(() => {
        if (!socketRef.current || !deviceId) return;

        socketRef.current.on('message', (msg) => {
            setMessages(prev => [...prev, {
                ...msg,
                isMe: msg.sender === deviceId
            }]);
            showNotification(msg);
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
    }, [deviceId, showNotification, scrollToBottom]);

    // Format timestamp
    const formatTime = useCallback((timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    }, []);

    // Send message
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
                    disabled={!message.trim() || !deviceId || !isConnected}
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default Chat;