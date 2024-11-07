import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import Link from "next/link";
import { MdStars } from "react-icons/md";


export default function ChargeStarsTemporary() {
    const { dictionary, language } = useLanguage();
    return (
        <Link href="/stars" className="flex items-center space-x-2 justify-start">
            <span>{phrase(dictionary, "stars", language)}</span>
        </Link>
    );
}