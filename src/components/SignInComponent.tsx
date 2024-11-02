"use client"

import { GoogleSignIn, KakaoSignIn } from '@/utils/SignIn';
import { useLanguage } from "@/contexts/LanguageContext"
import {phrase} from '@/utils/phrases'
import Image from "next/image"
import Link from "next/link"

const SignInComponent = () => {
    const {language, dictionary} = useLanguage()
    return (
        <div className="flex flex-col justify-center text-2xl font-semibold">
         <div className="flex flex-col items-center justify-center lg:px-10 md:px-10 py-20 rounded-xl border border-gray-300">
         
          <Image
          src="/N_Logo.png"
          alt="Toonyz Logo"
          width={0}
          height={0}
          sizes="100vh"
          style={{ 
            marginTop: '15px',
            height: '35px', 
            width: '35px', 
            justifyContent: 'center', 
            alignSelf: 'center', 
            borderRadius: '25%', 
            // border: '1px solid #eee'  
            }}
          />
            <p className="text-center"> {phrase(dictionary, 'login', language)} </p>  <br/>
            {/* <h1> Login in to Toonyz</h1> */}
            <p className="text-center text-[10px]"> Your Favorite Story Universe, Between Us, Toonyz </p>

              <div className="flex flex-col space-y-4 m-4 justify-center mb-14" >
                <GoogleSignIn></GoogleSignIn>
                <KakaoSignIn></KakaoSignIn>
              </div>
           </div>

            <div className="flex flex-row justify-center gap-4 mt-10">
             <p className="text-center text-[10px] font-extrabold text-gray-400 hover:text-pink-600">
              <Link href="/terms">
              {/* 이용약관 : Terms of use */}
              {phrase(dictionary, "terms", language)}
              </Link>
            </p>
             <p className="text-center text-[10px]  text-gray-400 hover:text-pink-600">
              <Link href="/terms/privacy">
              {/* 개인정보 처리방침 : Privacy policy */}
              {phrase(dictionary, "privacy", language)}
              </Link>
            </p>
              <p className="text-center text-[10px]  text-gray-400 hover:text-pink-600">
              <Link href="/terms/youth">
              {/* 청소년 보호 정책 : Youth protection policy */}
              {phrase(dictionary, "youth_terms", language)}
              </Link>
             </p>
             {language == 'ko' ?
                <p className="text-center text-[10px]  text-gray-400 hover:text-pink-600">
                  <Link href="/contact">
                  {/* 고객지원 */}
                  {phrase(dictionary, "contact", language)}
                  </Link>
                </p>
             : <></> }
             <p className="text-center text-[10px] text-gray-400">
              © Stella& Inc.
            </p>
           </div>
           
        </div>
    )
}

export default SignInComponent;