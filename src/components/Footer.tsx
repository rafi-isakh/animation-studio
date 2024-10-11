"use client"
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";

export default function Footer() {
    const { dictionary, language } = useLanguage();
    return (
        <div className='mt-16 text-xs text-gray-500 min-w-screen flex flex-col items-center justify-center mx-auto p-2'>
            <div>
                {language == 'ko'? <Link href="/terms">이용약관</Link>:<></>}
            </div>
            <div>
                Copyright © {language == 'ko'? <>주식회사 스텔라앤 (Stella& Inc.)</>:<>Stelland International, Inc.</>} 2024 All rights reserved.<br/>
            </div>
            <div>
                {language == 'ko'? <>사업자등록번호 221-88-02281</>:<></>}
            </div>
            <div>
                {language == 'ko'? <>대표자 강서연</>:<></>}
            </div>
            <div>
                {language == 'ko'? <>서울특별시 강남구 테헤란로 79길 6</>:<>1111B S Governors Ave #23452 Dover, DE 19904, USA</>}
            </div>
            <div>
                {language == 'ko'? <>hello@stelland.com 010-7323-5431</>:<></>}
            </div>
        </div>
    )
}