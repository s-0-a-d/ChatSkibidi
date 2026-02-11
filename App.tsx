
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
  en: { title: "Mồn Lèo AI", subtitle: "AI Assistant by Thanh", newChat: "New Chat", history: "Chat History", settings: "Settings", apiKey: "API Key", lang: "Language", search: "Google Search", reset: "Reset Data", cancel: "Cancel", save: "Save", welcome: "Hello! Mồn Lèo AI is ready.", typing: "Thinking...", errorQuota: "Quota exceeded.", placeholder: "Ask anything...", footerNote: "AI may be inaccurate.", modeLabel: "Mode" },
  vi: { title: "Mồn Lèo AI", subtitle: "Trợ lý AI của Thanh", newChat: "Chat mới", history: "Lịch sử", settings: "Cài đặt", apiKey: "API Key", lang: "Ngôn ngữ", search: "Tìm kiếm", reset: "Xóa dữ liệu", cancel: "Hủy", save: "Lưu", welcome: "Chào bạn! Mồn Lèo AI đã sẵn sàng.", typing: "Đang nghĩ...", errorQuota: "Hết hạn mức.", placeholder: "Hỏi Mồn Lèo AI...", footerNote: "AI có thể không chính xác.", modeLabel: "Chế độ" },
  fr: { title: "Mồn Lèo AI", subtitle: "Assistant par Thanh", newChat: "Nouveau Chat", history: "Historique", settings: "Paramètres", apiKey: "Clé API", lang: "Langue", search: "Recherche", reset: "Réinitialiser", cancel: "Annuler", save: "Enregistrer", welcome: "Bonjour !", typing: "Réflexion...", errorQuota: "Quota épuisé.", placeholder: "Posez une question...", footerNote: "L'IA peut être inexacte.", modeLabel: "Mode" },
  ja: { title: "Mồn Lèo AI", subtitle: "ThanhのAI", newChat: "新規チャット", history: "履歴", settings: "設定", apiKey: "APIキー", lang: "言語", search: "検索", reset: "リセット", cancel: "キャンセル", save: "保存", welcome: "こんにちは！", typing: "考え中...", errorQuota: "クォータ制限。", placeholder: "何か聞いてください...", footerNote: "不正確な場合があります。", modeLabel: "モード" },
  ko: { title: "Mồn Lèo AI", subtitle: "Thanh의 AI", newChat: "새 채팅", history: "기록", settings: "설정", apiKey: "API 키", lang: "언어", search: "검색", reset: "초기화", cancel: "취소", save: "저장", welcome: "안녕하세요!", typing: "생각 중...", errorQuota: "할당량 초과.", placeholder: "무엇이든 물어보세요...", footerNote: "부정확할 수 있습니다.", modeLabel: "모드" },
  zh: { title: "Mồn Lèo AI", subtitle: "Thanh 的 AI", newChat: "新对话", history: "历史", settings: "设置", apiKey: "API 密钥", lang: "语言", search: "搜索", reset: "重置", cancel: "取消", save: "保存", welcome: "你好！", typing: "思考中...", errorQuota: "配额已满。", placeholder: "向我提问...", footerNote: "可能不准确。", modeLabel: "模式" },
  es: { title: "Mồn Lèo AI", subtitle: "Asistente de Thanh", newChat: "Nuevo Chat", history: "Historial", settings: "Ajustes", apiKey: "Clave API", lang: "Idioma", search: "Buscar", reset: "Reiniciar", cancel: "Cancelar", save: "Guardar", welcome: "¡Hola!", typing: "Pensando...", errorQuota: "Cuota excedida.", placeholder: "Pregunta algo...", footerNote: "La IA puede errar.", modeLabel: "Modo" },
  de: { title: "Mồn Lèo AI", subtitle: "Assistent von Thanh", newChat: "Neuer Chat", history: "Verlauf", settings: "Setup", apiKey: "API-Key", lang: "Sprache", search: "Suche", reset: "Löschen", cancel: "Abbrechen", save: "Speichern", welcome: "Hallo!", typing: "Überlegt...", errorQuota: "Limit erreicht.", placeholder: "Frage etwas...", footerNote: "KI kann irren.", modeLabel: "Modus" },
  it: { title: "Mồn Lèo AI", subtitle: "Assistente di Thanh", newChat: "Nuova Chat", history: "Cronologia", settings: "Impostazioni", apiKey: "Chiave API", lang: "Lingua", search: "Cerca", reset: "Reset", cancel: "Annulla", save: "Salva", welcome: "Ciao!", typing: "Pensando...", errorQuota: "Quota superata.", placeholder: "Chiedi qualcosa...", footerNote: "L'IA può sbagliare.", modeLabel: "Modalità" },
  pt: { title: "Mồn Lèo AI", subtitle: "Assistente do Thanh", newChat: "Novo Chat", history: "Histórico", settings: "Ajustes", apiKey: "Chave API", lang: "Idioma", search: "Pesquisa", reset: "Resetar", cancel: "Cancelar", save: "Salvar", welcome: "Olá!", typing: "Pensando...", errorQuota: "Cota excedida.", placeholder: "Pergunte algo...", footerNote: "IA pode falhar.", modeLabel: "Modo" },
  ru: { title: "Mồn Lèo AI", subtitle: "Ассистент Thanh", newChat: "Новый чат", history: "История", settings: "Настройки", apiKey: "Ключ API", lang: "Язык", search: "Поиск", reset: "Сброс", cancel: "Отмена", save: "Ок", welcome: "Привет!", typing: "Думаю...", errorQuota: "Лимит исчерпан.", placeholder: "Спросите о чем угодно...", footerNote: "ИИ может ошибаться.", modeLabel: "Режим" },
  ar: { title: "Mồn Lèo AI", subtitle: "مساعد Thanh", newChat: "دردشة جديدة", history: "السجل", settings: "الإعدادات", apiKey: "مفتاح API", lang: "اللغة", search: "بحث", reset: "إعادة تعيين", cancel: "إلغاء", save: "حفظ", welcome: "أهلاً بك!", typing: "يفكر...", errorQuota: "تجاوز الحصة.", placeholder: "اسأل أي شيء...", footerNote: "قد يكون الذكاء الاصطناعي غير دقيق.", modeLabel: "الوضع" },
  th: { title: "Mồn Lèo AI", subtitle: "ผู้ช่วยของ Thanh", newChat: "แชทใหม่", history: "ประวัติ", settings: "ตั้งค่า", apiKey: "รหัส API", lang: "ภาษา", search: "ค้นหา", reset: "รีเซ็ต", cancel: "ยกเลิก", save: "บันทึก", welcome: "สวัสดี!", typing: "กำลังคิด...", errorQuota: "โควตาเต็ม", placeholder: "ถามอะไรก็ได้...", footerNote: "AI อาจให้ข้อมูลผิด", modeLabel: "โหมด" },
  id: { title: "Mồn Lèo AI", subtitle: "Asisten Thanh", newChat: "Chat Baru", history: "Riwayat", settings: "Setelan", apiKey: "Kunci API", lang: "Bahasa", search: "Cari", reset: "Reset", cancel: "Batal", save: "Simpan", welcome: "Halo!", typing: "Berpikir...", errorQuota: "Kuota habis.", placeholder: "Tanya apa saja...", footerNote: "AI mungkin tidak akurat.", modeLabel: "Mode" },
  hi: { title: "Mồn Lèo AI", subtitle: "Thanh के सहायक", newChat: "नया चैट", history: "इतिहास", settings: "सेटिंग्स", apiKey: "API कुंजी", lang: "भाषा", search: "खोज", reset: "रीसेट", cancel: "रद्द करें", save: "सहेजें", welcome: "नमस्ते!", typing: "सोच रहा है...", errorQuota: "कोटा समाप्त।", placeholder: "कुछ भी पूछें...", footerNote: "AI गलत हो सकता है।", modeLabel: "मोड" },
  tr: { title: "Mồn Lèo AI", subtitle: "Thanh Asistanı", newChat: "Yeni Sohbet", history: "Geçmiş", settings: "Ayarlar", apiKey: "API Anahtarı", lang: "Dil", search: "Arama", reset: "Sıfırla", cancel: "İptal", save: "Kaydet", welcome: "Merhaba!", typing: "Düşünüyor...", errorQuota: "Kota aşıldı.", placeholder: "Bir şey sor...", footerNote: "Yapay zeka hatalı olabilir.", modeLabel: "Mod" },
  nl: { title: "Mồn Lèo AI", subtitle: "Assistent van Thanh", newChat: "Nieuwe Chat", history: "Geschiedenis", settings: "Instellingen", apiKey: "API-sleutel", lang: "Taal", search: "Zoeken", reset: "Reset", cancel: "Annuleer", save: "Opslaan", welcome: "Hallo!", typing: "Denkt na...", errorQuota: "Quotun op.", placeholder: "Vraag iets...", footerNote: "AI kan onnauwkeurig zijn.", modeLabel: "Modus" }
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

  const scrollToBottom = useCallback((instant = false) => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'end' });
    }
  }, []);

  useEffect(() => { 
    const timer = setTimeout(() => scrollToBottom(), 100);
    return () => clearTimeout(timer);
  }, [messages.length, isTyping, scrollToBottom]);

  useEffect(() => {
    scrollToBottom(true);
  }, [currentThreadId, scrollToBottom]);

  const handleEditMessage = (msgId: string, newText: string) => {
    setThreads(prev => prev.map(t => t.id === currentThreadId ? {
      ...t,
      messages: t.messages.map(m => m.id === msgId ? { ...m, text: newText } : m)
    } : t));
  };

  const createNewThread = (mode: AppMode = settings.currentMode) => {
    const newId = Date.now().toString();
    const newThread: ChatThread = {
      id: newId,
      title: mode === 'odh_plugin' ? "Plugin " + new Date().toLocaleTimeString() : ui.newChat,
      messages: [],
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
    if (window.confirm(ui.confirmReset || "Clear data?")) {
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
             <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all ${settings.currentMode === 'odh_plugin' ? 'bg-orange-50 border border-orange-100' : 'bg-gray-100'}`} onClick={toggleMode}>
                <i className={`fa-solid fa-robot text-[10px] ${settings.currentMode === 'odh_plugin' ? 'text-orange-500' : 'text-gray-400'}`}></i>
                <span className={`hidden sm:inline text-[9px] font-black uppercase tracking-tighter ${settings.currentMode === 'odh_plugin' ? 'text-orange-600' : 'text-gray-500'}`}>{settings.currentMode === 'odh_plugin' ? 'ODH' : 'NORMAL'}</span>
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

        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#fafafa] flex flex-col">
          {!currentThreadId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto">
              <div className={`w-20 h-20 text-white rounded-[2rem] flex items-center justify-center text-3xl mb-8 shadow-2xl transition-all ${settings.currentMode === 'odh_plugin' ? 'bg-orange-500 rotate-12 shadow-orange-100' : 'bg-indigo-600 rotate-3 shadow-indigo-100'}`}>
                <i className={`fa-solid ${settings.currentMode === 'odh_plugin' ? 'fa-screwdriver-wrench' : 'fa-cat'}`}></i>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">{settings.currentMode === 'odh_plugin' ? 'ODH Plugin Maker' : ui.title}</h3>
              <p className="text-sm text-gray-500">{settings.currentMode === 'odh_plugin' ? 'Roblox script generation expert.' : ui.subtitle}</p>
            </div>
          ) : (
            <div className="max-w-4xl w-full mx-auto p-4 md:p-10 pb-32 flex-1">
              {messages.map((m) => (
                <ChatMessage 
                  key={m.id} 
                  message={m} 
                  onEdit={(newText) => handleEditMessage(m.id, newText)}
                />
              ))}
              {isTyping && <div className="flex justify-start mb-6"><div className="bg-white px-4 py-3 rounded-2xl border border-gray-100 shadow-sm flex gap-2 items-center text-[10px] font-bold text-indigo-400 animate-pulse"><i className={`fa-solid ${currentThread?.mode === 'odh_plugin' ? 'fa-cog fa-spin' : 'fa-cat animate-bounce'}`}></i> {ui.typing}</div></div>}
              {error && (
                <div className="bg-red-50 text-red-600 p-6 rounded-2xl text-xs font-bold text-center mb-6 shadow-sm border border-red-100 animate-fade-in flex flex-col gap-3">
                  <i className="fa-solid fa-triangle-exclamation text-xl"></i>
                  {error}
                </div>
              )}
              <div ref={messagesEndRef} className="h-4 w-full" />
            </div>
          )}
        </main>
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#fafafa] via-[#fafafa] to-transparent pt-10 pointer-events-none">
          <div className="pointer-events-auto">
            <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} placeholder={currentThread?.mode === 'odh_plugin' ? "Describe features..." : ui.placeholder} footerNote={ui.footerNote} />
          </div>
        </div>
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl animate-fade-in">
            <h3 className="text-2xl font-black text-gray-900 mb-6">{ui.settings}</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{ui.apiKey}</label>
                <input type="text" value={settings.apiKey} onChange={(e) => setSettings({...settings, apiKey: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-5 focus:ring-4 focus:ring-indigo-500/10 outline-none font-mono text-xs transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{ui.lang}</label>
                <select value={settings.language} onChange={(e) => setSettings({...settings, language: e.target.value as Language})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-5 outline-none text-xs font-bold appearance-none cursor-pointer overflow-y-auto">
                  <option value="en">ENGLISH</option>
                  <option value="vi">TIẾNG VIỆT</option>
                  <option value="es">ESPAÑOL</option>
                  <option value="de">DEUTSCH</option>
                  <option value="fr">FRANÇAIS</option>
                  <option value="it">ITALIANO</option>
                  <option value="pt">PORTUGUÊS</option>
                  <option value="ru">РУССКИЙ</option>
                  <option value="ja">日本語</option>
                  <option value="ko">한국어</option>
                  <option value="zh">中文</option>
                  <option value="ar">العربية</option>
                  <option value="th">ไทย</option>
                  <option value="id">BAHASA INDONESIA</option>
                  <option value="hi">हिन्दी</option>
                  <option value="tr">TÜRKÇE</option>
                  <option value="nl">NEDERLANDS</option>
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
