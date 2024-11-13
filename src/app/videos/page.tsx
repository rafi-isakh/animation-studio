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
        id: index.toString(), // Ensure each content has a unique id as a string
        file_src: getCloudfrontURL(content.file_src),
        file_src_jp: getCloudfrontURL(content.file_src_jp),
    }));

    const webnovelContents = initialWebnovelContents.map((content, index) => ({
        ...content,
        id: index.toString(), // Ensure each content has a unique id
        file_src: getCloudfrontURL(content.file_src),
        file_src_jp: getCloudfrontURL(content.file_src_jp),
    }));

    return (
        <div className="flex flex-col items-center justify-center">
            {/* <div className="flex flex-col space-y-4"> */}
                <Billboard />
                <div className="max-w-screen-xl mx-auto overflow-x-auto">
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
                <div className="max-w-screen-xl mx-auto overflow-x-auto pb-40">
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