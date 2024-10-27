import React from 'react';

const MessageInput = ({ message, setMessage, sendMessage, isDisabled }) => {
  return (
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
        disabled={!message.trim() || isDisabled}
      >
        Send
      </button>
    </form>
  );
};

export default MessageInput;