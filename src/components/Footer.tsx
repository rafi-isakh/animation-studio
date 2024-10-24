"use client"
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@mui/material"
import Link from "next/link";
import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import Image from "next/image"

export default function Footer() {
    const { dictionary, language } = useLanguage();
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className='mt-16 text-xs text-gray-500 min-w-screen flex flex-col items-center justify-center mx-auto p-2 border-t'>
            <div>
                {language == 'ko' ? (<Link href="/terms">이용약관</Link>) 
                                  : <></>
                }
            </div>
            <div className="flex flex-col justify-center items-center">
                Copyright © 
                {language == 'ko' ? (<p className="text-center">주식회사 스텔라앤 (Stella& Inc.) <br/></p>)
                                  : (<p className="text-center">Stelland International, Inc.</p> )
                } 
                2024 All rights reserved.<br/>
            </div>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center mt-2 text-gray-500 hover:text-gray-700"
            >
                {isExpanded ? (
                    <ChevronUpIcon className="w-4 h-4 mr-1" />
                ) : (
                    <ChevronDownIcon className="w-4 h-4 mr-1" />
                )}
                {isExpanded ? "Hide Details" : "Show Details"}
            </button>
            {isExpanded && (
                <>
                    <div>
                        {language == 'ko'? <>사업자등록번호 221-88-02281</>:<></>}
                    </div>
                    <div>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center mt-5 text-gray-500 hover:text-gray-700"
                    >
                        {isExpanded ? (
                            <ChevronUpIcon className="w-3 h-3 mr-1" />
                        ) : (
                            <ChevronDownIcon className="w-3 h-3 mr-1" />
                        )}
                        {isExpanded ? (
                                    <p className="text-gray-500 hover:text-gray-700 text-[10px] font-extrabold"> 
                                    {language == 'ko'? '사업자 정보': 'Business Info'}
                                    </p>
                                ) : (
                                    <p className="text-gray-500 hover:text-gray-700 text-[10px] font-extrabold"> 
                                    {language == 'ko'? '사업자 정보': 'Business Info'}
                                    </p>
                        )}

                    </button>
                    {isExpanded && (
                        <div className="mb-2 text-[10px]">
                            <p className="">
                                {language == 'ko'? <>사업자등록번호 221-88-02281</>:<></>}
                            </p>
                            <p>
                                {language == 'ko'? <>대표자 강서연</>:<></>}
                            </p>
                            <p>
                                {language == 'ko'? <>서울특별시 강남구 테헤란로 79길 6</>:<>1111B S Governors Ave #23452 Dover, DE 19904, USA</>}
                            </p>
                            <p>
                                {language == 'ko'? <>hello@stelland.com 010-7323-5431</>:<></>}
                            </p>
                        </div>
                    )}

                    <div className="flex flex-row gap-4 mb-10 mt-2">
                    <p className="text-center text-[10px] font-extrabold text-gray-400 hover:text-pink-600">
                        <Link href="/terms">이용약관</Link> 
                    </p>
                    <p className="text-center text-[10px]  text-gray-400 hover:text-pink-600"> 
                        <Link href="/terms/privacy">개인정보 처리방침</Link> 
                    </p>
                    <p className="text-center text-[10px] text-gray-400"> 
                    © Stella& Inc.
                    </p>
                    </div>

                    
                    <div className="flex flex-row items-center justify-center md:justify-start md:mb-3 mb-10 mt-5">
                  
                            <Image
                            src="/N_Logo.png"
                            alt="Toonyz Logo"
                            width={0}
                            height={0}
                            sizes="100vh"
                            style={{ 
                                height: '20px', 
                                width: '20px', 
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


                <div className="sns order-first md:order-last">
                   <ul className="flex flex-row gap-3">
                        <Link href="https://www.instagram.com/stelland.official/">
                         <i className="fab fa-instagram cursor-pointer text-white rounded-full px-[0.6rem] py-2 hover:bg-pink-600 bg-gray-300 text-[16px] transition ease-in-out delay-150"></i>
                        </Link>
                        <Link href="#">
                        <i className="fab fa-youtube cursor-pointer text-white rounded-full px-2 py-2 hover:bg-pink-600 bg-gray-300 text-[15px] transition ease-in-out delay-150"></i>
                        </Link>
                        <Link href="https://x.com/stelland_hello">
                        <i className="fab fa-x cursor-pointer text-white rounded-full px-[0.7rem] py-2 hover:bg-pink-600 bg-gray-300 text-[16px] transition ease-in-out delay-150"></i>
                        </Link>
                        <Link href="https://stelland.medium.com">
                        <i className="fa-brands fa-medium cursor-pointer text-white rounded-full px-[0.44rem] py-2 hover:bg-pink-600 bg-gray-300 text-[16px] transition ease-in-out delay-150"></i>
                        </Link>
                        <Link href="https://www.linkedin.com/company/stellandio/">
                        <i className="fa-brands fa-linkedin-in cursor-pointer text-white rounded-full px-[0.6rem] py-2 hover:bg-pink-600 bg-gray-300 text-[16px] transition ease-in-out delay-150"></i>
                        </Link>
                   </ul>
                </div>


                
            </div>
        </div>
    )
}