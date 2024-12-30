"use client"
import { useLanguage } from '@/contexts/LanguageContext';
import { replaceSmartQuotes } from '@/utils/font';
import {terms_youth, terms_youth_english} from '@/utils/terms';

export default function Terms() {
    const {language} = useLanguage();   
    return <div className='max-w-screen-md mx-auto p-4 whitespace-pre-wrap'>{replaceSmartQuotes(language === 'ko' ? terms_youth : terms_youth_english)}</div>
}
