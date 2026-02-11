
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sendMessageStream } from './services/gemini.ts';
import { Message, Role, ChatThread, Language, AppSettings, Attachment, AppMode } from './types.ts';
import ChatMessage from './services/ChatMessage.tsx';
import ChatInput from './components/ChatInput.tsx';
import Sidebar from './components/Sidebar.tsx';

const SYSTEM_API_KEY = 'AIzaSyDrOJD6P_8TZ7CKMWpIx2cECGOeG4UheD8';
const STORAGE_THREADS = 'mon_leo_pro_final_v5';
const STORAGE_SETTINGS = 'mon_leo_pro_settings_v5';
const CAT_AVATAR_URL = "https://raw.githubusercontent.com/s-0-a-d/Image/refs/heads/main/IMG_20250306_151454.jpg";

const translations: Record<Language, any> = {
  en: { 
    title: "Mồn Lèo AI", 
    subtitle: "AI Assistant by Thanh", 
    newChat: "New Chat", 
    history: "History", 
    settings: "Settings", 
    apiKey: "Gemini API Key",
    lang: "Language", 
    modeLabel: "ODH Maker",
    reset: "Clear All Data", 
    save: "Save Changes", 
    typing: "Mồn Lèo is thinking...", 
    errorQuota: "Quota exceeded.", 
    placeholder: "Ask Mồn Lèo anything...", 
    footerNote: "AI may be inaccurate. Check important info.", 
    confirmReset: "Are you sure you want to delete all history?"
  },
  vi: { 
    title: "Mồn Lèo AI", 
    subtitle: "Trợ lý AI của Thanh", 
    newChat: "Chat mới", 
    history: "Lịch sử", 
    settings: "Cài đặt", 
    apiKey: "Mã API Gemini",
    lang: "Ngôn ngữ", 
    modeLabel: "ODH Maker",
    reset: "Xóa toàn bộ dữ liệu", 
    save: "Lưu cài đặt", 
    typing: "Mồn Lèo đang nghĩ...", 
    errorQuota: "Hết hạn mức rồi bạn ơi.", 
    placeholder: "Nhắn gì đó cho Mồn Lèo...", 
    footerNote: "AI có thể không chính xác. Hãy kiểm tra lại.", 
    confirmReset: "Bạn có chắc muốn xóa sạch toàn bộ lịch sử chat không?"
  }
};

