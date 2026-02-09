
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createChatSession, sendMessageStream } from './services/gemini';
import { Message, Role } from './types';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';

const STORAGE_KEY = 'gemini_chat_history';

const App: React.FC = () => {
  // Load initial messages from localStorage or use default welcome message
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert ISO strings back to Date objects
        return parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
    return [
      {
        id: 'welcome',
        role: Role.MODEL,
        text: 'Xin chào! Tôi là **Thanh AI**. Tôi được phát triển bởi **Thanh** dựa trên công nghệ của Google. Tôi có thể giúp gì cho bạn hôm nay?',
        timestamp: new Date(),
      }
    ];
  });

  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat session once and restore context if needed
  useEffect(() => {
    chatSessionRef.current = createChatSession();
  }, []);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async (text: string) => {
    if (!chatSessionRef.current) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setError(null);

    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMessageId,
      role: Role.MODEL,
      text: '',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, aiMessage]);

    try {
      let fullResponse = '';
      const stream = sendMessageStream(chatSessionRef.current, text);
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => 
          prev.map(msg => 
            msg.id === aiMessageId ? { ...msg, text: fullResponse } : msg
          )
        );
      }
    } catch (err: any) {
      setError('Đã có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại.');
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMessageId ? { ...msg, text: 'Rất tiếc, đã có lỗi xảy ra. Hãy kiểm tra kết nối mạng hoặc thử lại sau.' } : msg
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    const resetMessages = [
      {
        id: 'welcome',
        role: Role.MODEL,
        text: 'Đã xóa lịch sử trò chuyện. Tôi là **Thanh AI**, tôi có thể giúp gì mới cho bạn?',
        timestamp: new Date(),
      }
    ];
    setMessages(resetMessages);
    localStorage.removeItem(STORAGE_KEY);
    chatSessionRef.current = createChatSession();
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 py-3 px-6 shadow-sm z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-md">
              <i className="fa-solid fa-bolt text-white text-lg"></i>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Thanh AI</h1>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                <span className="text-xs text-gray-500 font-medium">Trực tuyến</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
             <button 
              onClick={clearChat}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center space-x-1"
              title="Xóa lịch sử"
            >
              <i className="fa-solid fa-trash-can text-sm"></i>
              <span className="text-xs font-medium hidden sm:inline">Xóa hội thoại</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5">
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-2">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isTyping && (
            <div className="flex justify-start mb-6 animate-pulse">
               <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-1">
                 <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                 <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                 <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
               </div>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-2 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Footer Input Area */}
      <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
    </div>
  );
};

export default App;
