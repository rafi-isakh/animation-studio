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
            <NoCapsButton color='gray' variant='outlined' onClick={() => login('google', true, `/new_user`)} className='rounded-lg border-1 border-gray-300 w-80 flex flex-row items-center justify-center' type="submit">
                <Image 
                    src="/google_logo.svg" 
                    alt="Google Sign In" 
                    width={25} 
                    height={25}
                    className="border-none"
                    placeholder="blur" blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg==" // 추가
                >
                </Image>
                    <p className="text-lg ml-4">{phrase(dictionary, "google_signin", language)}</p>
                
            </NoCapsButton>
        </div>
    )
}

export function KakaoSignIn() {
    const { language, dictionary } = useLanguage();
    const { login } = useAuth();
    return (
        <div className="flex flex-row items-center justify-center">
            <NoCapsButton color='gray' variant='outlined' onClick={() => login('kakao', true, `/new_user`)} className='rounded-lg border-1 border-gray-300 w-80 flex flex-row items-center justify-center' type="submit">
                <Image 
                src="/kakao_logo.svg" 
                alt="Kakao Sign In" 
                width={20} 
                height={20}
                placeholder="blur" blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg==" // 추가
                >
                </Image>
                    <p className="text-lg ml-4"> {phrase(dictionary, "kakao_signin", language)} </p>
               
            </NoCapsButton>
        </div>
    )
}
