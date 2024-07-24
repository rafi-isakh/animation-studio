"use client"

import { useLanguage } from "@/contexts/LanguageContext"
import {phrase} from '@/utils/phrases'

const SignInComponent = () => {
    const {language, dictionary} = useLanguage()
    return (
        <div className="flex justify-center text-2xl font-semibold">{phrase(dictionary, 'login', language)}</div>
    )
}

export default SignInComponent;