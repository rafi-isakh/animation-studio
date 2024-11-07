import { Webnovel } from "@/components/Types"
import Link from "next/link"
import styles from "@/styles/KoreanText.module.css"
import { phrase } from '@/utils/phrases'
import { useLanguage } from "@/contexts/LanguageContext"
import OtherTranslateComponent from "@/components/OtherTranslateComponent"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ChevronRight } from 'lucide-react';

const AuthorAndWebnovelsAsideComponent = ({ webnovels, nickname }:
    { webnovels: Webnovel[], nickname: string | null | undefined }) => {
    const {language, dictionary} = useLanguage();
    const [key, setKey] = useState(0);
    const params = useSearchParams();

    useEffect(() => {
        setKey(prevKey => prevKey + 1);
    }, [params, language])

    return (
        <div className="flex flex-col space-y-4 mr-10">
            <p id="nickname" className={`text-2xl mb-5 font-black ${styles.korean}`}>{nickname} {phrase(dictionary, "whoseWebnovels", language)}</p>
            <div className="flex flex-col space-y-4">
                {webnovels?.map((webnovel, index) => (
                    <Link key={index} href={`/view_webnovels?id=${webnovel.id}`} 
                    className={
                        `flex flex-row rounded text-md hover:text-pink-600 hover:bg-gray-200 transition ease-in-out delay-150 px-3 py-2
                        ${params.get('id') == webnovel.id.toString()? "font-black text-white bg-purple-500": ""}`}>
                        {/* Right arrow display only when the webnovel is selected */}
                        { params.get('id') == webnovel.id.toString() ? <ChevronRight size={18} className="self-center" /> : '' }
                     <OtherTranslateComponent key={key} content={webnovel.title} 
                        elementId={webnovel.id.toString()} elementType='webnovel' elementSubtype="title"/>
                    </Link>
                ))}
            </div>
        </div>
    )
}

export default AuthorAndWebnovelsAsideComponent