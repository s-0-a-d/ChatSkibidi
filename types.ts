
export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export type Language = 'en' | 'vi' | 'fr' | 'ja' | 'ko' | 'zh';

export interface Attachment {
  data: string; // base64 string
  mimeType: string;
  url: string; // blob url for local preview
  name?: string;
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: Date;
  attachment?: Attachment;
}

export interface ChatThread {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
}

export interface AppSettings {
  apiKey: string;
  language: Language;
  useSearch: boolean;
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  error: string | null;
}