const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_SETTINGS);
    return saved ? JSON.parse(saved) : { apiKey: SYSTEM_API_KEY, language: 'vi', currentMode: 'standard' };
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

  const ui = translations[settings.language];
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

  const toggleHeaderMode = () => {
    const newMode = settings.currentMode === 'standard' ? 'odh_plugin' : 'standard';
    setSettings(prev => ({ ...prev, currentMode: newMode }));
    if (currentThreadId) {
      setThreads(prev => prev.map(t => t.id === currentThreadId ? { ...t, mode: newMode } : t));
    }
  };

  const triggerAiResponse = async (activeId: string, text: string, attachment?: Attachment, historyOverride?: Message[]) => {
    const thread = threads.find(t => t.id === activeId);
    if (!thread) return;
    
    const modeToUse = thread.mode || settings.currentMode;
    const history = historyOverride || thread.messages.slice(0, -1);
    setIsTyping(true);
    setError(null);

    const aiMsgId = Date.now().toString() + "-ai";
    const aiMsg: Message = { id: aiMsgId, role: Role.MODEL, text: '', timestamp: new Date() };
    setThreads(prev => prev.map(t => t.id === activeId ? { ...t, messages: [...t.messages, aiMsg] } : t));

    try {
      let full = '';
      const stream = sendMessageStream(settings.apiKey, settings.language, history, text, attachment, modeToUse);
      
      for await (const chunk of stream) {
        full += chunk;
        setThreads(prev => prev.map(t => t.id === activeId ? {
          ...t,
          messages: t.messages.map(m => m.id === aiMsgId ? { ...m, text: full } : m)
        } : t));
      }
    } catch (err: any) {
      console.error("Gemini Error:", err);
      setError(err.message === "QUOTA_EXHAUSTED" ? ui.errorQuota : err.message || "Lỗi kết nối API");
      setThreads(prev => prev.map(t => t.id === activeId ? { ...t, messages: t.messages.filter(m => m.id !== aiMsgId) } : t));
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (text: string, attachment?: Attachment) => {
    let activeId = currentThreadId;
    if (!activeId) {
      activeId = Date.now().toString();
      const newThread: ChatThread = { 
        id: activeId, 
        title: text.slice(0, 30) || 'New Chat', 
        messages: [], 
        lastUpdated: new Date(),
        mode: settings.currentMode 
      };
      setThreads(prev => [newThread, ...prev]);
      setCurrentThreadId(activeId);
    }

    const userMsg: Message = { id: Date.now().toString(), role: Role.USER, text, timestamp: new Date(), attachment };
    setThreads(prev => prev.map(t => t.id === activeId ? { ...t, messages: [...t.messages, userMsg], lastUpdated: new Date() } : t));
    await triggerAiResponse(activeId, text, attachment);
  };

  const startNewChat = (mode: AppMode = 'standard') => {
    setSettings(prev => ({ ...prev, currentMode: mode }));
    setCurrentThreadId(null);
    setIsSidebarOpen(false);
  };

  const activeMode = currentThread?.mode || settings.currentMode;

  return (
    <div className="flex h-screen bg-white overflow-hidden text-[#171717]">
      <Sidebar 
        threads={threads} 
        currentThreadId={currentThreadId} 
        onSelect={setCurrentThreadId} 
        onNewChat={() => startNewChat('standard')} 
        onNewPluginChat={() => startNewChat('odh_plugin')}
        onDelete={(id, e) => { e.stopPropagation(); setThreads(threads.filter(t => t.id !== id)); if(id === currentThreadId) setCurrentThreadId(null); }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        lang={settings.language}
        ui={ui}
      />
      
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        <header className="h-14 border-b border-gray-100 flex items-center justify-between px-4 bg-white z-10 shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-gray-400"><i className="fa-solid fa-bars"></i></button>
            <div className="flex flex-col min-w-0">
                <h2 className="text-sm font-bold truncate">{currentThread?.title || ui.title}</h2>
                {activeMode === 'odh_plugin' && <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest leading-none">ODH PLUGIN MAKER</span>}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             <button 
                onClick={toggleHeaderMode} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border shadow-sm ${activeMode === 'odh_plugin' ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-100' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                title="Bật/Tắt ODH Plugin Mode"
             >
                <i className={`fa-solid ${activeMode === 'odh_plugin' ? 'fa-bolt animate-pulse' : 'fa-code'} text-[10px]`}></i>
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {activeMode === 'odh_plugin' ? ui.modeLabel : 'STD'}
                </span>
             </button>
             <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-gray-400 hover:text-black transition-colors"><i className="fa-solid fa-gear"></i></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar bg-white flex flex-col">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
              <div className="w-28 h-28 rounded-[2.5rem] overflow-hidden mb-8 shadow-2xl rotate-3 ring-8 ring-gray-50/50 hover:rotate-0 transition-all duration-500 cursor-pointer">
                <img src={CAT_AVATAR_URL} alt="Mồn Lèo" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-4xl font-black mb-2 tracking-tighter text-gray-900">{ui.title}</h3>
              <p className="text-[11px] text-gray-400 uppercase tracking-[0.4em] font-black opacity-60 mb-10">{activeMode === 'odh_plugin' ? 'ROBLOX ODH SPECIALIST' : ui.subtitle}</p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                 <button onClick={() => startNewChat('standard')} className="px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-black text-white shadow-2xl shadow-black/10 hover:scale-105 active:scale-95 transition-all">Chat Thông Thường</button>
                 <button onClick={() => startNewChat('odh_plugin')} className="px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white shadow-2xl shadow-indigo-600/10 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"><i className="fa-solid fa-bolt"></i> ODH Plugin Maker</button>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl w-full mx-auto p-4 md:p-10 pb-36">
              {messages.map((m) => (
                <ChatMessage key={m.id} message={m} onEdit={(newText) => {
                  const idx = messages.indexOf(m);
                  const newHistory = messages.slice(0, idx);
                  setThreads(prev => prev.map(t => t.id === currentThreadId ? { ...t, messages: [...newHistory, { ...m, text: newText }] } : t));
                  triggerAiResponse(currentThreadId!, newText, m.attachment, newHistory);
                }} />
              ))}
              {isTyping && (
                <div className="flex gap-4 mb-8 animate-pulse">
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 ring-4 ring-gray-50">
                    <img src={CAT_AVATAR_URL} alt="Thinking" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col gap-1.5 mt-2">
                    <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{ui.typing}</div>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-gray-200 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-gray-200 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-gray-200 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-6 rounded-[2rem] text-[11px] font-black uppercase tracking-widest text-center mb-8 shadow-sm">
                  <i className="fa-solid fa-circle-exclamation mr-2 text-red-400"></i>
                  {error}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-white via-white to-transparent pointer-events-none">
          <div className="max-w-4xl mx-auto pointer-events-auto">
             <ChatInput 
                onSendMessage={handleSendMessage} 
                disabled={isTyping} 
                placeholder={activeMode === 'odh_plugin' ? 'Bạn muốn viết plugin gì cho ODH?' : ui.placeholder} 
                footerNote={ui.footerNote} 
             />
          </div>
        </div>
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] animate-fade-in border border-gray-100">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black tracking-tighter text-gray-900">{ui.settings}</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="w-12 h-12 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-all active:scale-90"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>
            <div className="space-y-8">
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                   <i className="fa-solid fa-key text-[10px]"></i> {ui.apiKey}
                </label>
                <div className="group relative">
                  <input 
                    type="text" 
                    value={settings.apiKey} 
                    onChange={(e) => setSettings({...settings, apiKey: e.target.value})} 
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-3xl py-4 px-6 text-sm font-mono outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner block" 
                    placeholder="AIzaSy..."
                    spellCheck={false}
                    autoComplete="off"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500 transition-colors">
                    <i className="fa-solid fa-paste"></i>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                   <i className="fa-solid fa-globe text-[10px]"></i> {ui.lang}
                </label>
                <div className="relative">
                  <select 
                    value={settings.language} 
                    onChange={(e) => setSettings({...settings, language: e.target.value as Language})} 
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-3xl py-4 px-6 text-xs font-black uppercase tracking-widest outline-none appearance-none cursor-pointer focus:border-indigo-600 focus:bg-white transition-all shadow-inner"
                  >
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <i className="fa-solid fa-chevron-down text-[10px]"></i>
                  </div>
                </div>
              </div>
              <div className="pt-8 flex flex-col gap-4">
                <button 
                  onClick={() => setIsSettingsOpen(false)} 
                  className="w-full bg-black text-white font-black py-5 rounded-[2rem] text-[11px] uppercase tracking-[0.25em] shadow-2xl shadow-black/20 hover:scale-[1.03] active:scale-95 transition-all"
                >
                  {ui.save}
                </button>
                <button 
                  onClick={() => { if(window.confirm(ui.confirmReset)) { localStorage.clear(); window.location.reload(); } }} 
                  className="w-full text-red-500 font-black py-2 text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-all"
                >
                  {ui.reset}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
