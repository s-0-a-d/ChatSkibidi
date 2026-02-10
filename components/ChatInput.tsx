
import React, { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
  placeholder: string;
  footerNote: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled, placeholder, footerNote }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-gray-100 bg-white p-4 md:p-8">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-end gap-3 md:gap-4 relative">
        <div className="relative flex-1 group">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full bg-gray-50 border border-gray-200 rounded-3xl py-4 px-6 pr-14 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 resize-none transition-all custom-scrollbar disabled:opacity-50 text-sm font-medium text-gray-800"
          />
        </div>
        
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 text-white w-14 h-14 rounded-3xl flex items-center justify-center transition-all shadow-xl shadow-indigo-100 hover:shadow-indigo-200 active:scale-90 flex-shrink-0"
        >
          <i className={`fa-solid ${disabled ? 'fa-spinner fa-spin' : 'fa-paper-plane'} text-xl`}></i>
        </button>
      </form>
      <p className="text-[10px] font-bold text-gray-400 text-center mt-4 uppercase tracking-widest opacity-60">
        {footerNote}
      </p>
    </div>
  );
};

export default ChatInput;
