
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sendMessageStream } from './services/gemini.ts';
import { Message, Role, ChatThread, Language, AppSettings, Attachment, AppMode } from './types.ts';
import ChatMessage from './services/ChatMessage.tsx';
import ChatInput from './components/ChatInput.tsx';
import Sidebar from './components/Sidebar.tsx';

const SYSTEM_API_KEY = 'AIzaSyDrOJD6P_8TZ7CKMWpIx2cECGOeG4UheD8';
const STORAGE_THREADS = 'mon_leo_threads_v7';
const STORAGE_SETTINGS = 'mon_leo_settings_v7';
// Cập nhật đường dẫn đã mã hóa URL để tránh lỗi đồng bộ GitHub
const CAT_AVATAR_URL = "https://raw.githubusercontent.com/s-0-a-d/ChatSkibidi/refs/heads/main/%E1%BA%A2nh/IMG_20250306_151454.jpg";

const translations: Partial<Record<Language, any>> = {
  en: { 
    title: "Mồn Lèo AI", 
    subtitle: "AI Assistant by Thanh", 
    newChat: "New Chat", 
    history: "Chat History", 
    settings: "Settings", 
    apiKey: "API Key", 
    lang: "Language", 
    search: "Google Search", 
    reset: "Reset Data", 
    cancel: "Cancel", 
    save: "Save", 
    welcome: "Hello! Mồn Lèo AI is ready.", 
    typing: "Thinking...", 
    errorQuota: "Quota exceeded.", 
    placeholder: "Ask anything...", 
    footerNote: "AI may be inaccurate.", 
    confirmReset: "Are you sure you want to clear all data?"
  },
  vi: { 
    title: "Mồn Lèo AI", 
    subtitle: "Trợ lý AI của Thanh", 
    newChat: "Chat mới", 
    history: "Lịch sử", 
    settings: "Cài đặt", 
    apiKey: "API Key", 
    lang: "Ngôn ngữ", 
    search: "Tìm kiếm", 
    reset: "Xóa dữ liệu", 
    cancel: "Hủy", 
    save: "Lưu & Gửi", 
    welcome: "Chào bạn! Mồn Lèo AI đã sẵn sàng.", 
    typing: "Đang nghĩ...", 
    errorQuota: "Hết hạn mức.", 
    placeholder: "Hỏi Mồn Lèo AI...", 
    footerNote: "AI có thể không chính xác.", 
    confirmReset: "Bạn có chắc chắn muốn xóa toàn bộ dữ liệu?"
  }
};

