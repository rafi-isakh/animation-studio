"use client"
import { useLanguage } from "@/contexts/LanguageContext";
import { getCountryFromIP } from "@/utils/phrases";
import { useEffect } from "react";

export default function LanguageSetter({ userCountry }: { userCountry: string }) {
    const { language, setLanguage } = useLanguage();

    useEffect(() => {
        console.log('userCountry', userCountry);
        if (userCountry === 'KR') {
            setLanguage('ko');
        } else if (userCountry === 'US') {
            setLanguage('en');
        } else if (userCountry === 'JP') {
            console.log('userCountry is JP');
            setLanguage('ja');
        } else {
            setLanguage('en');
        }
    }, [userCountry]);

    useEffect(() => {
        console.log('language', language);
    }, [language]);

    return null;
}