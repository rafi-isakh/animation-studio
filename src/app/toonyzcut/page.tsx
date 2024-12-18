'use client'
import Image from 'next/image';
import { useState } from 'react';

export default function Toonyzcut() {

    const [logoWidth, setLogoWidth] = useState(141);
    const [logoHeight, setLogoHeight] = useState(32);

    return (
        <div className='md:max-w-screen-lg w-full mx-auto'>
          
            <div 
             className='flex flex-col h-full bg-gray-300'
             style={{
                backgroundImage: `url('/images/toonyzcut_header.png')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
                }}
                >
                
                <div className='px-14 py-14'>
                <div className='flex flex-row items-center gap-2'>
                        <Image 
                        src='/toonyzLogo.png' 
                        alt='toonyzLogo' 
                        width={logoWidth} 
                        height={logoHeight} 
                        className=''
                         />
                    <p className='text-[2.3rem] font-extrabold text-white'>Cut</p>
                </div>

                <div className='flex flex-col items-center gap-2'>
                    <p className='text-[1.2rem] font-normal w-full w-[350px] text-white'>
                        현실을 넘어, 여러분의 이야기로 크리에이터와 영상 제작사를 연결해 드려요. <br/>
                        글로벌 스토리텔링, 영상과 웹툰의 창조적 만남을 창조해 드립니다. <br/>
                        크리에이터님들의 소중한 작품이 영상화 될 수 있는 기회를 잡으세요. <br/>
                        웹툰과 영상의 완벽한 조화, 당신의 이야기를 빛내 보세요.
                    </p>

                    <p className='text-md font-normal w-full w-[350px] text-white'>
                      Toonyz Cut Is An Open Call for Innovative Production Proposals
                    </p>
                </div>
              </div>

            </div>
          
          
        </div>
    )
}