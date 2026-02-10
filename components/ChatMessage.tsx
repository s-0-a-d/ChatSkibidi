
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
      <div className="absolute right-3 top-3 z-20 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all flex items-center space-x-1.5 text-[10px] font-bold backdrop-blur-md border border-white/10"
        >
          {copied ? (
            <>
              <i className="fa-solid fa-check text-emerald-400"></i>
              <span>COPIED</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-copy"></i>
              <span>COPY</span>
            </>
          )}
        </button>
      </div>
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
    <div className={`flex w-full mb-8 animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[92%] md:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start`}>
        <div className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-white text-[10px] font-black shadow-sm ${isUser ? 'ml-3 bg-indigo-600' : 'mr-3 bg-gray-900 ring-4 ring-gray-50'}`}>
          {isUser ? <i className="fa-solid fa-user"></i> : <i className="fa-solid fa-cat"></i>}
        </div>
        
        <div className={`flex flex-col group/msg min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-4 py-3 rounded-2xl shadow-sm relative ${
            isUser 
              ? 'message-bubble-user rounded-tr-none' 
              : 'message-bubble-ai rounded-tl-none border border-gray-100 bg-white'
          }`}>
            <div className={`prose`}>
              <ReactMarkdown
                components={{
                  pre: PreComponent
                }}
              >
                {message.text}
              </ReactMarkdown>
            </div>
            
            {!isUser && message.text && (
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                <button 
                  onClick={handleCopyAll}
                  className="text-gray-400 hover:text-indigo-600 transition-colors flex items-center gap-1.5 text-[10px] font-bold"
                  title="Sao chép"
                >
                  <i className="fa-solid fa-copy"></i> SAO CHÉP
                </button>
              </div>
            )}
          </div>
          <span className={`text-[9px] mt-1.5 text-gray-400 font-bold uppercase tracking-wider px-1`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
