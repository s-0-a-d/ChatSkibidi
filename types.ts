
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
  userId: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
}

export interface User {
  username: string;
  key: string;
  password: string; // Thêm mật khẩu
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  error: string | null;
}
