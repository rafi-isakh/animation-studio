import React, { useCallback, useState, useEffect } from 'react';
import Link from 'next/link';
import { Info } from 'lucide-react';
import { initialWebtoonContents } from '@/utils/curriculum';
import { getImageUrl, getVideoUrl } from '@/utils/urls';
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';

const Billboard = () => {
    const [isMobile, setIsMobile] = useState(false);
    const { language, dictionary } = useLanguage();

    const handleResize = () => {
        setIsMobile(window.innerWidth < 768); // Adjust the width as needed
    };

    useEffect(() => {
        handleResize(); // Check on mount
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const webtoonContents = initialWebtoonContents.map(content => ({
        ...content,
        file_src: getVideoUrl(content.file_src)
    }));

  return (
    <div className="relative h-[56.25vw] -top-10">
      <video 
      poster='/curriculum/video_heroImage.png' 
      className="w-full h-[56.25vw] object-cover brightness-[60%] transition duration-500" 
      autoPlay={!isMobile} muted loop src={webtoonContents[0]?.file_src}
      >
      </video>
      <div className="absolute top-[30%] md:top-[40%] ml-4 md:ml-16">
        <p className="text-white dark:text-white text-1xl md:text-5xl h-full w-full lg:text-2xl font-bold drop-shadow-xl">
            {/* 여러분의 꿈을 Toonyz와 함께 하세요! */}
            {phrase(dictionary, "Billboard_header", language)}
        </p>
        <p className="text-white dark:text-white text-[8px] md:text-lg mt-3 md:mt-8 w-[90%] md:w-full lg:w-full drop-shadow-xl">
            {/* Your Favorite Story Universe, Toonyz */}
            {phrase(dictionary, "Billboard_subheader", language)}
        </p>
        <div className="flex flex-row items-center mt-3 md:mt-4 gap-3">
        </div>
      </div>
    </div>
  )
}
export default Billboard;