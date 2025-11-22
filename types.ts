
export enum Sender {
  User = 'user',
  Model = 'model'
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: Date;
  isError?: boolean;
  image?: string; // Base64 string for image preview
  groundingChunks?: any[]; // For search citations
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isConnected: boolean;
}

export enum Tab {
  Home = 'home',
  Connect = 'connect',
  Media = 'media',
  Profile = 'profile'
}

export interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  url: string;
  thumbnail: string;
  title: string;
  date: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content?: string; // Full article content
  date: string;
  source: string;
  imageUrl: string;
  category?: string;
}

export interface StoryItem {
  id: string;
  title: string;
  imageUrl: string;
  isUnseen: boolean;
  isLiked?: boolean;
  date?: string;
}

export interface CarouselItem {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
}
