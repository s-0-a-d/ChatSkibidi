
import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, Role } from '../types';

interface ChatMessageProps {
  message: Message;
}

const PreComponent = ({ children, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const handleCopy = () => {
    if (preRef.current) {
      const codeElement = preRef.current.querySelector('code');
      const textToCopy = codeElement ? codeElement.innerText : preRef.current.innerText;
      
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 z-20 p-1.5 rounded-md bg-gray-700/50 hover:bg-gray-600 text-white/70 hover:text-white transition-all opacity-0 group-hover:opacity-100 flex items-center space-x-1 text-xs backdrop-blur-sm border border-white/10"
        title="Sao chép"
      >
        {copied ? (
          <>
            <i className="fa-solid fa-check text-emerald-400"></i>
            <span>Đã chép</span>
          </>
        ) : (
          <>
            <i className="fa-solid fa-copy"></i>
            <span>Sao chép</span>
          </>
        )}
      </button>
      <pre ref={preRef} {...props}>
        {children}
      </pre>
    </div>
  );
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  const handleCopyAll = () => {
    navigator.clipboard.writeText(message.text);
  };

  return (
    <div className={`flex w-full mb-6 animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm ${isUser ? 'ml-3 bg-indigo-600' : 'mr-3 bg-emerald-500'}`}>
          {isUser ? <i className="fa-solid fa-user"></i> : <i className="fa-solid fa-robot"></i>}
        </div>
        
        <div className="flex flex-col group/msg">
          <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed relative ${
            isUser 
              ? 'message-bubble-user text-white rounded-tr-none' 
              : 'message-bubble-ai text-gray-800 rounded-tl-none'
          }`}>
            <div className={`prose ${isUser ? 'prose-invert' : ''}`}>
              <ReactMarkdown
                components={{
                  pre: PreComponent
                }}
              >
                {message.text}
              </ReactMarkdown>
            </div>
            
            {!isUser && (
              <button 
                onClick={handleCopyAll}
                className="absolute -right-10 top-0 p-2 text-gray-300 hover:text-indigo-500 transition-colors opacity-0 group-hover/msg:opacity-100 hidden md:block"
                title="Sao chép toàn bộ tin nhắn"
              >
                <i className="fa-solid fa-copy text-sm"></i>
              </button>
            )}
          </div>
          <span className={`text-[10px] mt-1 text-gray-400 font-medium ${isUser ? 'text-right' : 'text-left'}`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
