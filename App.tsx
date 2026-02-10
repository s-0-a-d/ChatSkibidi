
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createChatSession, sendMessageStream } from './services/gemini.ts';
import { Message, Role, ChatThread, Language, AppSettings } from './types.ts';
import ChatMessage from './components/ChatMessage.tsx';
import ChatInput from './components/ChatInput.tsx';
import Sidebar from './components/Sidebar.tsx';

const SYSTEM_API_KEY = 'AIzaSyDrOJD6P_8TZ7CKMWpIx2cECGOeG4UheD8';
const STORAGE_THREADS = 'mon_leo_threads_v6';
const STORAGE_SETTINGS = 'mon_leo_settings_v6';

// Từ điển đa ngôn ngữ cho giao diện
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
    errorQuota: "API quota exceeded. Please wait a minute or disable search.",
    errorKey: "Invalid API Key. Please check your settings.",
    confirmReset: "Are you sure? This will delete all your chats forever.",
    placeholder: "Ask Mồn Lèo AI anything...",
    noChats: "No conversations yet.",
    footerNote: "Gemini AI may provide inaccurate info."
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
    errorQuota: "Hết hạn mức API. Vui lòng đợi 1 phút hoặc tắt tìm kiếm.",
    errorKey: "Mã API không hợp lệ. Vui lòng kiểm tra cài đặt.",
    confirmReset: "Bạn có chắc chắn? Toàn bộ tin nhắn sẽ bị xóa vĩnh viễn.",
    placeholder: "Hỏi Mồn Lèo AI bất cứ điều gì...",
    noChats: "Chưa có cuộc trò chuyện nào.",
    footerNote: "Gemini AI có thể đưa ra thông tin không chính xác."
  },
  fr: {
    title: "Mồn Lèo AI",
    subtitle: "Assistant IA par Thanh",
    newChat: "Nouveau Chat",
    history: "Historique",
    settings: "Paramètres",
    apiKey: "Clé API",
    lang: "Langue",
    search: "Recherche Google",
    searchOn: "Recherche Activée",
    searchOff: "Recherche Désactivée",
    reset: "Réinitialiser les données",
    cancel: "Annuler",
    save: "Sauvegarder",
    welcome: "Bonjour ! Mồn Lèo AI est prêt à vous aider.",
    typing: "Mồn Lèo AI réfléchit...",
    errorQuota: "Quota API épuisé. Veuillez patienter ou désactiver la recherche.",
    errorKey: "Clé API invalide. Veuillez vérifier vos paramètres.",
    confirmReset: "Êtes-vous sûr ? Cela supprimera tous vos messages.",
    placeholder: "Demandez n'importe quoi à Mồn Lèo AI...",
    noChats: "Aucune conversation.",
    footerNote: "Gemini AI peut fournir des infos inexactes."
  },
  ja: {
    title: "Mồn Lèo AI",
    subtitle: "Thanh による AI アシスタント",
    newChat: "新規チャット",
    history: "履歴",
    settings: "設定",
    apiKey: "API キー",
    lang: "言語",
    search: "Google 検索",
    searchOn: "検索オン",
    searchOff: "検索オフ",
    reset: "データをリセット",
    cancel: "キャンセル",
    save: "保存",
    welcome: "こんにちは！ Mồn Lèo AI がお手伝いします。",
    typing: "Mồn Lèo AI が考えています...",
    errorQuota: "API クォータを超えました。しばらく待つか検索を無効にしてください。",
    errorKey: "無効な API キーです。設定を確認してください。",
    confirmReset: "本当によろしいですか？ すべてのチャットが削除されます。",
    placeholder: "Mồn Lèo AI に何でも聞いてください...",
    noChats: "会話はありません。",
    footerNote: "Gemini AI は不正確な情報を提供する場合があります。"
  },
  ko: {
    title: "Mồn Lèo AI",
    subtitle: "Thanh의 AI 어시스턴트",
    newChat: "새 채팅",
    history: "대화 기록",
    settings: "설정",
    apiKey: "API 키",
    lang: "언어",
    search: "Google 검색",
    searchOn: "검색 켬",
    searchOff: "검색 끔",
    reset: "데이터 초기화",
    cancel: "취소",
    save: "저장",
    welcome: "안녕하세요! Mồn Lèo AI가 도와드릴 준비가 되었습니다.",
    typing: "Mồn Lèo AI가 생각 중입니다...",
    errorQuota: "API 할당량이 초과되었습니다. 잠시 기다리거나 검색을 끄십시오.",
    errorKey: "유효하지 않은 API 키입니다. 설정을 확인하세요.",
    confirmReset: "정말인가요? 모든 대화가 영구적으로 삭제됩니다.",
    placeholder: "Mồn Lèo AI에게 무엇이든 물어보세요...",
    noChats: "대화가 없습니다.",
    footerNote: "Gemini AI는 부정확한 정보를 제공할 수 있습니다."
  },
  zh: {
    title: "Mồn Lèo AI",
    subtitle: "Thanh 开发的 AI 助手",
    newChat: "新对话",
    history: "历史记录",
    settings: "设置",
    apiKey: "API 密钥",
    lang: "语言",
    search: "谷歌搜索",
    searchOn: "搜索开启",
    searchOff: "搜索关闭",
    reset: "重置所有数据",
    cancel: "取消",
    save: "保存",
    welcome: "你好！Mồn Lèo AI 已准备好为您提供帮助。",
    typing: "Mồn Lèo AI 正在思考...",
    errorQuota: "API 配额已用尽。请稍候或禁用搜索。",
    errorKey: "API 密钥无效。请检查您的设置。",
    confirmReset: "您确定吗？这将永久删除所有对话。",
    placeholder: "问 Mồn Lèo AI 任何问题...",
    noChats: "暂无对话。",
    footerNote: "Gemini AI 可能会提供不准确的信息。"
  }
};

