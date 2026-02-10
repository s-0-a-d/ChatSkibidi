
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createChatSession, sendMessageStream } from './services/gemini.ts';
import { Message, Role } from './types.ts';
import ChatMessage from './components/ChatMessage.tsx';
import ChatInput from './components/ChatInput.tsx';

const STORAGE_KEY = 'mon_leo_chat_history';
const KEY_STORAGE_KEY = 'gemini_api_key_manual';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem(KEY_STORAGE_KEY) || process.env.API_KEY || '';
  });
  
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
    return [
      {
        id: 'welcome',
        role: Role.MODEL,
        text: 'Xin chào! Tôi là **Mồn Lèo**. Hãy nhập API Key của bạn để chúng ta bắt đầu "tám" chuyện nhé!',
        timestamp: new Date(),
      }
    ];
  });

  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (apiKey) {
      process.env.API_KEY = apiKey;
      setHasKey(true);
      try {
        chatSessionRef.current = createChatSession();
      } catch (e) {
        console.error("Failed to init chat", e);
      }
    } else {
      setHasKey(false);
    }
  }, [apiKey]);

  const handleSaveKey = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newKey = formData.get('apiKey') as string;
    if (newKey.trim()) {
      localStorage.setItem(KEY_STORAGE_KEY, newKey.trim());
      setApiKey(newKey.trim());
      setError(null);
    }
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async (text: string) => {
    if (!chatSessionRef.current) {
        try {
            chatSessionRef.current = createChatSession();
        } catch (e) {
            setError("Lỗi khởi tạo. Vui lòng kiểm tra lại API Key.");
            return;
        }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setError(null);

    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMessageId,
      role: Role.MODEL,
      text: '',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, aiMessage]);

    try {
      let fullResponse = '';
      const stream = sendMessageStream(chatSessionRef.current, text);
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => 
          prev.map(msg => 
            msg.id === aiMessageId ? { ...msg, text: fullResponse } : msg
          )
        );
      }
    } catch (err: any) {
      console.error(err);
      if (err.message === "API_KEY_INVALID") {
        setError("API Key không hợp lệ. Vui lòng kiểm tra lại.");
      } else {
        setError('Lỗi kết nối. Vui lòng thử lại sau.');
      }
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      role: Role.MODEL,
      text: 'Đã xóa hết lịch sử! Tôi là **Mồn Lèo**, có chuyện gì hot không nào?',
      timestamp: new Date(),
    }]);
    localStorage.removeItem(STORAGE_KEY);
    if (hasKey) chatSessionRef.current = createChatSession();
  };

  const logoutKey = () => {
    localStorage.removeItem(KEY_STORAGE_KEY);
    setApiKey('');
    setHasKey(false);
    chatSessionRef.current = null;
  };

  if (!hasKey) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 animate-fade-in border border-gray-100">
          <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
            <i className="fa-solid fa-cat text-2xl text-white"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Cấu hình Mồn Lèo</h2>
          <p className="text-gray-500 mb-8 text-center text-sm">
            Dán API Key của bạn để bắt đầu. Ô nhập này hỗ trợ sao chép và dán dễ dàng trên điện thoại.
          </p>
          
          <form onSubmit={handleSaveKey} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Gemini API Key</label>
              <input 
                name="apiKey"
                type="text" 
                placeholder="Dán key AIzaSy... tại đây"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-sm"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-indigo-100 transition-all transform active:scale-95"
            >
              Lưu và Bắt đầu
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              className="text-xs text-indigo-500 hover:text-indigo-600 font-medium flex items-center justify-center gap-1"
            >
              Lấy API Key miễn phí <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gray-50 overflow-hidden">
      <header className="bg-white border-b border-gray-100 py-3 px-6 shadow-sm z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-md shadow-indigo-100">
              <i className="fa-solid fa-cat text-white text-lg"></i>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Mồn Lèo AI</h1>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Đang thức</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={clearChat} 
              className="p-2 w-10 h-10 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
              title="Xóa lịch sử"
            >
              <i className="fa-solid fa-trash-can"></i>
            </button>
            <button 
              onClick={logoutKey} 
              className="p-2 w-10 h-10 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all"
              title="Đổi API Key"
            >
              <i className="fa-solid fa-gear"></i>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/50">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isTyping && (
            <div className="flex justify-start mb-6">
               <div className="bg-white border border-gray-200 px-4 py-2 rounded-2xl rounded-tl-none flex items-center space-x-1 shadow-sm">
                 <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce"></div>
                 <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                 <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
               </div>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-2 rounded-xl text-center text-sm mb-4 animate-fade-in">
              <i className="fa-solid fa-circle-exclamation mr-2"></i> {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
    </div>
  );
};

export default App;
