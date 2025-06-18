import { ReactNode } from "react";

export interface WebnovelIdProps {
    webnovelId: number;
}

export type ImageOrVideo = 'image' | 'video'

export type Language = 'en' | 'ko' | 'ja' | 'ar' | 'zh-CN' | 'zh-TW' | 'id' | 'vi' | 'th' | 'fr' | 'es'

export type ElementType = 'webnovel' | 'chapter' | 'user' | 'comment' | 'carouselItem' | 'other' | 'toonyz_post'

export type ElementSubtype = 'title' | 'description' | 'hook' | 'other' | 'quote' | 'content'

export type SortBy = 'views' | 'likes' | 'date' | 'recommendation' | 'id'

export interface Chapter {
  id: number;
  content: string;
  title: string;
  webnovel_id: string;
  comments: Comment[];
  created_at: string;
  views: number;
  shown_views: number;
  upvotes: number;
  last_edited: Date;
  free: boolean;
  other_translations: OtherTranslation[];
}

export interface User {
  id: number;
  email: string;
  email_hash: string;
  nickname: string;
  bio: string;
  picture: string;
  stars: number;
  english_stars: number;
  free_stars: number;
  free_english_stars: number;
  tickets: number;
  purchased_webnovel_chapters: string;
  upvoted_comments: string;
  created_at: Date;
  genres: string;
  other_translations: OtherTranslation[];
  is_adult: boolean;
}

export interface UserStripped {
  id: number;
  nickname: string;
  picture: string;
  bio: string;
  other_translations: OtherTranslation[];
  is_adult: boolean;
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
  other_translations: OtherTranslation[];
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
  other_translations: OtherTranslation[];
  link: string;
  genre: string;
  is_en: boolean;
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
  publisher: Publisher;
  upvotes: number;
  language: string;
  views: number;
  shown_views: number;
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
  video_cover: string;
  en_video_cover: string;
  is_adult_material: boolean;
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
  other_translations: OtherTranslation[];
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
  chapter_id: string | null
  user_id: string | null
  comment_id: string | null
  carousel_item_id: string | null
  post_id: string | null
  element_type: string
  element_subtype: string
  done: boolean
}


export interface CourseBook {
  id: number;
  title: string;
  title_en?: string;
  subtitle: string;
  subtitle_en?: string;
  author?: string;
  coverColor?: string;
  coverImage?: string;
  textColor?: string;
  description?: string;
  description_en?: string;
  file_url_ko?: string;
  file_url_en?: string;
}

export interface FaqItem {
  question_ko: string;
  question_en: string;
  answer_ko: string | ReactNode;
  answer_en: string | ReactNode;
}

export interface Publisher {
  id: number;
  name_korean: string;
  name_english: string;
}