const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_SETTINGS);
    return saved ? JSON.parse(saved) : { apiKey: SYSTEM_API_KEY, language: 'en', useSearch: false };
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
  
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const ui = translations[settings.language] || translations.en;
  const currentThread = threads.find(t => t.id === currentThreadId);
  const messages = currentThread?.messages || [];

  useEffect(() => { localStorage.setItem(STORAGE_THREADS, JSON.stringify(threads)); }, [threads]);
  useEffect(() => { localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings)); }, [settings]);

  const initChat = useCallback((force = false) => {
    if (!chatSessionRef.current || force) {
      try {
        chatSessionRef.current = createChatSession(settings.apiKey, settings.language, settings.useSearch);
        setError(null);
      } catch (e: any) {
        setError(e.message);
      }
    }
  }, [settings]);

  useEffect(() => { initChat(true); }, [initChat]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  useEffect(() => { scrollToBottom(); }, [messages, isTyping, scrollToBottom]);

  const createNewThread = () => {
    const newId = Date.now().toString();
    const newThread: ChatThread = {
      id: newId,
      title: ui.newChat,
      messages: [{ id: 'w-' + newId, role: Role.MODEL, text: ui.welcome, timestamp: new Date() }],
      lastUpdated: new Date(),
    };
    setThreads([newThread, ...threads]);
    setCurrentThreadId(newId);
    setIsSidebarOpen(false);
    initChat(true);
  };

  const handleSendMessage = async (text: string) => {
    let activeId = currentThreadId;
    if (!activeId) {
      const newId = Date.now().toString();
      const newThread: ChatThread = { id: newId, title: text.slice(0, 30), messages: [], lastUpdated: new Date() };
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
      let msg = ui.errorKey;
      if (err.message === "QUOTA_EXHAUSTED") msg = ui.errorQuota;
      setError(msg);
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
        onNewChat={createNewThread} 
        onDelete={(id, e) => { e.stopPropagation(); setThreads(threads.filter(t => t.id !== id)); if(id === currentThreadId) setCurrentThreadId(null); }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        lang={settings.language}
        ui={ui}
      />
      
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        <header className="h-16 border-b border-gray-100 flex items-center justify-between px-4 md:px-8 bg-white/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-xl"><i className="fa-solid fa-bars-staggered"></i></button>
            <h2 className="text-sm font-bold text-gray-900 truncate max-w-[150px]">{currentThread?.title || ui.title}</h2>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => setSettings({...settings, useSearch: !settings.useSearch})}>
                <i className={`fa-solid fa-globe text-[10px] ${settings.useSearch ? 'text-blue-500' : 'text-gray-400'}`}></i>
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">{settings.useSearch ? ui.searchOn : ui.searchOff}</span>
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
              <div className="w-20 h-20 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center text-3xl mb-8 shadow-2xl shadow-indigo-100 rotate-3"><i className="fa-solid fa-cat"></i></div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">{ui.title}</h3>
              <p className="text-sm text-gray-500 mb-8">{ui.subtitle}</p>
              <button onClick={createNewThread} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl text-xs font-black tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 uppercase">{ui.newChat}</button>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto p-4 md:p-10 pb-32">
              {messages.map((m) => <ChatMessage key={m.id} message={m} />)}
              {isTyping && <div className="flex justify-start mb-6"><div className="bg-white px-4 py-3 rounded-2xl border border-gray-100 shadow-sm flex gap-2 items-center text-[10px] font-bold text-indigo-400 animate-pulse"><i className="fa-solid fa-cat animate-bounce"></i> {ui.typing}</div></div>}
              {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold text-center mb-6 shadow-sm border border-red-100 animate-fade-in">{error}</div>}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#fafafa] via-[#fafafa] to-transparent pt-10">
          <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} placeholder={ui.placeholder} footerNote={ui.footerNote} />
        </div>
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl animate-fade-in">
            <h3 className="text-2xl font-black text-gray-900 mb-6">{ui.settings}</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{ui.apiKey}</label>
                <input 
                  type="text" 
                  value={settings.apiKey} 
                  onChange={(e) => setSettings({...settings, apiKey: e.target.value})}
                  placeholder="AIzaSy..." 
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-5 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-mono text-xs transition-all" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{ui.lang}</label>
                <select 
                  value={settings.language} 
                  onChange={(e) => setSettings({...settings, language: e.target.value as Language})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-5 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-xs font-bold transition-all appearance-none"
                >
                  <option value="en">ENGLISH</option>
                  <option value="vi">TIẾNG VIỆT</option>
                  <option value="fr">FRANÇAIS</option>
                  <option value="ja">日本語</option>
                  <option value="ko">한국어</option>
                  <option value="zh">中文</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-[11px] font-black text-gray-600 uppercase tracking-tight">{ui.search}</span>
                <div 
                  className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${settings.useSearch ? 'bg-blue-500' : 'bg-gray-300'}`}
                  onClick={() => setSettings({...settings, useSearch: !settings.useSearch})}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings.useSearch ? 'translate-x-4' : 'translate-x-0'}`}></div>
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
