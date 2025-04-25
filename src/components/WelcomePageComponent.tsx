'use client'
import { useState, useEffect } from 'react';
import { User } from '@/components/Types';
import { Button } from '@/components/shadcnUI/Button';
import StarIcon from '@mui/icons-material/Star';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@/contexts/UserContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import { MdStars } from 'react-icons/md';
import useWindowSize from 'react-use/lib/useWindowSize'
import Confetti from 'react-confetti'
import { FolderHeart } from 'lucide-react';

export default function WelcomePageComponent() {
    const { language, dictionary } = useLanguage();
    const { nickname } = useUser();
    const { width, height } = useWindowSize()
    const [confettiWidth, setConfettiWidth] = useState(width);
    const [confettiHeight, setConfettiHeight] = useState(height);

    const ToonyzLogo = ({ className }: { className?: string }) => {
        return <Image src="/images/N_logo.svg" alt="Toonyz Logo" width={12} height={12} className={`${className}`} />
    }

    useEffect(() => {
        setConfettiWidth(width * 1.0001)
        setConfettiHeight(height * 1.0001)
    }, [width, height])

    return <div className="md:max-w-screen-lg w-full m-auto flex flex-col items-center justify-center h-screen md:mt-[-96px] mt-[-80px]">
        <div className='flex justify-center items-center w-full'>
            <Confetti
                width={confettiWidth}
                height={confettiHeight}
                recycle={false}
                className='mx-auto'
            />
        </div>
        <span className="relative flex h-28 w-28">
            {/* <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFE2DC] opacity-75"></span> */}
            <span className="relative inline-flex rounded-full h-28 w-28 border-[#FFE2DC]">
                <Image src="/images/stelli_head.svg" alt="Stelli image" width={100} height={100} className='self-center mx-auto' />
            </span>
        </span>

        <div className='flex flex-col items-center justify-center gap-2'>
            <h1 className='text-2xl font-bold'>
                {nickname}
                {language == 'ko' ? '님' : ''}
            </h1>
            <p className='text-lg text-gray-800 dark:text-white'>{phrase(dictionary, 'welcome_to_toonyz', language)}</p>
            <p className='text-lg text-gray-800 dark:text-white'>{phrase(dictionary, 'complementary_stars_added', language)}</p>
            <p className='text-lg text-gray-800 dark:text-white'>{phrase(dictionary, 'complementary_stars_added_subtitle', language)}</p>
        </div>

        <div className='flex flex-col items-center justify-center gap-3 mt-6'>
            <Button variant="outline" className='w-full'>
                <Link href="/stars" className='flex items-center justify-center w-full'>
                    <div className="w-6 flex justify-center">
                        <StarIcon className="w-8 h-8 text-[#DB2879]" />
                    </div>
                    <span className='ml-2 '>{phrase(dictionary, 'signedup_first_time_user', language)}</span>
                </Link>
            </Button>
            <Button variant="outline" className='w-full'>
                <Link href="/" className='flex w-full '>
                    <div className="w-6 flex justify-center">
                        <ToonyzLogo className='' />
                    </div>
                    <span className='ml-5 text-center self-center '>{phrase(dictionary, 'check_out_toonyz_works', language)}</span>
                </Link>
            </Button>
            <Button variant="outline" className='w-full'>
                <Link href="/writing-class" className='flex items-center justify-center w-full '>
                    <div className='w-6 flex justify-center'>
                        <FolderHeart className="w-8 h-8 text-[#DB2879]" />
                    </div>
                    <span className='ml-2 text-right'> {phrase(dictionary, 'download_free_writing_guide', language)}</span>
                </Link>
            </Button>
        </div>
    </div>
}
