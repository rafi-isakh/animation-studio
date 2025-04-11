export interface WebnovelIdProps {
    webnovelId: number;
}

export type ImageOrVideo = 'image' | 'video'

export type Language = 'en' | 'ko' | 'ja' | 'ar' | 'zh-CN' | 'zh-TW' | 'id' | 'vi' | 'th' | 'fr' | 'es'

export type ElementType = 'webnovel' | 'chapter' | 'user' | 'comment' | 'carouselItem' | 'other' | 'toonyz_post'

export type ElementSubtype = 'title' | 'description' | 'hook' | 'other' | 'quote' | 'content'

export type SortBy = 'views' | 'likes' | 'date' | 'recommendation'

export interface Chapter {
  id: number;
  content: string;
  title: string;
  webnovel_id: string;
  comments: Comment[];
  created_at: string;
  views: number;
  upvotes: number;
  free: boolean;
}

export interface User {
  id: number;
  email: string;
  email_hash: string;
  nickname: string;
  bio: string;
  picture: string;
  stars: number;
  free_stars: number;
  marketing: string;
  purchased_webnovel_chapters: string;
  upvoted_comments: string;
  created_at: Date;
  genres: string;
}

export interface UserStripped {
  id: number;
  nickname: string;
  picture: string;
  bio: string;
}

export interface Author {
  id: number;
  email: string;
  email_hash: string;
  nickname: string;
}

export interface UserCreate {
  email: string;
  nickname: string;
  bio: string;
  provider: string;
  picture?: string;
  genres: string;
  marketing: string;
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
  post_id: number;
}

export interface SlickCarouselItem {
  id: number;
  image: string;
  image_mobile: string;
  description: string;
  title: string;
  hook: string;
  webnovel_id: number;
  webnovel: Webnovel;
  parsed_tags: string[];
}

export interface Webnovel {
  id: number;
  title: string;
  cover_art: string;
  en_cover_art: string;
  chapters: Chapter[];
  description: string;
  genre: string;
  user: User;
  author: Author;
  upvotes: number;
  language: string;
  views: number;
  version?: string;
  created_at: Date;
  tags: string;
  premium: boolean;
  available_languages: string;
  price_korean: number;
  price_english: number;
  okay_to_create_videos: boolean;
  chapters_length: number;
  last_update: Date;
  en_published_up_to_chapter: number;
  other_translations: OtherTranslation[];
}

export interface Dictionary {
  [key: string]: Entry
}

interface Entry {
  [key: string]: string
}

export interface CurriculumContent {
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

export interface ToonyzPost {
  id: number;
  user: User;
  title: string;
  content: string;
  image?: string;
  video?: string;
  upvotes: number;
  comments: Comment[];
  tags: string;
  webnovel_id: string;
  chapter_id: string;
  created_at: Date;
  views: number;
  quote?: string;
}

export interface ToonyzPostUpdate {
  id: number;
  title: string;
  content: string;
  tags: string;
}

export type OtherTranslation = {
  id: string
  text: string
  language: string
  webnovel_id: string | null
  element_type: string
  element_subtype: string
  done: boolean
}