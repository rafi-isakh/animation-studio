import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import Link from "next/link";
import { MdStars } from "react-icons/md";


export default function ChargePointsTemporary() {
    const { dictionary, language } = useLanguage();
    return (
        <Link href="/points" className="flex items-center space-x-2 justify-start">
            <MdStars />
            <span>{phrase(dictionary, "points", language)}</span>
        </Link>
    );
}