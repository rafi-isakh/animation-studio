import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Kakao from "next-auth/providers/kakao";
import Naver from "next-auth/providers/naver";
import Apple from "next-auth/providers/apple";
import Facebook from "next-auth/providers/facebook";


export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google, Kakao, Naver, Apple, Facebook],
  callbacks: {
    jwt({ token, user }) {
      if (user) { // User is available during sign-in
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      console.log('token id', token.id)
      session.user.id = token.id
      return session
    },
  }
})
