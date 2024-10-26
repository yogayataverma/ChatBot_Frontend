import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './Chat.css';  // Assuming you have this CSS file

// Connect to the backend
const socket = io('https://chatbot-backend-etdm.onrender.com:5000/');

const Chat = () => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);

    // Show notification function
    const showNotification = (msg) => {
        if (Notification.permission === 'granted') {
            new Notification('New Message', {
                body: `${msg.sender}: ${msg.text}`,
                icon: 'https://cdn-icons-png.flaticon.com/512/1827/1827312.png' // Replace with your valid icon URL
            });
        } else {
            console.log('Notification permission not granted:', Notification.permission);
        }
    };

    // Listen for new and previous messages from the server
    useEffect(() => {
        // Request notification permission on component mount
        if (Notification.permission === 'default') {
            Notification.requestPermission().then((permission) => {
                console.log('Notification permission:', permission);
            });
        }

        // Listen for previous messages
        socket.on('previousMessages', (msgs) => {
            setMessages(msgs.map(msg => ({
                text: msg.text,
                sender: msg.sender
            })));
        });

        // Listen for new incoming messages in real-time
        socket.on('message', (msg) => {
            console.log('New message received:', msg);
            setMessages((prevMessages) => [
                ...prevMessages,
                { text: msg.text, sender: msg.sender }
            ]);
            showNotification(msg);  // Trigger notification for new messages
        });

        // Cleanup socket connection on unmount
        return () => {
            socket.off('message');
            socket.off('previousMessages');
        };
    }, []);

    // Handle sending of a message
    const sendMessage = (e) => {
        e.preventDefault();
        if (message.trim()) {
            // Sending the message along with the sender information ('me')
            const newMessage = { text: message, sender: 'me' };
            socket.emit('chatMessage', newMessage);  // Send message to the server

            // Update the local state with the new message
            setMessages((prevMessages) => [
                ...prevMessages,
                newMessage
            ]);

            setMessage('');  // Clear input field
        }
    };

    return (
        <div className="chat-container">
            <h1 className="chat-title">Connectify</h1>
            <div className="chat-window">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`chat-message ${msg.sender === 'me' ? 'chat-message-right' : 'chat-message-left'}`}>
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
