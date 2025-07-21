import React, { useState } from 'react';
import ChatModal from './ChatModal';
import { FiMessageSquare } from 'react-icons/fi';

const FloatingChatButton = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full h-16 w-16 flex items-center justify-center shadow-lg hover:bg-blue-700 transition-transform hover:scale-110 z-30"
        aria-label="Ask AI"
      >
        <FiMessageSquare className="text-3xl" />
      </button>
      <ChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
};

export default FloatingChatButton;