import React from 'react';

const Message = ({ message }) => {
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`chat-message ${message.isMe ? 'chat-message-right' : 'chat-message-left'}`}>
      <div className="message-content">
        <p>{message.text}</p>
        <span className="message-time">
          {formatTime(message.timestamp)}
        </span>
        <span className="message-sender">
          {message.isMe ? 'You' : 'Other'}
        </span>
      </div>
    </div>
  );
};

export default Message;