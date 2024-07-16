export interface WebnovelIdProps {
    webnovelId: number;
}

export type Language = 'en' | 'ko' | 'ja' | 'ar';

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
  email: string | null | undefined;
  nickname: string | null | undefined;
}

export interface Comment {
  user: User;
  content: string;
  upvotes: number;
  chapter_id: string;
}

export interface SlickCarouselItem {
  image: string;
  description: string;
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
}