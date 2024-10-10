import NextAuth from "next-auth"
import { User } from "@/components/Types"
import { AdapterUser } from "next-auth/adapters";

import Google from "next-auth/providers/google"
import Kakao from "next-auth/providers/kakao";
import Naver from "next-auth/providers/naver";
import Apple from "next-auth/providers/apple";
import Facebook from "next-auth/providers/facebook";
import jwt from 'jsonwebtoken';

// ... existing imports ...

async function refreshAccessToken(token: any) {
  try {
    // Implement the refresh token logic here
    // This will depend on the provider and their specific refresh token process
    // For example, for Google:
    const url = "https://oauth2.googleapis.com/token"
    const response = await fetch(url, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      method: "POST",
      body: new URLSearchParams({
        client_id: process.env.AUTH_GOOGLE_ID!,
        client_secret: process.env.AUTH_GOOGLE_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    })

    const refreshedTokens = await response.json()

    if (!response.ok) {
      throw refreshedTokens
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    }
  } catch (error) {
    return {
      ...token,
      error: "RefreshAccessTokenError",
    }
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
        // Google requires "offline" access_type to provide a `refresh_token`
        authorization: { params: { access_type: "offline", prompt: "consent" } },
    }),
    Kakao
],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Initial sign in
      if (account && profile) {
        return {
          accessToken: account.access_token,
          accessTokenExpires: account.expires_at! * 1000,
          refreshToken: account.refresh_token,
          provider: account.provider,
          user: profile,
        }
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token
      }

      // Access token has expired, try to update it
      return refreshAccessToken(token)
    },
    async session({ session, token }) {
      session.user = token.user as AdapterUser & User
      session.accessToken = token.accessToken as string
      session.provider = token.provider as string
      return session
    },
  },
  secret: process.env.JWT_SECRET
})
