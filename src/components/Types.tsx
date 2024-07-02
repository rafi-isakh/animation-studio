export interface WebnovelIdProps {
    webnovelId: number;
}

export interface Chapter {
  content: string;
  title: string;
  webnovelId: string;
}

export interface User {
  email: string;
  name: string;
}

export interface Comment {
  user: User;
  content: string;
  upvotes: number;
  webnovel_id: string;
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
}