"use client"
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { Button } from "@mui/material"
import Link from "next/link";
import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import Image from "next/image"

export default function Footer() {
    const { dictionary, language } = useLanguage();
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className='my-16 p-2 text-xs text-gray-500 w-full flex flex-col items-center justify-center mx-auto border-t'>
            <div className="flex flex-col md:flex-row w-full md:max-w-screen-xl md:px-4 justify-between items-center mx-auto mt-6">
                <div>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`flex ${language === 'ko' ? '' : 'ml-9 md:ml-0'} flex items-center mt-5 text-gray-500 hover:text-gray-700`}
                    >
                        {isExpanded ? (
                            <ChevronUpIcon className={`flex ${language === 'ko' ? '' : 'ml-[47px] md:ml-1'} w-3 h-3 mr-1`} />
                        ) : (
                            <ChevronDownIcon className={`flex ${language === 'ko' ? '' : 'ml-1 md:ml-1'} w-3 h-3 mr-1`}  />
                        )}
                        {isExpanded ? (
                            <p className="text-gray-500 hover:text-gray-700 text-[10px] font-extrabold">
                                {language == 'ko' ? '사업자 정보' : 'Business Info'}
                            </p>
                        ) : (
                            <p className="text-gray-500 hover:text-gray-700 text-[10px] font-extrabold">
                                {language == 'ko' ? '사업자 정보' : 'Business Info'}
                            </p>
                        )}
                    </button>
                    {isExpanded && (
                        <div className="mb-2 text-[10px]">
                            <p>
                                {language == 'ko' ? <>주식회사 스텔라앤</> : <>Stelland International Inc.</>}
                            </p>
                            <p className="">
                                {language == 'ko' ? <>사업자등록번호 221-88-02281</> : <></>}
                            </p>
                            <p>
                                {language == 'ko' ? <>통신판매업신고번호 2024-서울강남-07231호</> : <></>}
                            </p>
                            <p>
                                {language == 'ko' ? <>대표자 강서연</> : <>CEO Seoyeon Kang</>}
                            </p>
                            <p>
                                {language == 'ko' ? <>서울특별시 강남구 테헤란로 79길 6 512호</> : <>1111B S Governors Ave #23452 Dover, DE 19904, USA</>}
                            </p>
                            <p>
                                {language == 'ko' ? <>1111B S Governors Ave #23452 Dover, DE 19904, USA</> : <></>}
                            </p>
                            <p>
                                hello@stelland.io
                            </p>
                            <p>
                                (+82) 02-6952-7933
                            </p>
                        </div>
                    )}

                    <div className={`flex ${language === 'ko' ? 'flex-row' : 'md:flex-row flex-col'} md:gap-4 gap-[10px] mb-10 mt-2`}>
                        <p className="text-center text-[10px] font-extrabold text-gray-400 hover:text-[#DB2777]">
                            <Link href="/terms">
                            {/* 이용약관 : Terms of use */}
                            {phrase(dictionary, "terms", language)}
                            </Link>
                        </p>
                        <p className="text-center text-[10px]  text-gray-400 hover:text-[#DB2777]">
                            <Link href="/terms/privacy">
                            {/* 개인정보 처리방침 : Privacy policy */}
                            {phrase(dictionary, "privacy", language)}
                            </Link>
                        </p>
                        <p className="text-center text-[10px]  text-gray-400 hover:text-[#DB2777]">
                            <Link href="/terms/youth">
                            {/* 청소년 보호 정책 : Youth protection policy */}
                            {phrase(dictionary, "youth_terms", language)}
                            </Link>
                        </p>
                        <p className="text-center text-[10px]  text-gray-400 hover:text-[#DB2777]">
                            <Link href="/contact">
                            {/* 고객지원 */}
                            {phrase(dictionary, "contact", language)}
                            </Link>
                        </p>
                        <p className="text-center text-[10px] text-gray-400">
                            © Stella& Inc.
                        </p>
                    </div>
                    <div className="flex flex-row items-center justify-center md:justify-start md:mb-3 mb-10 mt-5">
                        <Image
                            src="/images/N_logo.svg"
                            alt="Toonyz Logo"
                            width={0}
                            height={0}
                            sizes="100vh"
                            style={{
                                height: '20px',
                                width: '20px',
                                padding: '2px',
                                justifyContent: 'center',
                                alignSelf: 'center',
                                borderRadius: '25%',
                                border: '1px solid #eee'
                            }}
                        />
                        {/* <span className="text-[10px] font-extrabold text-gray-400 self-center justify-center ml-2"> Toonyz.com </span> */}
                        <span className="text-[10px] font-extrabold text-gray-400 self-center justify-center ml-2 mr-2"> made with love by Toonyz </span>
                    </div>
                </div>

                {/* Toonyz social media channel */}
                <div className="sns order-first md:order-last">
                    <ul className="flex flex-row gap-3">
                        <Link href="https://www.instagram.com/stelland_official/">
                            <i className="fab fa-instagram cursor-pointer
                             text-white rounded-full px-[0.6rem] py-2
                              hover:bg-[#DB2777] bg-gray-300 text-[16px] 
                              transition ease-in-out delay-150
                             dark:text-gray-100 dark:bg-gray-500 dark:hover:opacity-75
                            "></i>
                        </Link>
                        <Link href="#">
                            <i className="fab fa-youtube cursor-pointer
                             text-white rounded-full px-2 py-2
                              hover:bg-[#DB2777] bg-gray-300 text-[15px] 
                              transition ease-in-out delay-150
                             dark:text-gray-100 dark:bg-gray-500 dark:hover:opacity-75
                             "></i>
                        </Link>
                        <Link href="https://x.com/stelland_hello">
                            <i className="fab fa-x cursor-pointer
                             text-white rounded-full px-[0.7rem] py-2
                              hover:bg-[#DB2777] bg-gray-300 text-[16px] 
                              transition ease-in-out delay-150
                               dark:text-gray-100 dark:bg-gray-500 dark:hover:opacity-75
                             "></i>
                        </Link>
                        <Link href="https://stelland.medium.com">
                            <i className="fa-brands fa-medium cursor-pointer
                             text-white rounded-full px-[0.44rem] py-2
                              hover:bg-[#DB2777] bg-gray-300 text-[16px] 
                              transition ease-in-out delay-150
                              dark:text-gray-100 dark:bg-gray-500 dark:hover:opacity-75
                              "></i>
                        </Link>
                        <Link href="https://www.linkedin.com/company/stellandio/">
                            <i className="fa-brands fa-linkedin-in cursor-pointer
                             text-white rounded-full px-[0.6rem] py-2
                              hover:bg-[#DB2777] bg-gray-300 text-[16px] 
                              transition ease-in-out delay-150
                             dark:text-gray-100 dark:bg-gray-500 dark:hover:opacity-75
                            "></i>
                        </Link>
                    </ul>
                </div>
            </div>
        </div>
    )
}