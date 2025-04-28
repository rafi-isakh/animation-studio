"use client"
import { useLanguage } from "@/contexts/LanguageContext";
import { getCountryFromIP } from "@/utils/phrases";
import { useEffect } from "react";
import { Language } from "./Types";

export default function LanguageSetter() {
    const { language, setLanguage, setLanguageOverride } = useLanguage();

    useEffect(() => {
        const setLanguageFromCountry = async () => {
            if (localStorage.getItem('language_override')) {
                setLanguageOverride(localStorage.getItem('language_override')! as Language);
                return;
            }
            const userCountry = await getCountryFromIP();
            if (userCountry === 'KR') {
                setLanguage('ko');
            } else if (userCountry === 'US') {
                setLanguage('en');
            } else {
                setLanguage('en');
            }
        }
        setLanguageFromCountry();
    }, []);

    return null;
}