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

const style = {
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
            <Box sx={style}>
                <div className='rounded-xl border border-black md:border-black w-[500px] h-[600px] bg-black flex flex-col md:justify-center space-y-0 md:space-y-8 items-center'>

                    <Image
                        src="/images/N_logo.svg"
                        alt="Toonyz Logo"
                        width={0}
                        height={0}
                        sizes="100vh"
                        style={{
                            zIndex: 50,
                            marginTop: '15px',
                            height: '35px',
                            width: '35px',
                            padding: '2px',
                            justifyContent: 'center',
                            alignSelf: 'center',
                            borderRadius: '25%',
                            // border: '1px solid #eee'  
                        }}
                    />

                    <motion.p variants={opacity} initial="initial" animate="enter" className='mb-10 text-white dark:text-white text-[2rem]'>
                        {words[index]}
                    </motion.p>

                    <p className='text-white dark:text-white'>
                        언어를 선택해 주세요.
                    </p>

                    {/*Language menu*/}
                    <li className="py-2 relative list-none">
                        <div ref={languageMenuRef}>
                            <button id="dropdownNavbarLanguageLink" onClick={toggleLanguageDropdown} className="px-4 py-3 w-36 rounded-md border border-gray-400 flex items-center justify-start md:justify-between text-white focus:border-pink-600 md:px-4 md:py-3 md:border md:hover:border-pink-600 md:hover:bg-transparent dark:focus:text-black dark:border-gray-400 dark:hover:bg-gray-400 md:dark:hover:bg-transparent">
                                <div className='flex justify-between w-full'>
                                    <div className='flex'>
                                        <i className="fa-solid fa-globe self-center text-white dark:text-white"></i>
                                        <p className='ml-2'>{currentLanguage && currentLanguage}</p>
                                    </div>
                                    {/* <p className='ml-2 md:hidden'>{phrase(dictionary, "language", language)}</p> */}
                                    <div className='self-center'>
                                        <svg className="w-2.5 h-2.5 ms-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                                        </svg>
                                    </div>
                                </div>
                            </button>
                        </div>
                        {isLanguageDropdownOpen && (
                            <div id="language-dropdown" ref={languageDropdownRef} className={`${styles.item} mt-2 font-normal bg-black divide-y divide-gray-100 border-gray-400 dark:divide-gray-600`}>
                                <ul className="py-2 text-sm border rounded-md border-gray-400 w-36 text-gray-100" aria-labelledby="dropdownLargeButton">
                                    {langPairList.map((langPair, index) => (
                                        <li id={`li-${langPair.code}`} key={index} className={`hover:text-gray-600 ${highlightLanguage[langPair.code as Language] ? 'text-pink-500' : ''}`}>
                                            <Link href="#" onClick={() => handleLanguageChange(langPair.code as Language)} className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-black">
                                                {langPair.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </li>
                    <p className="text-center text-[10px] text-white dark:text-white "> Your Favorite Story Universe, Between Us, Toonyz </p>
                </div>

                {/* </div> */}
            </Box>

        </Modal>
    )

}
