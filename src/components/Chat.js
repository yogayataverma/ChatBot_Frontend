import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import './Chat.css';

const socket = io('https://chatbot-backend-etdm.onrender.com');

const Chat = () => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
    const [isTabActive, setIsTabActive] = useState(true);
    const [userStatus, setUserStatus] = useState('offline');
    const chatWindowRef = useRef(null);
    
    // Create audio element for notification sound
    const notificationSound = new Audio('/notification.mp3');

    // Function to scroll to bottom of chat
    const scrollToBottom = () => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    };

    // Function to handle notification permissions
    const requestNotificationPermission = async () => {
        try {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
            if (permission === 'granted') {
                console.log('Notification permission granted');
            } else {
                console.log('Notification permission denied');
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        }
    };

    // Function to show notification - moved into useCallback
    const showNotification = useCallback((msg) => {
        // Play notification sound
        try {
            notificationSound.play().catch(error => {
                console.log('Error playing notification sound:', error);
            });
        } catch (error) {
            console.log('Error with audio playback:', error);
        }

        // Show desktop notification if permission granted and tab is not active
        if (notificationPermission === 'granted' && !isTabActive) {
            try {
                const notification = new Notification('New Message in Connectify', {
                    body: `${msg.sender}: ${msg.text}`,
                    icon: '/chat-icon.png',
                    badge: '/chat-badge.png',
                    vibrate: [200, 100, 200],
                    tag: 'Connectify Message',
                    renotify: true
                });

                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };
            } catch (error) {
                console.error('Error showing notification:', error);
            }
        }
    }, [notificationPermission, isTabActive]); // Added dependencies

    // Handle tab visibility
    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsTabActive(!document.hidden);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Request notification permission on component mount
    useEffect(() => {
        requestNotificationPermission();
    }, []);

    // Handle messages and socket events
    useEffect(() => {
        // Handle previous messages
        socket.on('previousMessages', (msgs) => {
            setMessages(msgs.map(msg => ({
                text: msg.text,
                sender: msg.sender,
                timestamp: msg.timestamp,
                isMe: msg.sender === 'me'
            })));
            scrollToBottom();
        });

        // Handle incoming messages
        socket.on('message', (msg) => {
            console.log('New message received:', msg);
            setMessages((prevMessages) => [
                ...prevMessages,
                { 
                    text: msg.text, 
                    sender: msg.sender,
                    timestamp: msg.timestamp,
                    isMe: false
                }
            ]);
            showNotification(msg);
            scrollToBottom();
        });

        // Handle user status updates
        socket.on('userStatus', (data) => {
            setUserStatus(data.status);
        });

        // Handle errors
        socket.on('error', (error) => {
            console.error('Socket error:', error);
            // You could add a toast notification here
        });

        return () => {
            socket.off('message');
            socket.off('previousMessages');
            socket.off('userStatus');
            socket.off('error');
        };
    }, [showNotification]); // Added showNotification to dependencies

    // Handle sending messages
    const sendMessage = (e) => {
        e.preventDefault();
        if (message.trim()) {
            const newMessage = { 
                text: message, 
                sender: 'me',
                timestamp: new Date(),
                isMe: true
            };
            socket.emit('chatMessage', newMessage);

            setMessages((prevMessages) => [
                ...prevMessages,
                newMessage
            ]);

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

    // Render notification permission button if needed
    const renderNotificationButton = () => {
        if (notificationPermission === 'default') {
            return (
                <button 
                    className="notification-permission-button"
                    onClick={requestNotificationPermission}
                >
                    Enable Notifications
                </button>
            );
        }
        return null;
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h1 className="chat-title">Connectify</h1>
                <div className={`status-indicator ${userStatus}`}>
                    {userStatus === 'online' ? 'Online' : 'Offline'}
                </div>
            </div>
            {renderNotificationButton()}
            <div className="chat-window" ref={chatWindowRef}>
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`chat-message ${msg.isMe ? 'chat-message-right' : 'chat-message-left'}`}>
                        <div className="message-content">
                            <p>{msg.text}</p>
                            <span className="message-time">
                                {formatTime(msg.timestamp)}
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
                    disabled={!message.trim()}
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default Chat;