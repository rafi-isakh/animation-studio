"use client"
import { useLanguage } from "@/contexts/LanguageContext";
import { getCountryFromIP } from "@/utils/phrases";
import { useEffect } from "react";

export default function LanguageSetter() {
    const { setLanguage } = useLanguage();

    useEffect(() => {
        const setUserLanguage = async () => {
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
        setUserLanguage();
    }, []);

    return null;
}