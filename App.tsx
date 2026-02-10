
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createChatSession, sendMessageStream } from './services/gemini.ts';
import { Message, Role, ChatThread } from './types.ts';
import ChatMessage from './components/ChatMessage.tsx';
import ChatInput from './components/ChatInput.tsx';
import Sidebar from './components/Sidebar.tsx';

const THREADS_STORAGE_KEY = 'mon_leo_threads_v2';
const KEY_STORAGE_KEY = 'gemini_api_key_manual';
const USER_NAME_KEY = 'mon_leo_user_name';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem(KEY_STORAGE_KEY) || '');
  const [userName, setUserName] = useState<string>(() => localStorage.getItem(USER_NAME_KEY) || '');
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [threads, setThreads] = useState<ChatThread[]>(() => {
    const saved = localStorage.getItem(THREADS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved).map((t: any) => ({
          ...t,
          lastUpdated: new Date(t.lastUpdated),
          messages: t.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
        }));
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentThread = threads.find(t => t.id === currentThreadId);
  const messages = currentThread?.messages || [];

  // Init API client
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

  // Sync threads to local storage
  useEffect(() => {
    localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(threads));
  }, [threads]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newKey = formData.get('apiKey') as string;
    const name = formData.get('userName') as string;
    
    if (newKey.trim() && name.trim()) {
      localStorage.setItem(KEY_STORAGE_KEY, newKey.trim());
      localStorage.setItem(USER_NAME_KEY, name.trim());
      setApiKey(newKey.trim());
      setUserName(name.trim());
      setError(null);
    }
  };

  const createNewThread = () => {
    const newId = Date.now().toString();
    const newThread: ChatThread = {
      id: newId,
      title: 'Cuộc trò chuyện mới',
      messages: [
        {
          id: 'welcome-' + newId,
          role: Role.MODEL,
          text: `Chào **${userName}**! Mồn Lèo đã sẵn sàng. Hôm nay bạn muốn "quậy" gì nào?`,
          timestamp: new Date(),
        }
      ],
      lastUpdated: new Date(),
    };
    setThreads(prev => [newThread, ...prev]);
    setCurrentThreadId(newId);
    setIsSidebarOpen(false);
    chatSessionRef.current = createChatSession();
  };

  const selectThread = (id: string) => {
    setCurrentThreadId(id);
    setIsSidebarOpen(false);
    chatSessionRef.current = createChatSession();
  };

  const deleteThread = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setThreads(prev => prev.filter(t => t.id !== id));
    if (currentThreadId === id) setCurrentThreadId(null);
  };

  const handleSendMessage = async (text: string) => {
    let activeThreadId = currentThreadId;
    
    // Nếu chưa có thread, tạo mới
    if (!activeThreadId) {
      const newId = Date.now().toString();
      const newThread: ChatThread = {
        id: newId,
        title: text.slice(0, 30) + (text.length > 30 ? '...' : ''),
        messages: [],
        lastUpdated: new Date(),
      };
      setThreads(prev => [newThread, ...prev]);
      activeThreadId = newId;
      setCurrentThreadId(newId);
    }

    if (!chatSessionRef.current) {
        chatSessionRef.current = createChatSession();
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text,
      timestamp: new Date(),
    };

    setThreads(prev => prev.map(t => 
      t.id === activeThreadId 
        ? { ...t, messages: [...t.messages, userMessage], lastUpdated: new Date(), title: t.messages.length === 1 ? text.slice(0, 30) : t.title }
        : t
    ));

    setIsTyping(true);
    setError(null);

    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMessageId,
      role: Role.MODEL,
      text: '',
      timestamp: new Date(),
    };

    setThreads(prev => prev.map(t => 
      t.id === activeThreadId ? { ...t, messages: [...t.messages, aiMessage] } : t
    ));

    try {
      let fullResponse = '';
      const stream = sendMessageStream(chatSessionRef.current, text);
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        setThreads(prev => prev.map(t => 
          t.id === activeThreadId 
            ? { ...t, messages: t.messages.map(m => m.id === aiMessageId ? { ...m, text: fullResponse } : m) }
            : t
        ));
      }
    } catch (err: any) {
      setError(err.message === "API_KEY_INVALID" ? "API Key không hợp lệ." : "Lỗi kết nối.");
    } finally {
      setIsTyping(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(KEY_STORAGE_KEY);
    localStorage.removeItem(USER_NAME_KEY);
    setApiKey('');
    setUserName('');
    setHasKey(false);
  };

  if (!hasKey || !userName) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 animate-fade-in border border-gray-100">
          <div className="bg-indigo-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-200 rotate-6 transition-transform hover:rotate-0">
            <i className="fa-solid fa-cat text-3xl text-white"></i>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2 text-center tracking-tight">Mồn Lèo AI</h2>
          <p className="text-gray-500 mb-8 text-center text-sm font-medium">Đăng nhập để bắt đầu cuộc trò chuyện</p>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Tên của bạn</label>
              <input 
                name="userName"
                type="text" 
                placeholder="Ví dụ: Thanh đẹp trai"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Gemini API Key</label>
              <input 
                name="apiKey"
                type="text" 
                inputMode="text"
                placeholder="Dán mã AIzaSy..."
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-xs"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-2xl shadow-xl shadow-indigo-100 transition-all transform active:scale-95 flex items-center justify-center gap-2"
            >
              Vào tán gẫu <i className="fa-solid fa-arrow-right text-sm"></i>
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-gray-50 text-center">
            <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-xs text-indigo-500 hover:underline font-semibold">Lấy Key miễn phí tại đây</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      {/* Sidebar - Desktop */}
      <Sidebar 
        threads={threads} 
        currentThreadId={currentThreadId} 
        onSelect={selectThread} 
        onNewChat={createNewThread} 
        onDelete={deleteThread}
        onLogout={logout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userName={userName}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        <header className="h-16 border-b border-gray-100 flex items-center justify-between px-4 md:px-8 shrink-0 bg-white/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <i className="fa-solid fa-bars-staggered text-lg"></i>
            </button>
            <div className="flex flex-col">
              <h2 className="text-sm font-bold text-gray-900 line-clamp-1">
                {currentThread?.title || "Mồn Lèo AI"}
              </h2>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Trực tuyến</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={createNewThread} className="hidden md:flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all">
              <i className="fa-solid fa-plus"></i> Chat mới
            </button>
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shadow-sm ring-2 ring-indigo-50 shrink-0">
              {userName.slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#fafafa]">
          {!currentThreadId && messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto">
              <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600 text-3xl mb-6 animate-bounce">
                <i className="fa-solid fa-cat"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Sẵn sàng chưa, {userName}?</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Nhập tin nhắn bên dưới để bắt đầu một cuộc hội thoại mới với Mồn Lèo. Tôi có thể giúp bạn viết code, giải bài tập, hoặc đơn giản là "tám" chuyện phiếm.
              </p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto p-4 md:p-10 pb-32">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isTyping && (
                <div className="flex justify-start mb-6">
                   <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-none flex items-center space-x-1.5 shadow-sm ring-1 ring-black/5">
                     <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                     <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                     <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                   </div>
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-center text-xs font-medium mb-6 animate-fade-in flex items-center justify-center gap-2">
                  <i className="fa-solid fa-triangle-exclamation"></i> {error}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#fafafa] via-[#fafafa] to-transparent pt-10">
           <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
        </div>
      </div>
    </div>
  );
};

export default App;
