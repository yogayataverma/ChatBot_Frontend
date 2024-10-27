import React from 'react';
import Message from './Message';

const MessageList = ({ messages, chatWindowRef }) => {
  return (
    <div className="chat-window" ref={chatWindowRef}>
      {messages.map((msg, index) => (
        <Message key={index} message={msg} />
      ))}
    </div>
  );
};

export default MessageList;