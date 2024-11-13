'use client'
import React, {useState, useRef} from 'react';
import { WebtoonContent } from '@/components/Types';
import { VideoModal } from '@/components/VideoModal';
import CurriculumCard from '@/components/CurriculumCard';
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { scroll } from '@/utils/scroll'
 
interface CurriculumVideoListProps {
    title: string;
    contents: WebtoonContent[];
    language: string;
    onVideoClick: (video: JSX.Element) => void;
    imageType: 'webtoon' | 'webnovel';
}

const CurriculumVideoList: React.FC<CurriculumVideoListProps> = ({ title, contents, language, onVideoClick, imageType }) => {
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [currentVideo, setCurrentVideo] = useState<JSX.Element | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
  
    const handleVideoClick = (video: JSX.Element) => {
        setCurrentVideo(video);
        setShowVideoModal(true);
    };
  
    return (
      <div className='group/arrow relative'>
        <p className="text-black dark:text-white text-md md:text-xl lg:text-2xl font-semibold mb-4 ml-5">
            {title}
        </p>
         {/* Left Arrow */}
            <button 
                onClick={() => scroll('left', scrollRef)}
                className="absolute md:left-5 left-8 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full md:p-2 p-1 shadow-md opacity-0 group-hover/arrow:opacity-100 transition-opacity duration-300 -translate-x-1/2 hidden md:block"
            >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
          <div className="w-full px-4 mx-auto mt-4 md:mb-6">
            <div className="relative w-full">
            {/* Scroll container with overflow handling */}
                <div ref={scrollRef} className="overflow-x-auto overflow-y-hidden pb-32 scrollbar-hide">
                    <div className="flex flex-nowrap gap-2 md:gap-4">
                        {contents.map((item, index) => (
                            <div className="flex-none w-64 md:w-72 transition-all duration-300" key={index}>
                                <CurriculumCard 
                                    data={{ 
                                      ...item,  
                                      onVideoClick: handleVideoClick,
                                      title_jp: item.title_jp || '', 
                                      subtitle_jp: item.subtitle_jp || '', 
                                      file_src_jp: item.file_src_jp || '' 
                                    }} 
                                    isOpen={showVideoModal} 
                                    onClose={() => setShowVideoModal(false)} 
                                    video={currentVideo} 
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
             {/* Right Arrow */}
             <button 
                onClick={() => scroll('right', scrollRef)}
                className="absolute md:right-5 right-8 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full md:p-2 p-1 shadow-md opacity-0 group-hover/arrow:opacity-100 transition-opacity duration-300 translate-x-1/2 "
            >
                <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
            <VideoModal 
                isOpen={showVideoModal} 
                onClose={() => setShowVideoModal(false)} 
                video={currentVideo}
            />
           </div>
        </div>
    );
}

export default CurriculumVideoList;