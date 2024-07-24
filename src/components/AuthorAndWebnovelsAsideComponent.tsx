import { Webnovel } from "@/components/Types"
import Link from "next/link"
import styles from "@/styles/KoreanText.module.css"
import { phrase } from '@/utils/phrases'
import { useLanguage } from "@/contexts/LanguageContext"

const AuthorAndWebnovelsAsideComponent = ({ webnovels, nickname }:
    { webnovels: Webnovel[], nickname: string | null }) => {
    const {language, dictionary} = useLanguage();

    return (
        <div className="flex flex-col space-y-4 mr-10">
            <p id="nickname" className={`text-2xl ${styles.korean}`}>{nickname}{phrase(dictionary, "whoseWebnovels", language)}</p>
            <div className="flex flex-col space-y-4">
                {webnovels.map((webnovel, index) => (
                    <Link key={index} href={`/view_webnovels?id=${webnovel.id}`} className="break-words rounded text-md font-bold hover:text-pink-600">{webnovel.title}</Link>
                ))}
            </div>
        </div>
    )
}

export default AuthorAndWebnovelsAsideComponent