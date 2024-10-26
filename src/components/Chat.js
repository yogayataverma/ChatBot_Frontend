import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './Chat.css';

const socket = io('https://chatbot-backend-etdm.onrender.com');

const Chat = () => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);

    const showNotification = (msg) => {
        if (Notification.permission === 'granted') {
            new Notification('New Message', {
                body: `${msg.sender}: ${msg.text}`,
                icon: 'https://cdn-icons-png.flaticon.com/512/1827/1827312.png'
            });
        } else {
            console.log('Notification permission not granted:', Notification.permission);
        }
    };

    useEffect(() => {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then((permission) => {
                console.log('Notification permission:', permission);
            });
        }

        // Handle previous messages
        socket.on('previousMessages', (msgs) => {
            setMessages(msgs.map(msg => ({
                text: msg.text,
                sender: msg.sender,
                isMe: msg.sender === 'me' // Add isMe flag for previous messages
            })));
        });

        // Handle incoming messages
        socket.on('message', (msg) => {
            console.log('New message received:', msg);
            setMessages((prevMessages) => [
                ...prevMessages,
                { 
                    text: msg.text, 
                    sender: msg.sender,
                    isMe: false // Incoming messages are always from others
                }
            ]);
            showNotification(msg);
        });

        return () => {
            socket.off('message');
            socket.off('previousMessages');
        };
    }, []);

    const sendMessage = (e) => {
        e.preventDefault();
        if (message.trim()) {
            const newMessage = { 
                text: message, 
                sender: 'me',
                isMe: true // Sent messages are always from me
            };
            socket.emit('chatMessage', newMessage);

            setMessages((prevMessages) => [
                ...prevMessages,
                newMessage
            ]);

            setMessage('');
        }
    };

    return (
        <div className="chat-container">
            <h1 className="chat-title">Connectify</h1>
            <div className="chat-window">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`chat-message ${msg.isMe ? 'chat-message-right' : 'chat-message-left'}`}>
                        <p>{msg.text}</p>
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
                />
                <button className="chat-send-button" type="submit">Send</button>
            </form>
        </div>
    );
};

export default Chat;