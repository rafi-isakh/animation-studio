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
        <div className="relative inline-flex group w-[300px]">
            <div className="absolute transitiona-all duration-1000 opacity-50 -inset-px bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] rounded-xl blur-lg filter group-hover:opacity-100 group-hover:-inset-1 group-hover:duration-200">
            </div>
            <NoCapsButton
                variant='text'
                onClick={() => login('google', true, `/new_user`)}
                className='flex-shrink-1 w-full relative inline-flex items-center px-6 py-3 md:text-base text-md font-medium text-black transition-all duration-200 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900'
                type="submit">
                <div className="w-[25px] flex items-center">
                    <Image
                        src="/icons/google_logo.svg"
                        alt="Google Sign In"
                        width={21}
                        height={21}
                        className="border-none"
                        placeholder="blur"
                        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg=="
                    />
                </div>
                <p className="md:text-lg text-md flex-1 text-center ml-4">{phrase(dictionary, "google_signin", language)}</p>
            </NoCapsButton>
        </div>
    )
}

export function KakaoSignIn() {
    const { language, dictionary } = useLanguage();
    const { login } = useAuth();
    return (
        <div className="relative inline-flex group w-full">
            <div className="absolute transitiona-all duration-1000 opacity-50 -inset-px bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] rounded-xl blur-lg filter group-hover:opacity-100 group-hover:-inset-1 group-hover:duration-200">
            </div>
            <NoCapsButton
                variant='text'
                onClick={() => login('kakao', true, `/new_user`)}
                className='flex-shrink-1 w-full relative inline-flex items-center justify-center px-6 py-3 md:text-base text-md font-medium text-black transition-all duration-200 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900'
                type="submit">
                <div className="w-[25px] flex items-center">
                    <Image
                        src="/kakao_logo.svg"
                        alt="Kakao Sign In"
                        width={25}
                        height={25}
                        className=""
                        placeholder="blur" blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg==" // 추가
                    >
                    </Image>
                </div>
                <p className="md:text-lg text-md flex-1 text-center ml-4"> {phrase(dictionary, "kakao_signin", language)} </p>
            </NoCapsButton>
        </div>
    )
}

export function AppleSignIn() {
    const { language, dictionary } = useLanguage();
    const { login } = useAuth();
    return (
        <div className="relative inline-flex group w-full">
            <div className="absolute transitiona-all duration-1000 opacity-50 -inset-px bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] rounded-xl blur-lg filter group-hover:opacity-100 group-hover:-inset-1 group-hover:duration-200">
            </div>
            <NoCapsButton
                variant='text'
                onClick={() => login('apple', true, `/new_user`)}
                className='flex-shrink-1 w-full relative inline-flex items-center justify-center px-6 py-3 md:text-base text-md font-medium text-black transition-all duration-200 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900'
                type="submit">
                <div className="rounded-full p-1 flex items-center justify-center">
                    <div className="w-[20px] flex items-center"> 
                        <Image
                            src="/icons/apple_signin_logo.svg"
                            alt="Apple Sign In"
                            width={20}
                            height={20}
                            className="rounded-full self-start flex-1"
                            placeholder="blur"
                            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg=="
                        />
                    </div>
                </div>
                <p className="md:text-lg text-md flex-1 text-center ml-4"> {phrase(dictionary, "apple_signin", language)} </p>
            </NoCapsButton>
        </div>
    )
}
