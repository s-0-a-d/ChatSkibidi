
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sendMessageStream } from './services/gemini.ts';
import { Message, Role, ChatThread, Language, AppSettings, Attachment, AppMode } from './types.ts';
import ChatMessage from './components/ChatMessage.tsx';
import ChatInput from './components/ChatInput.tsx';
import Sidebar from './components/Sidebar.tsx';

const SYSTEM_API_KEY = 'AIzaSyDrOJD6P_8TZ7CKMWpIx2cECGOeG4UheD8';
const STORAGE_THREADS = 'mon_leo_threads_v7';
const STORAGE_SETTINGS = 'mon_leo_settings_v7';

const translations: Record<Language, any> = {
  en: {
    title: "Mồn Lèo AI",
    subtitle: "AI Assistant by Thanh",
    newChat: "New Chat",
    history: "Chat History",
    settings: "Settings",
    apiKey: "API Key",
    lang: "Language",
    search: "Google Search",
    searchOn: "Search On",
    searchOff: "Search Off",
    reset: "Reset All Data",
    cancel: "Cancel",
    save: "Save Changes",
    welcome: "Hello! Mồn Lèo AI is ready to help you.",
    typing: "Mồn Lèo AI is thinking...",
    errorQuota: "API quota exceeded. Please wait 1 minute.",
    errorKey: "Invalid API Key.",
    confirmReset: "Are you sure? This will delete all your chats forever.",
    placeholder: "Ask Mồn Lèo AI anything...",
    noChats: "No conversations yet.",
    footerNote: "Gemini AI may provide inaccurate info.",
    searchWarning: "Notice: Search quota is very limited.",
    modeLabel: "Chat Mode",
    modeStandard: "Standard Chat",
    modeODH: "ODH Plugin Maker"
  },
  vi: {
    title: "Mồn Lèo AI",
    subtitle: "Trợ lý AI của Thanh",
    newChat: "Chat mới",
    history: "Lịch sử trò chuyện",
    settings: "Cài đặt",
    apiKey: "Mã API",
    lang: "Ngôn ngữ",
    search: "Tìm kiếm Google",
    searchOn: "Tìm kiếm Bật",
    searchOff: "Tìm kiếm Tắt",
    reset: "Xóa toàn bộ dữ liệu",
    cancel: "Hủy",
    save: "Lưu thay đổi",
    welcome: "Chào bạn! Mồn Lèo AI đã sẵn sàng hỗ trợ.",
    typing: "Mồn Lèo AI đang suy nghĩ...",
    errorQuota: "Hết hạn mức API. Vui lòng đợi 1 phút.",
    errorKey: "Mã API không hợp lệ.",
    confirmReset: "Bạn có chắc chắn? Toàn bộ tin nhắn sẽ bị xóa vĩnh viễn.",
    placeholder: "Hỏi Mồn Lèo AI bất cứ điều gì...",
    noChats: "Chưa có cuộc trò chuyện nào.",
    footerNote: "Gemini AI có thể đưa ra thông tin không chính xác.",
    searchWarning: "Lưu ý: Hạn mức tìm kiếm rất thấp.",
    modeLabel: "Chế độ Chat",
    modeStandard: "Trò chuyện Thường",
    modeODH: "ODH Plugin Maker"
  },
  fr: { title: "Mồn Lèo AI", subtitle: "Assistant IA par Thanh", newChat: "Nouveau Chat", history: "Historique", settings: "Paramètres", apiKey: "Clé API", lang: "Langue", search: "Recherche Google", searchOn: "Recherche Activée", searchOff: "Recherche Désactivée", reset: "Réinitialiser", cancel: "Annuler", save: "Sauvegarder", welcome: "Bonjour ! Mồn Lèo AI est prêt.", typing: "Mồn Lèo AI réfléchit...", errorQuota: "Quota API épuisé.", errorKey: "Clé API invalide.", confirmReset: "Êtes-vous sûr ?", placeholder: "Demandez à Mồn Lèo AI...", noChats: "Aucune conversation.", footerNote: "Gemini AI peut être inexacte.", searchWarning: "Quota limité.", modeLabel: "Mode Chat", modeStandard: "Standard", modeODH: "ODH Plugin Maker" },
  ja: { title: "Mồn Lèo AI", subtitle: "Thanh による AI アシスタント", newChat: "新規チャット", history: "履歴", settings: "設定", apiKey: "API キー", lang: "言語", search: "Google 検索", searchOn: "検索オン", searchOff: "検索オフ", reset: "リセット", cancel: "キャンセル", save: "保存", welcome: "こんにちは！ Mồn Lèo AI です。", typing: "Mồn Lèo AI が考えています...", errorQuota: "クォータを超えました。", errorKey: "無効な API キー。", confirmReset: "本当によろしいですか？", placeholder: "Mồn Lèo AI に聞いてください...", noChats: "会話なし。", footerNote: "Gemini AI は不正確な場合があります。", searchWarning: "制限あり。", modeLabel: "チャットモード", modeStandard: "通常", modeODH: "ODH Plugin Maker" },
  ko: { title: "Mồn Lèo AI", subtitle: "Thanh의 AI 어시스턴트", newChat: "새 채팅", history: "기록", settings: "설정", apiKey: "API 키", lang: "언어", search: "Google 검색", searchOn: "검색 켬", searchOff: "검색 끔", reset: "초기화", cancel: "취소", save: "저장", welcome: "안녕하세요! Mồn Lèo AI입니다.", typing: "Mồn Lèo AI가 생각 중...", errorQuota: "할당량 초과.", errorKey: "잘못된 API 키.", confirmReset: "확실합니까?", placeholder: "Mồn Lèo AI에게 물어보세요...", noChats: "기록 없음.", footerNote: "부정확할 수 있습니다.", searchWarning: "제한적입니다.", modeLabel: "채팅 모드", modeStandard: "표준", modeODH: "ODH Plugin Maker" },
  zh: { title: "Mồn Lèo AI", subtitle: "Thanh 的 AI 助手", newChat: "新对话", history: "历史", settings: "设置", apiKey: "API 密钥", lang: "语言", search: "谷歌搜索", searchOn: "搜索开启", searchOff: "搜索关闭", reset: "重置", cancel: "取消", save: "保存", welcome: "你好！Mồn Lèo AI 已就绪。", typing: "Mồn Lèo AI 正在思考...", errorQuota: "配额已用完。", errorKey: "密钥无效。", confirmReset: "确定吗？", placeholder: "向 Mồn Lèo AI 提问...", noChats: "暂无历史。", footerNote: "可能不准确。", searchWarning: "配额有限。", modeLabel: "聊天模式", modeStandard: "普通对话", modeODH: "ODH Plugin Maker" }
};

