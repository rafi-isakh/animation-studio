"use client"

import { useLanguage } from "@/contexts/LanguageContext"
import {phrase} from '@/utils/phrases'
import Image from "next/image"

const SignInComponent = () => {
    const {language, dictionary} = useLanguage()
    return (
        <div className="flex flex-col justify-center text-2xl font-semibold">
          
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
        </div>
    )
}

export default SignInComponent;