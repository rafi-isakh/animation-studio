"use client"
import { signIn } from "@/auth"
import { grayTheme, NoCapsButton } from "@/styles/BlackWhiteButtonStyle";
import { Button, ThemeProvider } from "@mui/material";
import { Session } from "next-auth"
import Image from "next/image"
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "./phrases";
import { useAuth } from "@/contexts/AuthContext";

export function getSessionUserEmail(session: Session) {
    if (session && session.user) {
        if (session.provider === "google") {
            return session.user.email;
        } else if (session.provider === "kakao") {
            return session.user.kakao_account?.email;
        }
    }
    return null
}

export function GoogleSignIn() {
    const { language, dictionary } = useLanguage();
    const { login } = useAuth();
    return (
        <div className="flex flex-row items-center justify-center">
            <NoCapsButton color='gray' variant='outlined' onClick={() => login('google', true, `/new_user`)} className='rounded-full border-2 border-gray-300 w-80 flex flex-row items-center justify-center' type="submit">
                <Image src="/google_logo.svg" alt="Google Sign In" width={50} height={50}
                    placeholder="blur" blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg==" // 추가
                >
                </Image>
                <div className="flex flex-row items-center justify-center mx-auto">
                    <p className="text-lg">{phrase(dictionary, "google_signin", language)}</p>
                </div>
            </NoCapsButton>
        </div>
    )
}

export function KakaoSignIn() {
    const { language, dictionary } = useLanguage();
    const { login } = useAuth();
    return (
        <div className="flex flex-row items-center justify-center">
            <NoCapsButton color='gray' variant='outlined' onClick={() => login('kakao', true, `/new_user`)} className='rounded-full border-2 border-gray-300 w-80 flex flex-row items-center justify-center' type="submit">
                <Image src="/kakao_logo.svg" alt="Kakao Sign In" width={50} height={50}
                    placeholder="blur" blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg==" // 추가
                >
                </Image>
                <div className="flex flex-row items-center justify-center mx-auto">
                    <p className="text-lg">{phrase(dictionary, "kakao_signin", language)}</p>
                </div>
            </NoCapsButton>
        </div>
    )
}
