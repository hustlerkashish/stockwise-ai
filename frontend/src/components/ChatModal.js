import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FiX, FiSend, FiMessageSquare } from 'react-icons/fi';

const ChatModal = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { type: 'bot', text: 'Hello! How can I help you analyze the market today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatBodyRef = useRef(null);

  // Automatically scroll to the bottom when new messages are added
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const newHistory = [...chatHistory, { type: 'user', text: message }];
    setChatHistory(newHistory);
    setMessage('');
    setIsLoading(true);

    try {
      // This is the REAL API call to your n8n conversational workflow
      // Note: Make sure the n8n workflow is configured to handle general queries
      const response = await axios.post(process.env.REACT_APP_N8N_WEBHOOK_URL, { prompt: message });
      setChatHistory([...newHistory, { type: 'bot', text: response.data.reply }]);
    } catch (error) {
      console.error("Chatbot error:", error);
      setChatHistory([...newHistory, { type: 'bot', text: 'Sorry, I am having trouble connecting to the AI assistant right now.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    // Backdrop
    <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center">
      {/* Modal Container */}
      <div className="bg-[#151a23] border border-gray-700/50 rounded-lg shadow-2xl w-full max-w-lg h-[70vh] flex flex-col mx-4">
        {/* Header */}
        <header className="flex justify-between items-center p-4 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <FiMessageSquare className="text-blue-400 text-xl" />
            <h2 className="text-lg font-bold text-white">Ask StockWise AI</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
            <FiX className="text-gray-400 text-xl" />
          </button>
        </header>

        {/* Chat Body */}
        <div ref={chatBodyRef} className="flex-1 p-4 overflow-y-auto space-y-4">
          {chatHistory.map((chat, index) => (
            <div key={index} className={`flex items-end gap-2 ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${chat.type === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-[#2d3748] text-gray-200 rounded-bl-none'}`}>
                <p className="text-sm">{chat.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-end gap-2 justify-start">
               <div className="max-w-xs md:max-w-md p-3 rounded-lg bg-[#2d3748] text-gray-200 rounded-bl-none">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <footer className="p-4 border-t border-gray-700/50">
          <form onSubmit={handleSendMessage} className="flex items-center gap-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask about a stock, e.g., 'Tell me about TCS'"
              className="flex-grow p-3 bg-[#0c1016] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
              disabled={isLoading}
            >
              <FiSend className="text-xl" />
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
};

export default ChatModal;