"use client"

import { useLanguage } from "@/contexts/LanguageContext"
import { phrase } from '@/utils/phrases';
import '@/styles/new_user.css'

const NewUserNicknameComponent = () => {
    const { dictionary, language } = useLanguage();

    return (
        <div className='w-full text-black dark:text-black'>
            <input
                placeholder={phrase(dictionary, "nickname", language)}
                type="text"
                name="nickname"
                required
                className='input rounded-xl w-full border border-gray-300 text-black dark:text-black'
            />
        </div>
    )
}

export default NewUserNicknameComponent;