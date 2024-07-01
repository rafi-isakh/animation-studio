export interface WebnovelIdProps {
    webnovelId: number;
}

export interface Chapter {
  content: string;
  title: string;
  webnovelId: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Webnovel {
  id: number;
  title: string;
  cover_art: string;
  chapters: Chapter[];
  description: string;
  genre: string;
  user: User;
}