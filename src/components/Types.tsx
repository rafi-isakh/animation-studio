export interface WebnovelIdProps {
    webnovelId: number;
}

export type Language = 'en' | 'ko' | 'ja' | 'ar' | 'zh-CN' | 'zh-TW' | 'id' | 'vi' | 'th' | 'fr' | 'es'

export type ElementType = 'webnovel' | 'chapter' | 'user' | 'comment' | 'carouselItem' | 'other'

export type ElementSubtype = 'title' | 'description' | 'hook' | 'other'

export type SortBy = 'views' | 'likes' | 'date'

export interface Chapter {
  id: number;
  content: string;
  title: string;
  webnovel_id: string;
  comments: Comment[];
  created_at: string;
  views: number;
  upvotes: number;
}

export interface User {
  id: number;
  email: string;
  email_hash: string;
  nickname: string;
  bio: string;
  picture: string;
}

export interface UserCreate {
  email: string;
  nickname: string;
  bio: string;
  provider: string;
  picture?: string;
}

export interface Comment {
  id: number;
  parent_id: number;
  user: User;
  content: string;
  upvotes: number;
  chapter_id: string;
  replies: Comment[];
  created_at: Date;
}

export interface SlickCarouselItem {
  id: number;
  image: string;
  description: string;
  title: string;
  hook: string;
  webnovel_id: number;
}

export interface Webnovel {
  id: number;
  title: string;
  cover_art: string;
  chapters: Chapter[];
  comments: Comment[];
  description: string;
  genre: string;
  user: User;
  upvotes: number;
  language: string;
  views: number;
  version?: string;
  created_at: Date;
}

export interface Dictionary {
  [key: string]: Entry
}

interface Entry {
  [key: string]: string
}

export interface WebtoonContent {
  id: string;
  title: string;
  subtitle: string;
  title_en: string;
  subtitle_en: string;
  title_jp: string; 
  subtitle_jp: string; 
  image: string;
  image_en: string;
  image_jp: string; 
  videoUrl: string;
  file_src: string;
  file_src_en: string;
  file_src_jp: string; 
  video: JSX.Element;
}