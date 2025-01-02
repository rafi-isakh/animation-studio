'use client'
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { CornerDownRight, Plus } from "lucide-react";

const StarsTransactionComponent = () => {
    const { dictionary, language } = useLanguage();

    return (

        <div className="flex flex-col md:max-w-screen-lg w-full mx-auto">
            <div className="flex flex-col w-full gap-2">
                <h1 className="text-2xl font-extrabold text-center">
                    {/* 충전 내역 */}
                    {phrase(dictionary, "starsTransaction", language)}
                </h1>

                {/* 사용내역 ( 총 건수 / 사용 건수 / 잔여 건수 ) */}
                <div className="flex flex-col w-full gap-2 bg-gray-100 rounded-xl px-5 py-5 mt-5">
                {/* top padding 5 */}
                { language === 'ko' && <p className="text-sm text-gray-500 text-left">현재 보유중인 투니즈 별 <span className="font-bold text-[#DE2B74]">1000</span> 개 </p> }
                { language === 'ko' && <div className="flex flex-row items-center gap-2"> <CornerDownRight size={10} />  <p className="text-sm text-gray-500 text-left">이벤트 투니즈 별 <span className="font-bold text-[#DE2B74]">1000</span> 개 </p> </div> }
                { language === 'en' && <p className="text-sm text-gray-500 text-left ">You have <span className="font-bold text-[#DE2B74]">1000</span> stars </p> }
                { language === 'en' && <div className="flex flex-row items-center gap-2"> <CornerDownRight size={10} />  <p className="text-sm text-gray-500 text-left">Event <span className="font-bold text-[#DE2B74]">1000</span> stars </p> </div> }

                </div>

                <div className="flex flex-col w-full">
                    <ul className="flex flex-col w-full gap-2 p-5 ">
                        <li className="flex flex-col w-full gap-2 pb-5 border-b border-gray-200 ">
                            <div className="flex flex-row items-center gap-2"> <Plus size={16} /> <p>  1000</p> </div>
                            <p>12/25 크리스마스 보너스 투니즈 별</p>
                            <div className="flex flex-row justify-between items-center">
                                <p className="text-sm text-gray-500">2025-12-20</p>
                                <p className="text-sm text-gray-500">보너스 지급</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default StarsTransactionComponent;

