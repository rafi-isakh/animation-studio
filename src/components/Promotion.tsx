"use client"
import React, {useRef} from 'react';
import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from 'next/image';
import Link from 'next/link';

const Promotion: React.FC = () => {
    const scrollRef = useRef<HTMLDivElement>(null);
    
    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 200 * (direction === 'left' ? -1 : 1);
            scrollRef.current.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        }
    };

  
   return (
    <>
     
     <div className='flex flex-col relative max-w-screen-xl group px-4 justify-center items-center mx-auto md:mb-6 mb-6'>
                {/* relative max-w-screen-xl mx-auto px-4 group  */}

                  {/* Left Arrow */}
               <button 
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-x-1/2"
                 >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
               </button>

              <h1 className='font-extrabold text-xl text-left justify-start self-start mt-10 mb-5'>
                 진행중인 이벤트
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
                        <p className='text-md text-center font-bold'> 댓글 이벤트 - 왕 중의 왕</p>
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
                         <p className='text-md text-center font-bold'> 선착순 포인트 100% 증정!</p>
                         <p className='text-md text-center'> 이벤트 참여하기</p>
                       </div>  

                       <div className='flex flex-col gap-2'>
                        <Image 
                        src='/promotion/event_banner_1_KR.svg' 
                        alt='Toonyz promotion banner' 
                        width={450} 
                        height={186} 
                        sizes='100vw'
                        />
                         <p className='text-md text-center font-bold'> 작가님 응원하고 선물 받기!</p>
                         <p className='text-md text-center'> 이벤트 참여하기</p>
                        </div>
                   </div>

              {/* Right Arrow */}
              <button 
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-1/2"
               >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>

            </div>
    </>
  );
};

export default Promotion;



