
import React from 'react';
import { ChatThread } from '../types';

interface SidebarProps {
  threads: ChatThread[];
  currentThreadId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  threads, 
  currentThreadId, 
  onSelect, 
  onNewChat, 
  onDelete, 
  onLogout,
  isOpen,
  onClose,
  userName
}) => {
  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#171717] text-gray-300 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:flex md:flex-col shrink-0
      `}>
        {/* Header Sidebar */}
        <div className="p-4 flex flex-col h-full">
          <button 
            onClick={onNewChat}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white/10 hover:bg-white/15 rounded-xl transition-all border border-white/5 mb-6 group"
          >
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-cat text-indigo-400 group-hover:scale-110 transition-transform"></i>
              <span className="text-sm font-bold text-white">Tin nhắn mới</span>
            </div>
            <i className="fa-solid fa-pen-to-square text-xs text-gray-500"></i>
          </button>

          <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 space-y-1">
            <h3 className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Lịch sử trò chuyện</h3>
            
            {threads.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-xs text-gray-500">Chưa có hội thoại nào</p>
              </div>
            ) : (
              threads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => onSelect(thread.id)}
                  className={`
                    group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all
                    ${currentThreadId === thread.id ? 'bg-white/10 text-white' : 'hover:bg-white/5'}
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <i className={`fa-regular fa-message text-xs ${currentThreadId === thread.id ? 'text-indigo-400' : 'text-gray-500'}`}></i>
                    <span className="text-xs font-medium truncate">{thread.title}</span>
                  </div>
                  <button 
                    onClick={(e) => onDelete(thread.id, e)}
                    className="p-1.5 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                  >
                    <i className="fa-solid fa-trash-can text-[10px]"></i>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer Sidebar */}
          <div className="mt-auto pt-4 border-t border-white/5 space-y-1">
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 mb-2">
               <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                 {userName.slice(0, 1).toUpperCase()}
               </div>
               <div className="flex flex-col min-w-0">
                 <span className="text-xs font-bold text-white truncate">{userName}</span>
                 <span className="text-[10px] text-gray-500 font-medium">Người dùng Gold</span>
               </div>
            </div>
            
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all text-xs font-medium"
            >
              <i className="fa-solid fa-arrow-right-from-bracket w-4"></i>
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
