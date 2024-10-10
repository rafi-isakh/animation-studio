import { User } from "next-auth";

export interface WebnovelIdProps {
    webnovelId: number;
}

export type Language = 'en' | 'ko' | 'ja' | 'ar' | 'zh-CN' | 'zh-TW' | 'id' | 'vi' | 'th' 

export type ElementType = 'webnovel' | 'chapter' | 'user' | 'comment' | 'carouselItem'

export type ElementSubtype = 'title' | 'description' | 'hook'

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

export interface UserCreate {
  email: string;
  nickname: string;
  bio: string;
  provider: string;
}

export interface Comment {
  id: number;
  parent_id: number;
  user: User;
  content: string;
  upvotes: number;
  chapter_id: string;
  replies: Comment[];
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
}

export interface Dictionary {
  [key: string]: Entry
}

interface Entry {
  [key: string]: string
}
