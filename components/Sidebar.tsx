
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

const CAT_AVATAR_URL = "https://raw.githubusercontent.com/s-0-a-d/ChatSkibidi/refs/heads/main/%E1%BA%A2nh/IMG_20250306_151454.jpg";

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
      {isOpen && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#f9f9f9] border-r border-gray-100 transition-transform md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center gap-3 mb-8 px-2">
            <img src={CAT_AVATAR_URL} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-bold text-sm">Mồn Lèo AI</span>
          </div>

          <div className="flex flex-col gap-2 mb-6">
            <button onClick={onNewChat} className="w-full py-3 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center gap-2">
              <i className="fa-solid fa-plus text-[10px]"></i>{ui.newChat}
            </button>
            <button onClick={onNewPluginChat} className="w-full py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all">
              <i className="fa-solid fa-code mr-2"></i>ODH Plugin Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
            <h4 className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{ui.history}</h4>
            {threads.map((thread) => (
              <div key={thread.id} onClick={() => onSelect(thread.id)} className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${currentThreadId === thread.id ? 'bg-white shadow-sm border border-gray-100' : 'hover:bg-gray-200/50'}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <i className={`fa-solid ${thread.mode === 'odh_plugin' ? 'fa-bolt text-indigo-400' : 'fa-comment-dots text-gray-300'} text-[10px]`}></i>
                  <span className="text-xs font-medium truncate">{thread.title}</span>
                </div>
                <button onClick={(e) => onDelete(thread.id, e)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500"><i className="fa-solid fa-xmark text-[10px]"></i></button>
              </div>
            ))}
          </div>

          <button onClick={onOpenSettings} className="mt-auto pt-4 border-t border-gray-100 text-left px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-black">
            <i className="fa-solid fa-gear mr-2"></i>{ui.settings}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
