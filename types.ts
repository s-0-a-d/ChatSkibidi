
export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: Date;
}

export interface ChatThread {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  error: string | null;
}
