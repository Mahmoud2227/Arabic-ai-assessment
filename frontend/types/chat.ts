export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'audio' | 'image';
  imageUrl?: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: Date;
  messages: Message[];
}

export interface User {
  id: string;
  email: string;
  username: string;
}
