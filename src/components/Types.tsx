export interface WebnovelIdProps {
    webnovelId: string;
}

export interface Webnovel {
  id: number;
  title: string;
  cover_art: string;
  content: string;
  user_id: number;
  user_name: string;
  user_email: string;
}