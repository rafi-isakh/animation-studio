"use client"
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";

export default function DictionaryPhrase({ phraseVar }: { phraseVar: string }) {
    const { language, dictionary } = useLanguage();
    const translatedPhrase = phrase(dictionary, phraseVar, language)

    return <>{translatedPhrase}</>
}