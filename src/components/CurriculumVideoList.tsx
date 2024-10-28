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
    <div className="mt-4">
      <>
        <p className="text-black text-md md:text-xl lg:text-2xl font-semibold mb-4">
            {title}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
          {contents.map((item, index) => (
            <CurriculumCard 
              key={index} 
              data={{ ...item, onVideoClick: handleVideoClick }} 
              isOpen={showVideoModal} 
              onClose={() => setShowVideoModal(false)} 
              video={currentVideo} 
            />
          ))}
        </div>
          <VideoModal 
            isOpen={showVideoModal} 
            onClose={() => setShowVideoModal(false)} 
            video={currentVideo}
         />
      </>
    </div>
  );
}

export default CurriculumVideoList;