
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
    <div className={`flex w-full mb-6 animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[95%] md:max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start min-w-0`}>
        <div className={`flex-shrink-0 h-7 w-7 md:h-8 md:w-8 rounded-lg flex items-center justify-center text-white text-[9px] font-black shadow-sm ${isUser ? 'ml-2 md:ml-3 bg-indigo-600' : 'mr-2 md:mr-3 bg-gray-900 ring-2 ring-gray-50'}`}>
          {isUser ? <i className="fa-solid fa-user"></i> : <i className="fa-solid fa-cat"></i>}
        </div>
        
        <div className={`flex flex-col group/msg min-w-0 ${isUser ? 'items-end' : 'items-start'} overflow-hidden`}>
          <div className={`px-3 md:px-4 py-2.5 md:py-3 rounded-2xl shadow-sm relative w-full overflow-hidden ${
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
                <div className="flex flex-col gap-2">
                  <textarea
                    ref={editRef}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full bg-white/50 border border-indigo-200 rounded-xl p-2 outline-none text-sm font-medium resize-none overflow-hidden"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setIsEditing(false); setEditText(message.text); }} className="px-2 py-1 text-[9px] font-black uppercase text-gray-500 hover:text-red-500 transition-colors">CANCEL</button>
                    <button onClick={handleSave} className="px-2 py-1 text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-800 transition-colors">SAVE</button>
                  </div>
                </div>
              ) : (
                <ReactMarkdown components={{ pre: PreComponent }}>
                  {message.text}
                </ReactMarkdown>
              )}
            </div>
            
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 opacity-0 group-hover/msg:opacity-100 transition-opacity">
              {!isUser ? (
                <button onClick={handleCopyAll} className="text-gray-400 hover:text-indigo-600 transition-colors flex items-center gap-1.5 text-[9px] font-bold uppercase">
                  <i className="fa-solid fa-copy"></i> COPY
                </button>
              ) : !isEditing && (
                <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-indigo-600 transition-colors flex items-center gap-1.5 text-[9px] font-bold uppercase">
                  <i className="fa-solid fa-pen"></i> EDIT
                </button>
              )}
            </div>
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
