import { MdVideoLibrary } from "react-icons/md";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";

export default function ViewVideos() {
    const { dictionary, language } = useLanguage();
    return (
        <Link href="/videos" className="flex items-center space-x-2">
            <MdVideoLibrary />
            <span>{phrase(dictionary, "curriculum", language)}</span>
        </Link>
    );
}