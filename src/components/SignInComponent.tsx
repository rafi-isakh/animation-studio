"use client"

import { useLanguage } from "@/contexts/LanguageContext"

const SignInComponent = () => {
    const {language, dictionary} = useLanguage()
    return (
        <div className="flex justify-center text-2xl font-semibold">{Object.keys(dictionary).length != 0 && dictionary['login'][language]}</div>
    )
}

export default SignInComponent;