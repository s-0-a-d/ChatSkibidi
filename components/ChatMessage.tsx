
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, Role } from '../types';

interface ChatMessageProps {
  message: Message;
  onEdit?: (newText: string) => void;
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
    <div className={`flex w-full mb-6 animate-fade-in group/msg-row ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[95%] md:max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start min-w-0`}>
        <div className={`flex-shrink-0 h-7 w-7 md:h-8 md:w-8 rounded-lg flex items-center justify-center text-white text-[9px] font-black shadow-sm ${isUser ? 'ml-2 md:ml-3 bg-indigo-600' : 'mr-2 md:mr-3 bg-gray-900 ring-2 ring-gray-50'}`}>
          {isUser ? <i className="fa-solid fa-user"></i> : <i className="fa-solid fa-cat"></i>}
        </div>
        
        <div className={`flex flex-col min-w-0 ${isUser ? 'items-end' : 'items-start'} overflow-visible`}>
          <div className={`relative px-3 md:px-4 py-2.5 md:py-3 rounded-2xl shadow-sm overflow-visible ${
            isUser 
              ? 'message-bubble-user rounded-tr-none border border-gray-100' 
              : 'message-bubble-ai rounded-tl-none border border-gray-100 bg-white'
          }`}>
            
            {message.attachment && !isEditing && (
              <div className="mb-2 md:mb-3">
                {isImage ? (
                  <img src={message.attachment.url} alt="Attached" className="max-w-full rounded-xl border border-gray-200" />
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-white/50 border border-gray-200 rounded-xl">
                    <i className="fa-solid fa-file-pdf text-red-500 text-lg"></i>
                    <span className="text-[9px] font-bold text-gray-700 truncate">{message.attachment.name}</span>
                  </div>
                )}
              </div>
            )}

            <div className={`prose max-w-full overflow-hidden`}>
              {isEditing ? (
                <div className="flex flex-col gap-2 min-w-[200px]">
                  <textarea
                    ref={editRef}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full bg-white border border-indigo-200 rounded-xl p-2 outline-none text-sm font-medium resize-none overflow-hidden shadow-inner focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <div className="flex justify-end gap-4 items-center mt-1">
                    <button 
                      onClick={() => { setIsEditing(false); setEditText(message.text); }} 
                      className="text-[10px] font-black uppercase text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Hủy
                    </button>
                    <button 
                      onClick={handleSave} 
                      className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
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
              <div className={`absolute bottom-0 ${isUser ? 'right-full mr-2' : 'left-full ml-2'} opacity-0 group-hover/msg-row:opacity-100 transition-opacity flex items-center gap-2`}>
                {!isUser ? (
                  <button onClick={handleCopyAll} title="Copy" className="w-7 h-7 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-indigo-600 shadow-sm transition-all hover:scale-110">
                    <i className="fa-solid fa-copy text-[10px]"></i>
                  </button>
                ) : (
                  <button onClick={() => setIsEditing(true)} title="Edit" className="w-7 h-7 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-indigo-600 shadow-sm transition-all hover:scale-110">
                    <i className="fa-solid fa-pen text-[10px]"></i>
                  </button>
                )}
              </div>
            )}
          </div>
          <span className={`text-[8px] mt-1 text-gray-400 font-bold uppercase tracking-wider px-1`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
