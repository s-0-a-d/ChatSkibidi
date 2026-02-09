
import React, { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
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
    <div className="border-t border-gray-100 bg-white p-4 md:p-6">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-end gap-2 md:gap-4 relative">
        <div className="relative flex-1 group">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn..."
            disabled={disabled}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all custom-scrollbar disabled:opacity-50 text-gray-700"
          />
          <div className="absolute right-3 bottom-3 flex items-center space-x-2">
            <span className={`text-xs ${input.length > 1000 ? 'text-red-500' : 'text-gray-400'} transition-opacity ${input.length > 0 ? 'opacity-100' : 'opacity-0'}`}>
              {input.length}
            </span>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 active:scale-95 flex-shrink-0"
        >
          <i className={`fa-solid ${disabled ? 'fa-spinner fa-spin' : 'fa-paper-plane'} text-lg`}></i>
        </button>
      </form>
      <p className="text-[10px] text-gray-400 text-center mt-3">
        Gemini AI có thể đưa ra thông tin không chính xác. Hãy kiểm tra các phản hồi quan trọng.
      </p>
    </div>
  );
};

export default ChatInput;
