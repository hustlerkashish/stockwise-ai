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

  const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/stock-analysis';

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message;
    const newHistory = [...chatHistory, { type: 'user', text: userMessage }];
    setChatHistory(newHistory);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(N8N_WEBHOOK_URL, {
        message: userMessage, // FIXED: was "text"
        sessionId: 'some-unique-session-id',
      });

      console.log("Received from n8n:", response.data);

      const responseData = response.data?.[0];
      let botMessage;

      if (responseData && responseData.output) {
        const fullText = responseData.output;

        // Extract URL if present
        const urlRegex = /(https?:\/\/[^\s]+)/;
        const urlMatch = fullText.match(urlRegex);
        const imageUrl = urlMatch ? urlMatch[0] : null;
        const analysisText = fullText.replace(urlRegex, '').trim();

        botMessage = {
          type: 'bot',
          text: analysisText,
          chartUrl: imageUrl,
        };
      } else {
        botMessage = {
          type: 'bot',
          text: "Sorry, I received an unexpected response. Please try again."
        };
      }

      setChatHistory((prevHistory) => [...prevHistory, botMessage]);

    } catch (error) {
      console.error('Error sending message to n8n:', error);
      const errorMessage = {
        type: 'bot',
        text: 'Sorry, I am having trouble connecting to my brain right now.',
      };
      setChatHistory((prevHistory) => [...prevHistory, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center">
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
                {chat.chartUrl && (
                  <img src={chat.chartUrl} alt="Stock Chart" className="mt-2 rounded-lg max-w-full" />
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-end gap-2 justify-start">
              <div className="max-w-xs md:max-w-md p-3 rounded-lg bg-[#2d3748] text-gray-200 rounded-bl-none">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
