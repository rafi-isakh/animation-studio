"use client"

import { useLanguage } from "@/contexts/LanguageContext"
import {phrase} from '@/utils/phrases';

const NewUserNicknameComponent = () => {
  const {dictionary, language} = useLanguage();

  return (
    <div className='w-full'>
      <p className="text-lg">{phrase(dictionary, "promotion", language)}</p>
      <input
        type="text"
        name="promotion"
        className='input border-none rounded focus:ring-pink-600 bg-gray-200 w-full'
      />
    </div>
  )
}

export default NewUserNicknameComponent;