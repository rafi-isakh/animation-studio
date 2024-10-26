'use client'
import { getCloudfrontURL } from '@/utils/cloudfront';
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { initialWebtoonContents, initialWebnovelContents } from '@/utils/curriculum';
import Billboard from '@/components/Billboard';
import CurriculumVideoList from '@/components/CurriculumVideoList';

export default function Videos() {
    const file_src = getCloudfrontURL('');
    const { dictionary, language } = useLanguage();


    const webtoonContents = initialWebtoonContents.map((content, index) => ({
        ...content,
        id: index, // Ensure each content has a unique id
        file_src: getCloudfrontURL(content.file_src),
    }));

    const webnovelContents = initialWebnovelContents.map((content, index) => ({
        ...content,
        id: index, // Ensure each content has a unique id
        file_src: getCloudfrontURL(content.file_src),
    }));

    return (
        <div className="flex flex-col items-center justify-center">
            {/* <div className="flex flex-col space-y-4"> */}
                <Billboard />
                <div className="pb-40">
                <CurriculumVideoList 
                    title={phrase(dictionary, "웹소설 커리큘럼", language)} 
                    contents={webtoonContents}
                    language={language}
                    imageType={'webtoon'}
                    onVideoClick={(video) => {
                        console.log('Video clicked:', video);
                    }} 
                   
                />
                </div>
                    {/* <VideoModal 
                    isOpen={showVideoModal} 
                    onClose={() => setShowVideoModal(false)} 
                    video={currentVideo}
                    /> */}


                    {/* <ContentGrid 
                        contents={webtoonContents} 
                        language={language} 
                        onVideoClick={handleVideoClick}
                        imageType="webtoon"
                    />   
                   */}
                    
            </div>
    )
}