'use client'

import DictionaryPhrase from '@/components/DictionaryPhrase';
import Image from 'next/image';
import useMediaQuery from '@mui/material/useMediaQuery';
export default function ToonyzCutLayout({ children }: { children: React.ReactNode }) {
    const isMobile = useMediaQuery('(max-width:360px)');

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
                            src='/toonyz_logo_pink.svg' 
                            alt='toonyzLogo' 
                            width={isMobile ? '100' : '183'} 
                            height={isMobile ? '32' : '32'} 
                        />
                        <p className='md:text-[4.3rem] text-[2.3rem] font-extrabold text-white'>Cut</p>
                    </div>

                    <div className='flex flex-col items-center gap-2'>
                        <div className='text-[1rem] font-normal w-full text-white break-keep'>
                            <DictionaryPhrase phraseVar='toonyzcut_phrase_1' />
                        </div>
                        <div className='text-[1rem] font-normal w-full text-white break-keep'>
                            <DictionaryPhrase phraseVar='toonyzcut_phrase_2' />
                        </div>
                        <p className='text-[1rem] font-normal w-full text-white'>
                            Toonyz Cut Is An Open Call for Innovative Production Proposals
                        </p>
                    </div>
                </div>
            </div>
            {children}
        </div>
    );
}
