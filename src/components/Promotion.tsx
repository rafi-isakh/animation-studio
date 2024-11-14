"use client"
import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from "lucide-react"
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';
import { scroll } from '@/utils/scroll'
import PromotionBannerComponent from '@/components/PromotionBannerComponent'

const Promotion: React.FC = () => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const { dictionary, language } = useLanguage();
  
    return (
    <>
     <div className='flex flex-col relative max-w-screen-xl group px-4 justify-center items-center mx-auto md:mb-6'>
                {/* relative max-w-screen-xl mx-auto px-4 group  */}
                  {/* Left Arrow */}
               <button 
                onClick={() => scroll('left', scrollRef)}
                className="absolute md:left-0 left-8 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full md:p-2 p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-x-1/2 hidden md:block"
                 >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
               </button>

              <h1 className='font-extrabold text-xl text-left justify-start self-start mt-10 mb-5'>
                 {/* 진행중인 이벤트 */}
                 {phrase(dictionary, "currentPromotion", language)}

                </h1>
                <div className="flex flex-row gap-5">
                      <div className='flex flex-col gap-2'>
                        <Image 
                        src='/promotion/event_banner_1_KR.svg' 
                        alt='Toonyz promotion banner' 
                        width={450} 
                        height={142} 
                        sizes='100vw'
                        />
                        <p className='text-md text-center'> 댓글 이벤트 - 왕중의 왕</p>
                        <p className='text-md text-center'> 이벤트 참여하기</p>
                      </div>

                      <div className='flex flex-col gap-2'>
                        <Image 
                        src='/promotion/event_banner_2_KR.svg' 
                        alt='Toonyz promotion banner' 
                        width={450} 
                        height={186} 
                        sizes='100vw'
                        />
                         <p className='text-md text-center'> 선착순 포인트 100% 증정!</p>
                         <p className='text-md text-center'> 이벤트 참여하기</p>
                       </div>  

                       <div className='flex flex-col gap-2'>
                        <Image 
                        src='/promotion/event_banner_3_KR.svg' 
                        alt='Toonyz promotion banner' 
                        width={450} 
                        height={186} 
                        sizes='100vw'
                        />
                         <p className='text-md text-center'> 작가님 응원하고 선물 받기!</p>
                         <p className='text-md text-center'> 이벤트 참여하기</p>
                        </div>
                   </div>

              {/* Right Arrow */}
              <button 
                onClick={() => scroll('right', scrollRef)}
                className="absolute md:right-0 right-8 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full md:p-2 p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-1/2 "
               >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>

            </div>

            <div className='flex flex-col justify-center items-center content-center'>
              <PromotionBannerComponent />
           </div>
    </>
  );
};

export default Promotion;



