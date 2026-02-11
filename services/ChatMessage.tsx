
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, Role } from '../types';

interface ChatMessageProps {
  message: Message;
  onEdit?: (newText: string) => void;
}

const CAT_AVATAR_URL = "https://raw.githubusercontent.com/s-0-a-d/Image/refs/heads/main/IMG_20250306_151454.jpg";

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
    <div className="relative group w-full overflow-hidden">
      <div className="absolute right-2 top-2 z-20 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all flex items-center space-x-1.5 text-[9px] font-bold backdrop-blur-md border border-white/10"
        >
          {copied ? (
            <><i className="fa-solid fa-check text-emerald-400"></i><span>COPIED</span></>
          ) : (
            <><i className="fa-solid fa-copy"></i><span>COPY</span></>
          )}
        </button>
      </div>
      <pre ref={preRef} {...props} className="w-full">
        {children}
      </pre>
    </div>
  );
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onEdit }) => {
  const isUser = message.role === Role.USER;
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const editRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus();
      editRef.current.style.height = 'auto';
      editRef.current.style.height = `${editRef.current.scrollHeight}px`;
    }
  }, [isEditing]);

  const handleSave = () => {
    if (onEdit && editText.trim() !== message.text) {
      onEdit(editText.trim());
    }
    setIsEditing(false);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(message.text);
  };

  const isImage = message.attachment?.mimeType.startsWith('image/');

  return (
    <div className={`flex w-full mb-8 animate-fade-in group/msg-row ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[95%] md:max-w-[90%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start min-w-0`}>
        <div className={`flex-shrink-0 h-10 w-10 md:h-12 md:w-12 rounded-2xl overflow-hidden shadow-sm ${isUser ? 'ml-3 md:ml-4 bg-indigo-600 flex items-center justify-center text-white text-base shadow-indigo-100' : 'mr-3 md:mr-4 ring-4 ring-gray-50'}`}>
          {isUser ? (
            <i className="fa-solid fa-user"></i>
          ) : (
            <img src={CAT_AVATAR_URL} alt="Mồn Lèo" className="w-full h-full object-cover" />
          )}
        </div>
        
        <div className={`flex flex-col min-w-0 ${isUser ? 'items-end' : 'items-start'} overflow-visible`}>
          <div className={`relative px-4 md:px-6 py-3 md:py-4 rounded-[2rem] shadow-sm overflow-visible ${
            isUser 
              ? 'message-bubble-user rounded-tr-none border border-gray-100' 
              : 'message-bubble-ai rounded-tl-none border border-gray-100 bg-white'
          }`}>
            
            {message.attachment && !isEditing && (
              <div className="mb-4">
                {isImage ? (
                  <img src={message.attachment.url} alt="Attached" className="max-w-full rounded-2xl border border-gray-100 shadow-sm" />
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-2xl">
                    <i className="fa-solid fa-file-pdf text-red-500 text-2xl"></i>
                    <span className="text-[10px] font-black text-gray-700 truncate uppercase tracking-widest">{message.attachment.name}</span>
                  </div>
                )}
              </div>
            )}

            <div className={`prose max-w-full overflow-hidden`}>
              {isEditing ? (
                <div className="flex flex-col gap-3 min-w-[250px]">
                  <textarea
                    ref={editRef}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full bg-white border-2 border-indigo-100 rounded-2xl p-3 outline-none text-sm font-medium resize-none overflow-hidden shadow-inner focus:border-indigo-500 transition-all"
                  />
                  <div className="flex justify-end gap-4 items-center">
                    <button 
                      onClick={() => { setIsEditing(false); setEditText(message.text); }} 
                      className="text-[10px] font-black uppercase text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Hủy
                    </button>
                    <button 
                      onClick={handleSave} 
                      className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                    >
                      Lưu & Gửi
                    </button>
                  </div>
                </div>
              ) : (
                <ReactMarkdown components={{ pre: PreComponent }}>
                  {message.text}
                </ReactMarkdown>
              )}
            </div>

            {!isEditing && (
              <div className={`absolute bottom-2 ${isUser ? 'right-full mr-3' : 'left-full ml-3'} opacity-0 group-hover/msg-row:opacity-100 transition-all flex items-center gap-2`}>
                {!isUser ? (
                  <button onClick={handleCopyAll} title="Copy" className="w-8 h-8 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-indigo-600 shadow-md transition-all hover:scale-110 active:scale-90">
                    <i className="fa-solid fa-copy text-[10px]"></i>
                  </button>
                ) : (
                  <button onClick={() => setIsEditing(true)} title="Sửa tin nhắn" className="w-8 h-8 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-indigo-600 shadow-md transition-all hover:scale-110 active:scale-90">
                    <i className="fa-solid fa-pen text-[10px]"></i>
                  </button>
                )}
              </div>
            )}
          </div>
          <span className={`text-[9px] mt-2 text-gray-400 font-black uppercase tracking-[0.2em] px-2 opacity-50`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
