
export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export type Language = 
  | 'en' | 'vi' | 'fr' | 'ja' | 'ko' | 'zh' 
  | 'es' | 'de' | 'it' | 'ru' | 'pt' | 'ar' 
  | 'th' | 'id' | 'hi' | 'tr' | 'nl';

export type AppMode = 'standard' | 'odh_plugin';

export interface Attachment {
  data: string; // base64 string
  mimeType: string;
  url: string; // blog url for local preview
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
  mode: AppMode;
}

export interface AppSettings {
  apiKey: string;
  language: Language;
  useSearch: boolean;
  currentMode: AppMode;
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  error: string | null;
}
