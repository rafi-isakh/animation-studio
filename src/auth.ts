import NextAuth, { User } from "next-auth"
import { AdapterUser } from "next-auth/adapters";
import { SignJWT } from "jose";
import { createPrivateKey } from "crypto";

import Google from "next-auth/providers/google"
import Kakao from "next-auth/providers/kakao";
import Naver from "next-auth/providers/naver";
import Apple from "next-auth/providers/apple";
import Facebook from "next-auth/providers/facebook";
import jwt from 'jsonwebtoken';
import { cookies } from "next/headers";

const getAppleToken = async () => {
  const key = `-----BEGIN PRIVATE KEY-----\n${process.env.AUTH_APPLE_SECRET}\n-----END PRIVATE KEY-----\n`;
  const appleToken = await new SignJWT({})
    .setAudience("com.toonyz.mobile")
    .setIssuer(process.env.AUTH_APPLE_TEAM_ID!)
    .setIssuedAt(new Date().getTime() / 1000)
    .setExpirationTime(new Date().getTime() / 1000 + 3600 * 2)
    .setSubject(process.env.AUTH_APPLE_ID!)
    .setProtectedHeader({
      alg: "ES256",
      kid: process.env.AUTH_APPLE_KEY_ID!,
    })
    .sign(createPrivateKey(key));
  return appleToken;
};

async function refreshAccessToken(token: any) {
  try {
    let url: string;
    let body: URLSearchParams;

    if (token.provider === 'google') {
      url = "https://oauth2.googleapis.com/token";
      body = new URLSearchParams({
        client_id: process.env.AUTH_GOOGLE_ID!,
        client_secret: process.env.AUTH_GOOGLE_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      });
    } else if (token.provider === 'kakao') {
      url = "https://kauth.kakao.com/oauth/token";
      body = new URLSearchParams({
        grant_type: "refresh_token",
        client_id: process.env.AUTH_KAKAO_ID!,
        refresh_token: token.refreshToken,
        client_secret: process.env.AUTH_KAKAO_SECRET!,
      });
    } else {
      throw new Error("Unsupported provider for token refresh");
    }

    const response = await fetch(url, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      method: "POST",
      body: body,
    });

    let refreshedTokens = await response.json();
    if (token.provider === 'apple') {
      refreshedTokens = await getAppleToken();
    }

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    };
  } catch (error) {
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  cookies: {
    callbackUrl: {
      name: "__Secure-next-auth.callback-url",
      options: {
        httpOnly: false,
        sameSite: "none",
        path: "/",
        secure: true, 
      },
    },
    pkceCodeVerifier: {
      name: "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true,
      },
    },
  },
  providers: [
    Google({
      // Google requires "offline" access_type to provide a `refresh_token`
      authorization: { params: { access_type: "offline", prompt: "consent" } },
    }),
    Kakao,
    Apple({
      clientId: process.env.AUTH_APPLE_ID,
      clientSecret: await getAppleToken(),
      checks: ["pkce"],
      token: {
        url: `https://appleid.apple.com/auth/token`,
      },
      client: {
        token_endpoint_auth_method: "client_secret_post",
      },
      authorization: {
        params: {
          response_mode: "form_post",
          response_type: "code",//do not set to "code id_token" as it will not work
          scope: "name email"
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: "Person Doe",//profile.name.givenName + " " + profile.name.familyName, but apple does not return name...
          email: profile.email,
          image: "",
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Initial sign in
      if (account && profile) {
        return {
          accessToken: account.access_token,
          accessTokenExpires: account.expires_at! * 1000,
          refreshToken: account.refresh_token,
          idToken: account.id_token,
          provider: account.provider,
          user: profile,
        }
      }

      // Return previous token if the access token has not expired yet
      // if (Date.now() < (token.accessTokenExpires as number)) {
      //   return token
      // }

      // Access token has expired, try to update it
      return refreshAccessToken(token)
    },
    async session({ session, token }) {
      session.user = token.user as AdapterUser & User
      session.accessToken = token.accessToken as string
      session.provider = token.provider as string
      if (session.provider === 'apple') {
        session.accessToken = token.idToken as string
      }
      if (session.provider === 'kakao' && session.user.kakao_account) {
        session.user.email = session.user.kakao_account.email;
      }
      return session
    },
  },
  secret: process.env.JWT_SECRET
})
