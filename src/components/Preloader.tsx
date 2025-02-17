'use client'
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Modal, Box, Button } from "@mui/material";
import Image from "next/image";
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/components/Types';
import { phrase } from '@/utils/phrases';
import { langPairList } from '@/utils/phrases';

import styles from '@/styles/Header.module.css';
import Link from 'next/link';

const words = ["Hello", "Bonjour", "Ciao", "Olà", "やあ", "Hallå", "Guten tag", "你好", "Hallo", "สวัสดี", "مرحبًا", "Xin chào", "안녕하세요."]

const preloaderModalstyle = {
    position: 'fixed' as 'fixed', // Use fixed positioning to cover the entire screen
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    bgcolor: 'rgba(0, 0, 0, 0.9)', // Black
};

export const opacity = {
    initial: {
        opacity: 0
    },
    enter: {
        opacity: 0.75,
        transition: { duration: 1, delay: 0.2 }
    },
}

export default function Preloader() {
    const [index, setIndex] = useState(0);
    const [showModal, setShowModal] = useState(true);
    const languageMenuRef = useRef<HTMLDivElement>(null);
    const { dictionary, language, setLanguage } = useLanguage();
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
    const languageDropdownRef = useRef<HTMLDivElement>(null);
    const [highlightLanguage, setHighlightLanguage] = useState<Record<Language, boolean>>(
        Object.fromEntries(langPairList.map(lang => [lang.code, false])) as Record<Language, boolean>
    );
    const [currentLanguage, setCurrentLanguage] = useState(langPairList.find(lang => lang.code === language)?.name || 'Select Language');
    const firstLoad = useRef(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let timeout: NodeJS.Timeout;

        if (index < words.length - 1) {
            timeout = setTimeout(() => {
                setIndex(index + 1);
            }, index === 0 ? 1000 : 150);
        } else {
            timeout = setTimeout(() => {
                setIndex(0);
            }, 3000);
        }

        return () => clearTimeout(timeout);
    }, [index]);

    useEffect(() => {
        for (const lang of langPairList) {
            setHighlightLanguage(prev => ({ ...prev, [lang.code as Language]: false }));
        }
        setHighlightLanguage(prev => ({ ...prev, [language]: true }));
    }, [language])

    const handleLanguageChange = (language: Language) => {
        setLanguage(language);
        setIsLanguageDropdownOpen(false);
        setShowModal(false)
        document.cookie = "didSelectLanguage=true; path=/; max-age=31536000" // Set cookie for 1 year
    }

    const toggleLanguageDropdown = () => {
        setIsLanguageDropdownOpen(!isLanguageDropdownOpen);
        setIsUserDropdownOpen(false);
    }

    return (
        <Modal
            open={showModal}
        >
            <Box sx={preloaderModalstyle}>
                <div className='rounded-xl border border-black md:border-black w-[500px] h-screen
                 bg-black flex flex-col md:justify-center justify-center space-y-4 md:space-y-4 items-center overflow-y-auto'>
                    <Image
                        src="/stelli/stelli_6.png"
                        alt="Toonyz Logo"
                        width={200}
                        height={200}
                        sizes="100vh"
                        style={{
                            zIndex: 50,
                            marginTop: '15px',
                            justifyContent: 'center',
                            alignSelf: 'center',
                            borderRadius: '25%',
                        }}
                    />

                    <motion.p variants={opacity} initial="initial" animate="enter" className='mb-10 text-white dark:text-white text-[2rem]'>
                        {words[index]}
                    </motion.p>

                    <p className='text-white dark:text-white'>
                        {language === 'ko' ? '언어를 선택해 주세요.' : 'Select your language'}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                    {langPairList.map((langPair, index) => (
                        <button
                            id={`li-${langPair.code}`}
                            key={index}
                            className={`px-4 py-1 w-28 rounded-md border border-gray-400
                            text-white focus:border-[#DB2777] md:px-4 md:py-3 
                            md:hover:border-[#DB2777] md:hover:bg-transparent
                            dark:border-gray-400 hover:bg-transparent
                            hover:text-gray-white flex flex-row items-center justify-center
                            ${currentLanguage === langPair.code ? 'text-[#DB2777] border-[#DB2777]' : 'text-white dark:text-white'}
                            `}
                            >
                            <Link
                                href="#"
                                onClick={() => handleLanguageChange(langPair.code as Language)}
                                className={`
                                dark:hover:text-[#DB2777] hover:text-[#DB2777] flex flex-row justify-center items-center
                                ${currentLanguage === langPair.code ? 'text-[#DB2777]' : 'text-white dark:text-white'}
                            `}
                            >
                                {langPair.name}
                            </Link>
                        </button>
                    ))}
                    </div>
                    {/* <p className="text-center text-[10px] text-white dark:text-white "> Your Favorite Story Universe, Between Us, Toonyz </p> */}
                </div>

                {/* </div> */}
            </Box>

        </Modal>
    )

}
