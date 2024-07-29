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
      if (account?.provider === "google") {
        return { ...token, accessToken: account.access_token, provider: account.provider }
      } else if (account?.provider === "kakao") {
        return { ...token, accessToken: account.access_token, provider: account.provider }
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.provider = token.provider as string;
      return session
    },
  },
  secret: process.env.JWT_SECRET
})
