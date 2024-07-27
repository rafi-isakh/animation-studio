import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Kakao from "next-auth/providers/kakao";
import Naver from "next-auth/providers/naver";
import Apple from "next-auth/providers/apple";
import Facebook from "next-auth/providers/facebook";
import jwt from 'jsonwebtoken';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google, Kakao, Naver, Apple, Facebook],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        let email;
        if (account.provider == "google") {
          email = profile.email;
        } else if (account.provider == 'kakao') {
          const kakao_account = profile.kakao_account as any;
          email = kakao_account.email;
        }
        token.accessToken = jwt.sign(
          { 
            email: email,
          },
          process.env.JWT_SECRET as string,
          { expiresIn: '1h' }
        );
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      return session
    },
  },
  secret: process.env.JWT_SECRET
})
