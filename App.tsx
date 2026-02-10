
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createChatSession, sendMessageStream } from './services/gemini.ts';
import { Message, Role, ChatThread, User, Language } from './types.ts';
import ChatMessage from './components/ChatMessage.tsx';
import ChatInput from './components/ChatInput.tsx';
import Sidebar from './components/Sidebar.tsx';

const USERS_KEY = 'mon_leo_users_db';
const CURRENT_USER_KEY = 'mon_leo_current_user';
const THREADS_KEY = 'mon_leo_threads_v3';
const LANG_KEY = 'mon_leo_lang';

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>(() => JSON.parse(localStorage.getItem(USERS_KEY) || '[]'));
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(CURRENT_USER_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem(LANG_KEY) as Language) || 'en');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  const [threads, setThreads] = useState<ChatThread[]>(() => {
    const saved = localStorage.getItem(THREADS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved).map((t: any) => ({
          ...t,
          lastUpdated: new Date(t.lastUpdated),
          messages: t.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
        }));
      } catch (e) { return []; }
    }
    return [];
  });

  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userThreads = threads.filter(t => t.userId === currentUser?.username);
  const currentThread = threads.find(t => t.id === currentThreadId);
  const messages = currentThread?.messages || [];

  useEffect(() => { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem(THREADS_KEY, JSON.stringify(threads)); }, [threads]);
  useEffect(() => { localStorage.setItem(LANG_KEY, lang); }, [lang]);
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }, [currentUser]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isTyping, scrollToBottom]);

  const handleAuth = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = (formData.get('username') as string || '').trim();
    const password = (formData.get('password') as string || '').trim();

    if (authMode === 'register') {
      if (!username || !password) { setError("Vui lòng điền đầy đủ thông tin"); return; }
      if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        setError(lang === 'vi' ? "Tên đăng nhập đã tồn tại" : "Username already exists");
        return;
      }
      const newUser: User = { username, password, key: '' }; // API Key mặc định trống
      setUsers([...users, newUser]);
      setCurrentUser(newUser);
    } else {
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
      if (user) {
        setCurrentUser(user);
      } else {
        setError(lang === 'vi' ? "Sai tài khoản hoặc mật khẩu." : "Invalid username or password.");
      }
    }
    setError(null);
  };

  const handleUpdateKey = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) return;
    const formData = new FormData(e.currentTarget);
    const newKey = (formData.get('newKey') as string || '').trim();
    const confirmPass = (formData.get('confirmPassword') as string || '').trim();

    if (confirmPass !== currentUser.password) {
      setError(lang === 'vi' ? "Mật khẩu không chính xác" : "Incorrect password");
      return;
    }

    const updatedUsers = users.map(u => u.username === currentUser.username ? { ...u, key: newKey } : u);
    setUsers(updatedUsers);
    setCurrentUser({ ...currentUser, key: newKey });
    setIsSettingsOpen(false);
    setError(null);
    chatSessionRef.current = null; 
    alert(lang === 'vi' ? "Cập nhật API Key thành công!" : "API Key updated successfully!");
  };

  const initChat = useCallback((force = false) => {
    if (currentUser && currentUser.key && (!chatSessionRef.current || force)) {
      try {
        chatSessionRef.current = createChatSession(currentUser.key, lang);
        setError(null);
      } catch (e: any) {
        setError(e.message || "Initialization failed");
      }
    } else if (currentUser && !currentUser.key) {
      // Không báo lỗi ngay tại đây để tránh spam UI khi vừa login
      chatSessionRef.current = null;
    }
  }, [currentUser, lang]);

  useEffect(() => { initChat(true); }, [initChat]);

  const createNewThread = () => {
    if (!currentUser) return;
    const newId = Date.now().toString();
    const welcomeText = lang === 'vi' 
      ? `Chào **${currentUser.username}**! Mồn Lèo AI đã sẵn sàng.` 
      : `Hello **${currentUser.username}**! Mồn Lèo AI is ready. How can I help you today?`;
      
    const newThread: ChatThread = {
      id: newId,
      userId: currentUser.username,
      title: lang === 'vi' ? 'Cuộc trò chuyện mới' : 'New Chat',
      messages: [{ id: 'w-' + newId, role: Role.MODEL, text: welcomeText, timestamp: new Date() }],
      lastUpdated: new Date(),
    };
    setThreads([newThread, ...threads]);
    setCurrentThreadId(newId);
    setIsSidebarOpen(false);
    initChat(true);
  };

  const handleSendMessage = async (text: string) => {
    if (!currentUser) return;
    
    // Kiểm tra API Key trước khi gửi
    if (!currentUser.key) {
      setError(lang === 'vi' 
        ? "Vui lòng cài đặt API Key trong phần cài đặt (góc trái dưới) để bắt đầu trò chuyện." 
        : "Please set your API Key in Settings (bottom left) to start chatting.");
      setIsSettingsOpen(true);
      return;
    }

    let activeId = currentThreadId;
    
    if (!activeId) {
      const newId = Date.now().toString();
      const newThread: ChatThread = {
        id: newId,
        userId: currentUser.username,
        title: text.slice(0, 30),
        messages: [],
        lastUpdated: new Date(),
      };
      setThreads(prev => [newThread, ...prev]);
      activeId = newId;
      setCurrentThreadId(newId);
    }

    if (!chatSessionRef.current) initChat();

    const userMsg: Message = { id: Date.now().toString(), role: Role.USER, text, timestamp: new Date() };
    setThreads(prev => prev.map(t => t.id === activeId ? { ...t, messages: [...t.messages, userMsg], lastUpdated: new Date() } : t));

    setIsTyping(true);
    setError(null);

    const aiMsgId = (Date.now() + 1).toString();
    const aiMsg: Message = { id: aiMsgId, role: Role.MODEL, text: '', timestamp: new Date() };
    setThreads(prev => prev.map(t => t.id === activeId ? { ...t, messages: [...t.messages, aiMsg] } : t));

    try {
      let full = '';
      const stream = sendMessageStream(chatSessionRef.current, text);
      for await (const chunk of stream) {
        full += chunk;
        setThreads(prev => prev.map(t => t.id === activeId ? {
          ...t,
          messages: t.messages.map(m => m.id === aiMsgId ? { ...m, text: full } : m)
        } : t));
      }
    } catch (err: any) {
      console.error("Chat Error:", err);
      let errorMsg = "";
      if (err.message === "QUOTA_EXHAUSTED") {
        errorMsg = lang === 'vi' ? "Hết hạn mức API. Vui lòng đợi 1 phút." : "API quota exceeded. Please wait a minute.";
      } else if (err.message === "API_KEY_INVALID") {
        errorMsg = lang === 'vi' ? "API Key không hợp lệ hoặc đã bị vô hiệu hóa." : "Invalid or disabled API Key.";
      } else {
        errorMsg = (lang === 'vi' ? "Lỗi: " : "Error: ") + err.message;
      }
      setError(errorMsg);
      setThreads(prev => prev.map(t => t.id === activeId ? { ...t, messages: t.messages.filter(m => m.id !== aiMsgId) } : t));
    } finally {
      setIsTyping(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#fafafa] p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 animate-fade-in border border-gray-100">
          <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-100 rotate-6">
            <i className="fa-solid fa-cat text-2xl text-white"></i>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-6 text-center tracking-tight">Mồn Lèo AI</h2>
          
          <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
            <button onClick={() => { setAuthMode('login'); setError(null); }} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${authMode === 'login' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>LOGIN</button>
            <button onClick={() => { setAuthMode('register'); setError(null); }} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${authMode === 'register' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>REGISTER</button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Username</label>
              <input name="username" type="text" placeholder="Your username" required className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Password</label>
              <input name="password" type="password" placeholder="••••••••" required className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm" />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95">
              {authMode === 'login' ? 'Continue' : 'Create Account'}
            </button>
          </form>
          {error && <p className="mt-4 text-center text-xs text-red-500 font-bold bg-red-50 p-2 rounded-lg">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar 
        threads={userThreads} 
        currentThreadId={currentThreadId} 
        onSelect={setCurrentThreadId} 
        onNewChat={createNewThread} 
        onDelete={(id, e) => { e.stopPropagation(); setThreads(threads.filter(t => t.id !== id)); if(id === currentThreadId) setCurrentThreadId(null); }}
        onLogout={() => { setCurrentUser(null); chatSessionRef.current = null; }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userName={currentUser.username}
        lang={lang}
        setLang={setLang}
      />
      
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        <header className="h-16 border-b border-gray-100 flex items-center justify-between px-4 md:px-8 bg-white/80 backdrop-blur-md z-10">
          <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-xl"><i className="fa-solid fa-bars-staggered"></i></button>
          <h2 className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{currentThread?.title || "Mồn Lèo AI"}</h2>
          <div className="flex items-center gap-3">
            <select value={lang} onChange={(e) => setLang(e.target.value as Language)} className="bg-gray-50 border-none rounded-lg px-2 py-1 text-[10px] font-bold text-indigo-600 focus:ring-0 cursor-pointer">
              <option value="en">ENGLISH</option>
              <option value="vi">VIỆT NAM</option>
            </select>
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">{currentUser.username[0].toUpperCase()}</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#fafafa]">
          {!currentThreadId ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center text-2xl mb-6"><i className="fa-solid fa-cat"></i></div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{lang === 'vi' ? 'Bắt đầu trò chuyện' : 'Start a conversation'}</h3>
              <p className="text-xs text-gray-500 mb-6">{lang === 'vi' ? 'Mồn Lèo AI đã sẵn sàng giúp đỡ bạn.' : 'Mồn Lèo AI is ready to help you.'}</p>
              
              {!currentUser.key && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-700 text-[11px] font-medium">
                  <i className="fa-solid fa-circle-exclamation mr-2"></i>
                  {lang === 'vi' ? 'Bạn chưa cài đặt API Key để AI hoạt động.' : 'You haven\'t set an API Key for AI to function.'}
                </div>
              )}

              <button onClick={createNewThread} className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all">{lang === 'vi' ? 'Chat mới' : 'New Chat'}</button>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto p-4 md:p-10 pb-32">
              {messages.map((m) => <ChatMessage key={m.id} message={m} />)}
              {isTyping && <div className="flex justify-start mb-6"><div className="bg-white px-4 py-3 rounded-2xl border border-gray-100 shadow-sm flex gap-1"><div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div><div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div></div></div>}
              {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold text-center mb-6 shadow-sm border border-red-100 animate-fade-in">{error}</div>}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#fafafa] via-[#fafafa] to-transparent pt-10"><ChatInput onSendMessage={handleSendMessage} disabled={isTyping} /></div>
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-fade-in">
            <h3 className="text-xl font-black text-gray-900 mb-6">{lang === 'vi' ? 'Cài đặt API Key' : 'API Key Settings'}</h3>
            <p className="text-[11px] text-gray-500 mb-6 leading-relaxed">
              {lang === 'vi' 
                ? 'API Key là mã bí mật giúp ứng dụng kết nối với trí tuệ nhân tạo Gemini của Google.' 
                : 'API Key is a secret code that helps the app connect to Google\'s Gemini AI.'}
            </p>
            <form onSubmit={handleUpdateKey} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">API Key</label>
                <input name="newKey" type="text" defaultValue={currentUser.key} placeholder="AIzaSy..." required className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-mono text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Current Password</label>
                <input name="confirmPassword" type="password" placeholder="••••••••" required className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsSettingsOpen(false)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50">{lang === 'vi' ? 'Hủy' : 'Cancel'}</button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">
                  {lang === 'vi' ? 'Cập nhật' : 'Update'}
                </button>
              </div>
            </form>
            {error && <p className="mt-4 text-center text-[10px] text-red-500 font-bold">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
