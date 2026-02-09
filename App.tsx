
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createChatSession, sendMessageStream } from './services/gemini.ts';
import { Message, Role } from './types.ts';
import ChatMessage from './components/ChatMessage.tsx';
import ChatInput from './components/ChatInput.tsx';

const STORAGE_KEY = 'thanh_ai_chat_history';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
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
        text: 'Xin chào! Tôi là **Thanh AI**. Hôm nay là ngày ' + new Date().toLocaleDateString('vi-VN') + '. Tôi được phát triển bởi **Thanh** và luôn sẵn sàng hỗ trợ bạn!',
        timestamp: new Date(),
      }
    ];
  });

  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatSessionRef.current = createChatSession();
  }, []);

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
      console.error(err);
      setError('Lỗi kết nối. Hãy thử lại.');
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMessageId ? { ...msg, text: 'Rất tiếc, tôi đang gặp khó khăn khi kết nối. Hãy thử lại sau giây lát.' } : msg
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      role: Role.MODEL,
      text: 'Đã làm mới cuộc hội thoại. Tôi là **Thanh AI**, bạn muốn hỏi gì tôi nào?',
      timestamp: new Date(),
    }]);
    localStorage.removeItem(STORAGE_KEY);
    chatSessionRef.current = createChatSession();
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gray-50 overflow-hidden">
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
                <span className="text-xs text-gray-500 font-medium">Đang hoạt động</span>
              </div>
            </div>
          </div>
          <button onClick={clearChat} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
            <i className="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/50">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isTyping && (
            <div className="flex justify-start mb-6">
               <div className="bg-white border border-gray-200 px-4 py-2 rounded-2xl rounded-tl-none flex items-center space-x-1">
                 <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                 <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                 <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
    </div>
  );
};

export default App;
