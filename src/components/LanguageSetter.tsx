"use client"
import { useLanguage } from "@/contexts/LanguageContext";
import { getCountryFromIP } from "@/utils/phrases";
import { useEffect } from "react";

export default function LanguageSetter() {
    const { language, setLanguage } = useLanguage();

    useEffect(() => {
        const setLanguageFromCountry = async () => {
        const userCountry = await getCountryFromIP();
        if (userCountry === 'KR') {
            setLanguage('ko');
        } else if (userCountry === 'US') {
            setLanguage('en');
        } else if (userCountry === 'JP') {
            setLanguage('ja');
        } else {
                setLanguage('en');
            }
        }
        setLanguageFromCountry();
    }, []);

    return null;
}