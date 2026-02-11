
import React, { useState, useRef, useEffect } from 'react';
import { Attachment } from '../types';

interface ChatInputProps {
  onSendMessage: (message: string, attachment?: Attachment) => void;
  disabled: boolean;
  placeholder: string;
  footerNote: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled, placeholder, footerNote }) => {
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      setAttachment({
        data: base64Data,
        mimeType: file.type,
        url: URL.createObjectURL(file),
        name: file.name
      });
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((input.trim() || attachment) && !disabled) {
      onSendMessage(input.trim(), attachment || undefined);
      setInput('');
      setAttachment(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isImage = attachment?.mimeType.startsWith('image/');

  return (
    <div className="border-t border-gray-100 bg-white/80 backdrop-blur-md p-3 md:p-5">
      <div className="max-w-4xl mx-auto">
        {attachment && (
          <div className="mb-3 flex items-center gap-3 animate-fade-in">
            <div className="relative group">
              {isImage ? (
                <img src={attachment.url} alt="Preview" className="w-16 h-16 object-cover rounded-xl border border-indigo-100 shadow-md" />
              ) : (
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex flex-col items-center justify-center border border-indigo-100 shadow-md p-2">
                  <i className="fa-solid fa-file-pdf text-red-500 text-xl mb-1"></i>
                  <span className="text-[7px] font-bold text-gray-500 truncate w-full text-center">{attachment.name}</span>
                </div>
              )}
              <button 
                onClick={() => setAttachment(null)}
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
              >
                <i className="fa-solid fa-xmark text-[8px]"></i>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end gap-2 md:gap-3 relative">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*,application/pdf"
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="bg-gray-100 hover:bg-gray-200 text-gray-500 w-11 h-11 rounded-2xl flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-50"
          >
            <i className="fa-solid fa-paperclip text-base"></i>
          </button>

          <div className="relative flex-1 group">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 resize-none transition-all custom-scrollbar disabled:opacity-50 text-sm font-medium text-gray-800 leading-snug"
            />
          </div>
          
          <button
            type="submit"
            disabled={disabled || (!input.trim() && !attachment)}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 text-white w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-indigo-100 hover:shadow-indigo-200 active:scale-90 flex-shrink-0"
          >
            <i className={`fa-solid ${disabled ? 'fa-spinner fa-spin' : 'fa-paper-plane'} text-base`}></i>
          </button>
        </form>
        <p className="text-[9px] font-bold text-gray-400 text-center mt-3 uppercase tracking-widest opacity-60">
          {footerNote}
        </p>
      </div>
    </div>
  );
};

export default ChatInput;
