'use client'
import { getVideoUrl } from '@/utils/urls';
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { initialWebtoonContents, initialWebnovelContents } from '@/utils/curriculum';
import Billboard from '@/components/Billboard';
import CurriculumVideoList from '@/components/CurriculumVideoList';

export default function Videos() {
    const file_src = getVideoUrl('');
    const { dictionary, language } = useLanguage();

    const webtoonContents = initialWebtoonContents.map((content, index) => ({
        ...content,
        id: index.toString(), // Ensure each content has a unique id as a string
        file_src: getVideoUrl(content.file_src),
        file_src_en: getVideoUrl(content.file_src_en),
        file_src_jp: getVideoUrl(content.file_src_jp),
    }));

    const webnovelContents = initialWebnovelContents.map((content, index) => ({
        ...content,
        id: index.toString(), // Ensure each content has a unique id
        file_src: getVideoUrl(content.file_src),    
        file_src_en: getVideoUrl(content.file_src_en),
        file_src_jp: getVideoUrl(content.file_src_jp),
    }));

    return (
        <div className="flex flex-col items-center justify-center">
                <Billboard />
                <div className="md:max-w-screen-lg max-w-[360px] mx-auto overflow-x-auto">
                    <CurriculumVideoList 
                        title={phrase(dictionary, "webtoonCurriculum", language)} 
                        contents={webtoonContents}
                        language={language}
                        imageType={'webtoon'}
                        onVideoClick={(video) => {
                            console.log('Video clicked:', video);
                        }}  
                    />
                 </div>
                <div className="md:max-w-screen-lg max-w-[360px] mx-auto overflow-x-auto pb-40">
                    <CurriculumVideoList 
                        title={phrase(dictionary, "webnovelCurriculum", language)} 
                        contents={webnovelContents}
                        language={language}
                        imageType={'webnovel'}
                        onVideoClick={(video) => {
                            console.log('Video clicked:', video);
                        }}  
                    />
                 </div>
            </div>
    )
}