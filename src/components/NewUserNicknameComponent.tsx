"use client"

import { useLanguage } from "@/contexts/LanguageContext"
import { phrase } from '@/utils/phrases';

const NewUserNicknameComponent = () => {
    const { dictionary, language } = useLanguage();

    return (
        <div className='w-full'>
            <input
                placeholder={phrase(dictionary, "nickname", language)}
                type="text"
                name="nickname"
                required
                className='input rounded-xl w-full border border-gray-300'
            />
        </div>
    )
}

export default NewUserNicknameComponent;