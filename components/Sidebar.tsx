
import React from 'react';
import { ChatThread, Language } from '../types';

interface SidebarProps {
  threads: ChatThread[];
  currentThreadId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onNewPluginChat: () => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onOpenSettings: () => void;
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  ui: any;
}

const CAT_AVATAR_URL = "https://raw.githubusercontent.com/s-0-a-d/Image/refs/heads/main/IMG_20250306_151454.jpg";

const Sidebar: React.FC<SidebarProps> = ({ 
  threads, 
  currentThreadId, 
  onSelect, 
  onNewChat, 
  onNewPluginChat,
  onDelete, 
  onOpenSettings,
  isOpen,
  onClose,
  ui
}) => {
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#fcfcfc] border-r border-gray-100 transition-all duration-300 md:relative md:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-4 mb-10 px-2 group cursor-pointer">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg group-hover:rotate-6 transition-transform">
              <img src={CAT_AVATAR_URL} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-black text-lg tracking-tighter">Mồn Lèo AI</span>
          </div>

          <div className="flex flex-col gap-3 mb-8">
            <button onClick={onNewChat} className="w-full py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-800 transition-all flex items-center justify-center gap-3 shadow-xl shadow-black/10 active:scale-95">
              <i className="fa-solid fa-plus text-[10px]"></i>{ui.newChat}
            </button>
            <button onClick={onNewPluginChat} className="w-full py-3 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all active:scale-95">
              <i className="fa-solid fa-bolt mr-2 text-[10px]"></i>ODH Plugin Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
            <h4 className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 opacity-70">{ui.history}</h4>
            {threads.length === 0 && (
              <div className="px-3 py-6 text-center">
                 <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic">Chưa có lịch sử...</p>
              </div>
            )}
            {threads.map((thread) => (
              <div 
                key={thread.id} 
                onClick={() => { onSelect(thread.id); onClose(); }} 
                className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all ${currentThreadId === thread.id ? 'bg-white shadow-md border border-gray-100' : 'hover:bg-gray-200/50'}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${thread.mode === 'odh_plugin' ? 'bg-indigo-500' : 'bg-gray-200'}`}></div>
                  <span className={`text-[11px] font-bold truncate ${currentThreadId === thread.id ? 'text-black' : 'text-gray-500'}`}>{thread.title}</span>
                </div>
                <button 
                  onClick={(e) => onDelete(thread.id, e)} 
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 transition-all"
                >
                  <i className="fa-solid fa-trash-can text-[10px]"></i>
                </button>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-6 border-t border-gray-100">
            <button onClick={onOpenSettings} className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:text-black hover:bg-gray-100 transition-all">
              <i className="fa-solid fa-gear text-sm"></i>{ui.settings}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
