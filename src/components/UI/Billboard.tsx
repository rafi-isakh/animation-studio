import React, { useCallback, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Info } from 'lucide-react';
import { initialWebtoonContents } from '@/utils/curriculum';
import { getImageUrl, getVideoUrl } from '@/utils/urls';
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import { Play, Pause } from 'lucide-react';

interface BillboardProps {
  videoSrc: string;
  posterSrc: string;
  headerPhrase: string;
  subheaderPhrase: string;
  className: string;
}

const Billboard = ({ videoSrc, posterSrc, headerPhrase = "", subheaderPhrase = "", className = "" }: BillboardProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isPlaying, setIsPlaying] = useState(!isMobile);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { language, dictionary } = useLanguage();

  const handleResize = () => {
    setIsMobile(window.innerWidth < 768);
  };

  useEffect(() => {
    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative w-full h-full">
        <video
          onClick={togglePlay}
          ref={videoRef}
          poster={posterSrc}
          className="w-full h-full object-cover brightness-[60%] transition duration-500"
          autoPlay={true}
          muted loop
          src={videoSrc}
        />
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className="absolute bottom-4 right-4 bg-white/30 hover:bg-white/50 
                   rounded-full p-2 transition-colors duration-200"
          aria-label={isPlaying ? 'Pause video' : 'Play video'}
        >
          {isPlaying ? (
            <Pause size={24} className="text-white" />
          ) : (
            <Play size={24} className="text-white" />
          )}
        </button>

      </div>
      <div className="absolute top-[30%] md:top-[40%] ml-4 md:ml-16">
        <p className="text-white dark:text-white text-1xl md:text-5xl h-full w-full lg:text-2xl font-bold drop-shadow-xl">
          {/* 여러분의 꿈을 Toonyz와 함께 하세요! */}
          {phrase(dictionary, headerPhrase, language)}
        </p>
        <p className="text-white dark:text-white text-[8px] md:text-lg mt-3 md:mt-8 w-[90%] md:w-full lg:w-full drop-shadow-xl">
          {/* Your Favorite Story Universe, Toonyz */}
          {phrase(dictionary, subheaderPhrase, language)}
        </p>
        <div className="flex flex-row items-center mt-3 md:mt-4 gap-3">
        </div>
      </div>
    </div>
  )
}
export default Billboard;