export interface WebnovelIdProps {
    webnovelId: number;
}

export interface Chapter {
  id: number;
  content: string;
  title: string;
  webnovel_id: string;
  comments: Comment[];
}

export interface User {
  email: string;
  name: string;
  token_id: string;
}

export interface Comment {
  user: User;
  content: string;
  upvotes: number;
  chapterId: number;
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
}