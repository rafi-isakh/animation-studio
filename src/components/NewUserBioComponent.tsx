"use client"

import { useLanguage } from "@/contexts/LanguageContext"
import { phrase } from '@/utils/phrases';
import { useEffect, useState } from "react";

const NewUserBioComponent = () => {
    const { dictionary, language } = useLanguage();
    const maxText = 500;
    const [currText, setCurrText] = useState(0);
    const [content, setContent] = useState('');

    useEffect(() => {
        setCurrText(content.length);
    }, [content])

    const trim = (text: string) => {
        text = text.substring(0, maxText)
        return text
    }
    
    return (
        <div className='w-full'>
            <textarea
                placeholder={phrase(dictionary, "intro", language)}
                name="bio"
                rows={6}
                value={content}
                onChange={(e) => setContent(trim(e.target.value))}
                className='input rounded-xl w-full border border-gray-300'
            />
        </div>

    )
}

export default NewUserBioComponent;

