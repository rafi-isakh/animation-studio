"use client"

import { useLanguage } from "@/contexts/LanguageContext"
import {phrase} from '@/utils/phrases';

const NewUserNicknameComponent = () => {
  const {dictionary, language} = useLanguage();

  return (
    <div>
      <p className="text-lg">{phrase(dictionary, "nickname", language)}</p>
      <input
        type="text"
        name="nickname"
        className='input border-none rounded focus:ring-pink-600 bg-gray-200 w-full'
      />
    </div>
  )
}

export default NewUserNicknameComponent;