const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_SETTINGS);
    return saved ? JSON.parse(saved) : { apiKey: SYSTEM_API_KEY, language: 'en', useSearch: false, currentMode: 'standard' };
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

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  useEffect(() => { scrollToBottom(); }, [messages, isTyping, scrollToBottom]);

  const createNewThread = (mode: AppMode = settings.currentMode) => {
    const newId = Date.now().toString();
    const newThread: ChatThread = {
      id: newId,
      title: mode === 'odh_plugin' ? "ODH Plugin Maker" : ui.newChat,
      messages: [{ id: 'w-' + newId, role: Role.MODEL, text: mode === 'odh_plugin' ? "ODH Plugin Maker ready. How can I help you build your Roblox script?" : ui.welcome, timestamp: new Date() }],
      lastUpdated: new Date(),
      mode: mode
    };
    setThreads([newThread, ...threads]);
    setCurrentThreadId(newId);
    setIsSidebarOpen(false);
  };

  const toggleMode = () => {
    const nextMode = settings.currentMode === 'standard' ? 'odh_plugin' : 'standard';
    setSettings({...settings, currentMode: nextMode});
    // Create new chat automatically when switching mode if no thread is active or to match mode
    createNewThread(nextMode);
  };

  const handleSendMessage = async (text: string, attachment?: Attachment) => {
    let activeId = currentThreadId;
    const modeToUse = currentThread?.mode || settings.currentMode;

    if (!activeId) {
      const newId = Date.now().toString();
      const newThread: ChatThread = { 
        id: newId, 
        title: text.slice(0, 30) || 'New Chat', 
        messages: [], 
        lastUpdated: new Date(),
        mode: modeToUse
      };
      setThreads(prev => [newThread, ...prev]);
      activeId = newId;
      setCurrentThreadId(newId);
    }

    const userMsg: Message = { id: Date.now().toString(), role: Role.USER, text, timestamp: new Date(), attachment };
    const currentHistory = threads.find(t => t.id === activeId)?.messages || [];

    setThreads(prev => prev.map(t => t.id === activeId ? { ...t, messages: [...t.messages, userMsg], lastUpdated: new Date() } : t));
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
        currentHistory, 
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
        <header className="h-16 border-b border-gray-100 flex items-center justify-between px-4 md:px-8 bg-white/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-xl flex-shrink-0"><i className="fa-solid fa-bars-staggered"></i></button>
            <div className="flex flex-col min-w-0">
               <h2 className="text-sm font-bold text-gray-900 truncate">{currentThread?.title || ui.title}</h2>
               {currentThread?.mode === 'odh_plugin' && <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest">ODH Plugin Maker Mode</span>}
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
             <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all ${settings.currentMode === 'odh_plugin' ? 'bg-orange-50 border border-orange-100' : 'bg-gray-100'}`} onClick={toggleMode}>
                <i className={`fa-solid fa-robot text-[10px] ${settings.currentMode === 'odh_plugin' ? 'text-orange-500' : 'text-gray-400'}`}></i>
                <span className={`hidden sm:inline text-[9px] font-black uppercase tracking-tighter ${settings.currentMode === 'odh_plugin' ? 'text-orange-600' : 'text-gray-500'}`}>{settings.currentMode === 'odh_plugin' ? 'ODH MODE' : 'NORMAL'}</span>
             </div>

             <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => setSettings({...settings, useSearch: !settings.useSearch})}>
                <i className={`fa-solid fa-globe text-[10px] ${settings.useSearch ? 'text-blue-500' : 'text-gray-400'}`}></i>
                <div className={`w-6 h-3.5 rounded-full p-0.5 transition-colors ${settings.useSearch ? 'bg-blue-500' : 'bg-gray-300'}`}>
                  <div className={`w-2.5 h-2.5 bg-white rounded-full transition-transform ${settings.useSearch ? 'translate-x-2.5' : 'translate-x-0'}`}></div>
                </div>
             </div>
             <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"><i className="fa-solid fa-gear"></i></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#fafafa]">
          {!currentThreadId ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto">
              <div className={`w-20 h-20 text-white rounded-[2rem] flex items-center justify-center text-3xl mb-8 shadow-2xl transition-all ${settings.currentMode === 'odh_plugin' ? 'bg-orange-500 rotate-12 shadow-orange-100' : 'bg-indigo-600 rotate-3 shadow-indigo-100'}`}>
                <i className={`fa-solid ${settings.currentMode === 'odh_plugin' ? 'fa-screwdriver-wrench' : 'fa-cat'}`}></i>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">{settings.currentMode === 'odh_plugin' ? 'ODH Plugin Maker' : ui.title}</h3>
              <p className="text-sm text-gray-500 mb-8">{settings.currentMode === 'odh_plugin' ? 'Expert Roblox script generation for ODH shared plugins framework.' : ui.subtitle}</p>
              
              <button onClick={() => createNewThread()} className={`text-white px-8 py-4 rounded-2xl text-xs font-black tracking-widest transition-all shadow-xl uppercase ${settings.currentMode === 'odh_plugin' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-100' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'}`}>{ui.newChat}</button>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto p-4 md:p-10 pb-24">
              {messages.map((m) => <ChatMessage key={m.id} message={m} />)}
              {isTyping && <div className="flex justify-start mb-6"><div className="bg-white px-4 py-3 rounded-2xl border border-gray-100 shadow-sm flex gap-2 items-center text-[10px] font-bold text-indigo-400 animate-pulse"><i className={`fa-solid ${currentThread?.mode === 'odh_plugin' ? 'fa-cog fa-spin' : 'fa-cat animate-bounce'}`}></i> {ui.typing}</div></div>}
              {error && (
                <div className="bg-red-50 text-red-600 p-6 rounded-2xl text-xs font-bold text-center mb-6 shadow-sm border border-red-100 animate-fade-in flex flex-col gap-3">
                  <i className="fa-solid fa-triangle-exclamation text-xl"></i>
                  {error}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#fafafa] via-[#fafafa] to-transparent pt-10">
          <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} placeholder={currentThread?.mode === 'odh_plugin' ? "Describe the Roblox plugin features you want..." : ui.placeholder} footerNote={ui.footerNote} />
        </div>
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl animate-fade-in">
            <h3 className="text-2xl font-black text-gray-900 mb-6">{ui.settings}</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{ui.apiKey}</label>
                <input type="text" value={settings.apiKey} onChange={(e) => setSettings({...settings, apiKey: e.target.value})} placeholder="AIzaSy..." className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-5 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-mono text-xs transition-all" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{ui.lang}</label>
                <select value={settings.language} onChange={(e) => setSettings({...settings, language: e.target.value as Language})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-5 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-xs font-bold transition-all appearance-none cursor-pointer">
                  <option value="en">ENGLISH</option>
                  <option value="vi">TIẾNG VIỆT</option>
                  <option value="fr">FRANÇAIS</option>
                  <option value="ja">日本語</option>
                  <option value="ko">한국어</option>
                  <option value="zh">中文</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{ui.modeLabel}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setSettings({...settings, currentMode: 'standard'})} className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${settings.currentMode === 'standard' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>Standard</button>
                  <button onClick={() => setSettings({...settings, currentMode: 'odh_plugin'})} className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${settings.currentMode === 'odh_plugin' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}>ODH Plugin</button>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button onClick={() => setIsSettingsOpen(false)} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700 text-xs tracking-widest uppercase">{ui.save}</button>
                <button onClick={handleReset} className="w-full bg-red-50 text-red-600 font-black py-4 rounded-2xl border border-red-100 hover:bg-red-100 transition-all text-[10px] tracking-widest uppercase"><i className="fa-solid fa-trash-can mr-2"></i>{ui.reset}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
