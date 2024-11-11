'use client'
import React, {useState} from 'react';
import { WebtoonContent } from './Types';
import { VideoModal } from '@/components/VideoModal';
import CurriculumCard from '@/components/CurriculumCard';

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
    
    const handleVideoClick = (video: JSX.Element) => {
        setCurrentVideo(video);
        setShowVideoModal(true);
    };
  
    return (
      <>
        <p className="text-black dark:text-white text-md md:text-xl lg:text-2xl font-semibold mb-4 ml-5">
            {title}
        </p>
        <div className="w-full px-4 mx-auto mt-4 md:mb-6">
            {/* Scroll container with overflow handling */}
            <div className="relative w-full">
                <div className="overflow-x-auto pb-4 scrollbar-hide">
                    <div className="flex flex-nowrap gap-2 min-w-full">
                        {contents.map((item, index) => (
                            <div className="flex-none w-64 md:w-72" key={index}>
                                <CurriculumCard 
                                    data={{ ...item, onVideoClick: handleVideoClick }} 
                                    isOpen={showVideoModal} 
                                    onClose={() => setShowVideoModal(false)} 
                                    video={currentVideo} 
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <VideoModal 
                isOpen={showVideoModal} 
                onClose={() => setShowVideoModal(false)} 
                video={currentVideo}
            />
        </div>
        </>
    );
}

export default CurriculumVideoList;