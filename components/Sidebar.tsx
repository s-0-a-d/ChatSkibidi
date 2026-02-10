
import React from 'react';
import { ChatThread, Language } from '../types';

interface SidebarProps {
  threads: ChatThread[];
  currentThreadId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onOpenSettings: () => void;
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  ui: any;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  threads, 
  currentThreadId, 
  onSelect, 
  onNewChat, 
  onDelete, 
  onOpenSettings,
  isOpen,
  onClose,
  ui
}) => {
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0f1115] text-gray-300 transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 md:flex md:flex-col shrink-0 border-r border-white/5`}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 rotate-3"><i className="fa-solid fa-cat"></i></div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-white tracking-tight">Mồn Lèo AI</span>
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest opacity-70">By Thanh</span>
            </div>
          </div>

          <button onClick={onNewChat} className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-all shadow-xl shadow-indigo-900/20 mb-10 active:scale-95 group">
            <i className="fa-solid fa-plus text-xs group-hover:rotate-90 transition-transform"></i>
            <span className="text-xs font-black tracking-widest uppercase">{ui.newChat}</span>
          </button>

          <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 space-y-2">
            <h3 className="px-4 text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 opacity-50">{ui.history}</h3>
            {threads.length === 0 ? (
              <div className="px-4 py-12 text-center opacity-30"><p className="text-[10px] font-bold uppercase tracking-widest">{ui.noChats}</p></div>
            ) : (
              threads.map((thread) => (
                <div key={thread.id} onClick={() => onSelect(thread.id)} className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${currentThreadId === thread.id ? 'bg-white/10 border-white/10 text-white' : 'border-transparent hover:bg-white/5 text-gray-500 hover:text-gray-300'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <i className={`fa-regular fa-comment-dots text-xs ${currentThreadId === thread.id ? 'text-indigo-400' : 'text-gray-700 group-hover:text-gray-500'}`}></i>
                    <span className="text-xs font-bold truncate tracking-tight">{thread.title}</span>
                  </div>
                  <button onClick={(e) => onDelete(thread.id, e)} className="p-2 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
                </div>
              ))
            )}
          </div>

          <div className="mt-auto pt-6 border-t border-white/5">
            <button onClick={onOpenSettings} className="w-full flex items-center gap-3 px-4 py-4 text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all text-xs font-black uppercase tracking-widest group">
              <i className="fa-solid fa-gear text-indigo-500 group-hover:rotate-45 transition-transform"></i>
              {ui.settings}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
