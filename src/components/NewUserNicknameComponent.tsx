"use client"

import { useLanguage } from "@/contexts/LanguageContext"

const NewUserNicknameComponent = () => {
  const {dictionary, language} = useLanguage();

  return (
    <div>
      <p className="text-lg">{Object.keys(dictionary).length != 0 && dictionary["nickname"][language]}</p>
      <input
        type="text"
        name="nickname"
        className='input border-none rounded focus:ring-pink-600 bg-gray-200 w-full'
      />
    </div>
  )
}

export default NewUserNicknameComponent;