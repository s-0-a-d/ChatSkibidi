
export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export type Language = 'en' | 'vi';

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: Date;
}

export interface ChatThread {
  id: string;
  userId: string; // Gắn thread với người dùng
  title: string;
  messages: Message[];
  lastUpdated: Date;
}

export interface User {
  username: string;
  key: string;
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  error: string | null;
}
