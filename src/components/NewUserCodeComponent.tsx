"use client"

import { useLanguage } from "@/contexts/LanguageContext"
import { phrase } from '@/utils/phrases';
import '@/styles/new_user.css'

const NewUserNicknameComponent = () => {
  const { dictionary, language } = useLanguage();

  return (
    <div className='w-full text-black dark:text-black'>
      <input
        placeholder={phrase(dictionary, "promotion", language)}
        type="text"
        name="promoCode"
        className='input rounded-md w-full border border-gray-300 text-black dark:text-black'
      />
    </div>
  )
}

export default NewUserNicknameComponent;