const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_SETTINGS);
    return saved ? JSON.parse(saved) : { apiKey: SYSTEM_API_KEY, language: 'vi', useSearch: false, currentMode: 'standard' };
  });

  const [threads, setThreads] = useState<ChatThread[]>(() => {
    const saved = localStorage.getItem(STORAGE_THREADS);
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const ui = translations[settings.language] || translations.en;
  const currentThread = threads.find(t => t.id === currentThreadId);
  const messages = currentThread?.messages || [];

  useEffect(() => { localStorage.setItem(STORAGE_THREADS, JSON.stringify(threads)); }, [threads]);
  useEffect(() => { localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings)); }, [settings]);

  const scrollToBottom = useCallback((instant = false) => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'end' });
    }
  }, []);

  useEffect(() => { 
    const timer = setTimeout(() => scrollToBottom(), 100);
    return () => clearTimeout(timer);
  }, [messages.length, isTyping, scrollToBottom]);

  const triggerAiResponse = async (activeId: string, text: string, attachment?: Attachment, historyOverride?: Message[]) => {
    const thread = threads.find(t => t.id === activeId);
    if (!thread) return;
    
    const modeToUse = thread.mode || settings.currentMode;
    const history = historyOverride || thread.messages.slice(0, -1);

    setIsTyping(true);
    setError(null);

    const aiMsgId = (Date.now() + 1).toString();
    const aiMsg: Message = { id: aiMsgId, role: Role.MODEL, text: '', timestamp: new Date() };
    setThreads(prev => prev.map(t => t.id === activeId ? { ...t, messages: [...t.messages, aiMsg] } : t));

    try {
      let full = '';
      const stream = sendMessageStream(
        settings.apiKey, 
        settings.language, 
        history, 
        text, 
        attachment, 
        settings.useSearch,
        modeToUse
      );
      
      for await (const chunk of stream) {
        full += chunk;
        setThreads(prev => prev.map(t => t.id === activeId ? {
          ...t,
          messages: t.messages.map(m => m.id === aiMsgId ? { ...m, text: full } : m)
        } : t));
      }
    } catch (err: any) {
      setError(err.message === "QUOTA_EXHAUSTED" ? ui.errorQuota : err.message);
      setThreads(prev => prev.map(t => t.id === activeId ? { ...t, messages: t.messages.filter(m => m.id !== aiMsgId) } : t));
    } finally {
      setIsTyping(false);
    }
  };

  const handleEditMessage = async (msgId: string, newText: string) => {
    if (!currentThreadId) return;
    const thread = threads.find(t => t.id === currentThreadId);
    const msgIndex = thread?.messages.findIndex(m => m.id === msgId) ?? -1;
    if (msgIndex === -1 || !thread) return;

    const editedMsg = { ...thread.messages[msgIndex], text: newText };
    const updatedHistory = [...thread.messages.slice(0, msgIndex), editedMsg];
    
    setThreads(prev => prev.map(t => t.id === currentThreadId ? { ...t, messages: updatedHistory, lastUpdated: new Date() } : t));
    await triggerAiResponse(currentThreadId, newText, editedMsg.attachment, updatedHistory.slice(0, -1));
  };

  const createNewThread = (mode: AppMode = settings.currentMode) => {
    const newId = Date.now().toString();
    const newThread: ChatThread = {
      id: newId,
      title: mode === 'odh_plugin' ? "ODH Plugin Chat" : ui.newChat,
      messages: [],
      lastUpdated: new Date(),
      mode: mode
    };
    setThreads([newThread, ...threads]);
    setCurrentThreadId(newId);
    setIsSidebarOpen(false);
  };

  const handleSendMessage = async (text: string, attachment?: Attachment) => {
    let activeId = currentThreadId;
    if (!activeId) {
      const newId = Date.now().toString();
      const newThread: ChatThread = { 
        id: newId, title: text.slice(0, 30) || 'New Chat', messages: [], lastUpdated: new Date(), mode: settings.currentMode 
      };
      setThreads(prev => [newThread, ...prev]);
      activeId = newId;
      setCurrentThreadId(newId);
    }

    const userMsg: Message = { id: Date.now().toString(), role: Role.USER, text, timestamp: new Date(), attachment };
    setThreads(prev => prev.map(t => t.id === activeId ? { ...t, messages: [...t.messages, userMsg], lastUpdated: new Date() } : t));
    await triggerAiResponse(activeId, text, attachment);
  };

  const handleReset = () => {
    if (window.confirm(ui.confirmReset)) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar 
        threads={threads} 
        currentThreadId={currentThreadId} 
        onSelect={setCurrentThreadId} 
        onNewChat={() => createNewThread()} 
        onDelete={(id, e) => { e.stopPropagation(); setThreads(threads.filter(t => t.id !== id)); if(id === currentThreadId) setCurrentThreadId(null); }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        lang={settings.language}
        ui={ui}
      />
      
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        <header className="h-16 border-b border-gray-100 flex items-center justify-between px-4 md:px-8 bg-white/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-xl flex-shrink-0"><i className="fa-solid fa-bars-staggered"></i></button>
            <div className="flex flex-col min-w-0">
               <h2 className="text-sm font-bold text-gray-900 truncate">{currentThread?.title || ui.title}</h2>
               {currentThread?.mode === 'odh_plugin' && <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest">ODH Plugin Maker Mode</span>}
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
             <button onClick={() => setSettings({...settings, useSearch: !settings.useSearch})} className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${settings.useSearch ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-gray-100 text-gray-500'}`}>
                <i className={`fa-solid fa-globe text-[10px]`}></i>
                <span className="hidden sm:inline text-[9px] font-bold uppercase tracking-widest">{ui.search}</span>
             </button>
             <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"><i className="fa-solid fa-gear"></i></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#fafafa] flex flex-col">
          {!currentThreadId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto">
              <div className="w-24 h-24 rounded-[2.5rem] overflow-hidden mb-8 shadow-2xl rotate-3 ring-4 ring-white transition-transform hover:rotate-12 hover:scale-105 duration-300">
                <img src={CAT_AVATAR_URL} alt="Mồn Lèo" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">{ui.title}</h3>
              <p className="text-sm text-gray-500">{ui.subtitle}</p>
              <button onClick={() => createNewThread()} className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">
                {ui.newChat}
              </button>
            </div>
          ) : (
            <div className="max-w-4xl w-full mx-auto p-4 md:p-10 pb-40 flex-1 flex flex-col">
              {messages.map((m) => (
                <ChatMessage 
                  key={m.id} 
                  message={m} 
                  onEdit={(newText) => handleEditMessage(m.id, newText)}
                />
              ))}
              {isTyping && (
                <div className="flex justify-start mb-6 animate-fade-in">
                  <div className="bg-white px-4 py-3 rounded-2xl border border-gray-100 shadow-sm flex gap-3 items-center text-[10px] font-bold text-indigo-400 animate-pulse">
                    <div className="w-5 h-5 rounded-full overflow-hidden shrink-0">
                      <img src={CAT_AVATAR_URL} alt="Thinking" className="w-full h-full object-cover" />
                    </div>
                    {ui.typing}
                  </div>
                </div>
              )}
              {error && (
                <div className="bg-red-50 text-red-600 p-6 rounded-2xl text-xs font-bold text-center mb-6 shadow-sm border border-red-100 animate-fade-in flex flex-col gap-3">
                  <i className="fa-solid fa-triangle-exclamation text-xl"></i>
                  {error}
                </div>
              )}
              <div ref={messagesEndRef} className="h-20 w-full shrink-0" />
            </div>
          )}
        </main>
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#fafafa] via-[#fafafa] to-transparent pt-10 pointer-events-none">
          <div className="pointer-events-auto">
            <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} placeholder={currentThread?.mode === 'odh_plugin' ? "Mô tả tính năng cho Plugin..." : ui.placeholder} footerNote={ui.footerNote} />
          </div>
        </div>
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-gray-900">{ui.settings}</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{ui.apiKey}</label>
                <input type="password" value={settings.apiKey} onChange={(e) => setSettings({...settings, apiKey: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-5 focus:ring-4 focus:ring-indigo-500/10 outline-none font-mono text-xs transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{ui.lang}</label>
                <select value={settings.language} onChange={(e) => setSettings({...settings, language: e.target.value as Language})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-5 outline-none text-xs font-bold appearance-none cursor-pointer">
                  <option value="vi">TIẾNG VIỆT</option>
                  <option value="en">ENGLISH</option>
                </select>
              </div>
              <div className="pt-4 flex flex-col gap-3">
                <button onClick={() => setIsSettingsOpen(false)} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all text-xs uppercase tracking-widest">{ui.save}</button>
                <button onClick={handleReset} className="w-full bg-red-50 text-red-600 font-black py-4 rounded-2xl border border-red-100 text-[10px] uppercase tracking-widest"><i className="fa-solid fa-trash-can mr-2"></i>{ui.reset}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
