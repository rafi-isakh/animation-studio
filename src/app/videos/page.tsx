'use client'
import { getCloudfrontURL } from '@/utils/cloudfront';
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { initialWebtoonContents, initialWebnovelContents } from '@/utils/curriculum';
import { VideoModal } from '@/components/VideoModal';
import { ContentGrid } from '@/components/VideoContentGrid';
import { Button } from '@/components/Button';
import Image from "next/image";
import Billboard from '@/components/Billboard';

export default function Videos() {
    const file_src = getCloudfrontURL('');
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [currentVideo, setCurrentVideo] = useState<JSX.Element | null>(null);
    const { dictionary, language } = useLanguage();

    const handleVideoClick = (video: JSX.Element) => {
        setCurrentVideo(video);
        setShowVideoModal(true);
    };

    const webtoonContents = initialWebtoonContents.map(content => ({
        ...content,
        file_src: getCloudfrontURL(content.file_src)
    }));

    const webnovelContents = initialWebnovelContents.map(content => ({
        ...content,
        file_src: getCloudfrontURL(content.file_src)
    }));

    return (
        <div className="flex flex-col items-center justify-center">
            {/* <div className="flex flex-col space-y-4"> */}
                <Billboard  />

                    <VideoModal 
                        isOpen={showVideoModal} 
                        onClose={() => setShowVideoModal(false)} 
                        video={currentVideo}
                    />

                      {/* Video Sections */}
                            <ContentGrid 
                                contents={webtoonContents} 
                                language={language} 
                                onVideoClick={handleVideoClick}
                                imageType="webtoon"
                            />
                            
                            {/* <ContentGrid 
                                contents={webnovelContents} 
                                language={language} 
                                onVideoClick={handleVideoClick}
                                imageType="webnovel"
                            /> */}

                            <VideoModal 
                                isOpen={showVideoModal} 
                                onClose={() => setShowVideoModal(false)} 
                                video={currentVideo}
                            />
            
            </div>
    )
}