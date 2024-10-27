import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './Chat.css';

const SOCKET_URL = 'http://localhost:5000';

const Chat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceId] = useState('user-' + Math.random().toString(36).substr(2, 9));
  const socketRef = useRef();
  const chatWindowRef = useRef();

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      socketRef.current.emit('registerDevice', { deviceId });
    });

    socketRef.current.on('message', (msg) => {
      setMessages(prev => [...prev, { ...msg, isMe: msg.sender === deviceId }]);
    });

    socketRef.current.on('previousMessages', (msgs) => {
      setMessages(msgs.map(msg => ({ ...msg, isMe: msg.sender === deviceId })));
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [deviceId]);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && isConnected) {
      const newMessage = {
        text: message.trim(),
        sender: deviceId,
        timestamp: new Date().toISOString()
      };
      socketRef.current.emit('chatMessage', newMessage);
      setMessage('');
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>Simple Chat</h1>
        <div className={`status-indicator ${isConnected ? 'online' : 'offline'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      <div className="message-list" ref={chatWindowRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.isMe ? 'message-mine' : 'message-other'}`}>
            <div className="message-content">
              <div className="message-text">{msg.text}</div>
              <div className="message-timestamp">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="message-input-container">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={!isConnected}
          className="message-input"
        />
        <button
          type="submit"
          disabled={!isConnected || !message.trim()}
          className="send-button"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;