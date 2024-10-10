import NextAuth from "next-auth"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: User,
    accessToken: string,
    token: string,
    provider: string
  }

  interface User {
    id: number;
    email: string;
    nickname: string;
    bio: string;
    picture: string;
    kakao_account?: {
      email: string;
    };
  }

}