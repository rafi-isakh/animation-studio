import { Webnovel } from "@/components/Types"
import Link from "next/link"
import styles from "@/styles/KoreanText.module.css"
import { phrase } from '@/utils/phrases'
import { useLanguage } from "@/contexts/LanguageContext"
import OtherTranslateComponent from "@/components/OtherTranslateComponent"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

const AuthorAndWebnovelsAsideComponent = ({ webnovels, nickname }:
    { webnovels: Webnovel[], nickname: string | null | undefined }) => {
    const {language, dictionary} = useLanguage();
    const [key, setKey] = useState(0);
    const params = useSearchParams();
    console.log('webnovels', webnovels);

    useEffect(() => {
        setKey(prevKey => prevKey + 1);
    }, [params, language])

    return (
        <div className="flex flex-col space-y-4 mr-10">
            <p id="nickname" className={`text-2xl ${styles.korean}`}>{nickname} {phrase(dictionary, "whoseWebnovels", language)}</p>
            <div className="flex flex-col space-y-4">
                {webnovels?.map((webnovel, index) => (
                    <Link key={index} href={`/view_webnovels?id=${webnovel.id}`} className={
                        `break-words rounded text-md hover:text-pink-600 
                        ${params.get('id') == webnovel.id.toString()? "font-bold": ""}`}>
                    <OtherTranslateComponent key={key} content={webnovel.title} 
                        elementId={webnovel.id.toString()} elementType='webnovel' elementSubtype="title"/>
                    </Link>
                ))}
            </div>
        </div>
    )
}

export default AuthorAndWebnovelsAsideComponent