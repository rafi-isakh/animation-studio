"use client"

import { GoogleSignIn, KakaoSignIn, AppleSignIn } from '@/utils/SignIn';
import { useLanguage } from "@/contexts/LanguageContext"
import { phrase } from '@/utils/phrases'
import Image from "next/image"
import Link from "next/link"

const SignInComponent = () => {
  const { language, dictionary } = useLanguage()
  return (
    <div className="md:w-max-screen-md flex flex-col justify-center text-lg font-semibold font-pretendard">
      <div className="w-[360px] flex flex-col items-center justify-center rounded-xl">
        <span className="relative flex h-28 w-28">
          <span className="relative inline-flex rounded-full h-28 w-28 border-[#FFE2DC]">
            <Image src="/images/stelli_head.svg" alt="Stelli image" width={100} height={100} className='self-center mx-auto' />
          </span>
        </span>

        <h1 className="text-center text-xl mb-4">
          {/* Welcome back */}
          {phrase(dictionary, 'loginOrSignup', language)}
        </h1>
        {/* 
        <div className="my-4 flex items-center gap-4 w-full leading-tight">
              <hr className="w-full border-gray-300" />
              <p className="text-[10px] text-gray-800 text-center"> or  </p>
              <hr className="w-full border-gray-300" />
        </div> */}

        <div className="flex flex-col space-y-4 m-4 justify-center" >
          <GoogleSignIn></GoogleSignIn>
          <KakaoSignIn></KakaoSignIn>
          <AppleSignIn></AppleSignIn>
        </div>

        <p className="text-center text-[10px] text-gray-400 dark:text-white"> 
          Your Favorite Story Universe, Between Us, Toonyz 
        </p>
        {/* <p className="text-center text-[10px] leading-tight">
        "Beyond reality, into your story" <br/>
        "Your world, more extraordinary than ever"
        </p>   */}
      </div>

      <div className="flex flex-row justify-center gap-4 mt-10 leading-tight">
        <p className="text-center text-[10px] font-extrabold text-gray-400 dark:text-white hover:text-[#DB2777]">
          <Link href="/terms">
            {/* 이용약관 : Terms of use */}
            {phrase(dictionary, "terms", language)}
          </Link>
        </p>
        <p className="text-center text-[10px]  text-gray-400 dark:text-white hover:text-[#DB2777]">
          <Link href="/terms/privacy">
            {/* 개인정보 처리방침 : Privacy policy */}
            {phrase(dictionary, "privacy", language)}
          </Link>
        </p>
        <p className="text-center text-[10px]  text-gray-400  dark:text-white hover:text-[#DB2777]">
          <Link href="/terms/youth">
            {/* 청소년 보호 정책 : Youth protection policy */}
            {phrase(dictionary, "youth_terms", language)}
          </Link>
        </p>
        <p className="text-center text-[10px] text-gray-400 dark:text-white">
          © Stella& Inc.
        </p>
      </div>

    </div>
  )
}

export default SignInComponent;