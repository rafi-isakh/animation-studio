import React from 'react';
import { Play } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CurriculumCardProps {
    isOpen: boolean;
    onClose: () => void;
    video: JSX.Element | null;
    data: {
        id: string;
        image: string;
        image_en: string;
        image_jp: string;
        title: string;
        title_en: string;
        subtitle: string;
        subtitle_en: string;
        title_jp: string;
        subtitle_jp: string;
        onVideoClick: (video: JSX.Element) => void;
        file_src: string;
        file_src_jp?: string;
        file_src_en?: string;
    };
}

const CurriculumCard: React.FC<CurriculumCardProps> = ({ data }) => {
    const { language } = useLanguage();

    const handleVideoClick = () => {
        const videoElement = <video src={language === 'ko' ? data.file_src : language === 'ja' ? data.file_src_jp : language === 'en' ? data.file_src_en : data.file_src} controls autoPlay loop />;
        data.onVideoClick(videoElement);
    };

    return (
        <div className="relative group w-64 md:w-72 aspect-[5/5] transition-all duration-300">
            {/* Card Container */}
            <div className="relative w-full h-full transition-all duration-300">
                {/* Base Image */}
                <img 
                    src={language === 'ko' ? data.image : language === 'en' ? data.image_en : language === 'ja' ? data.image_jp : data.image} 
                    alt={data.title} 
                    draggable={false} 
                    className="w-full h-full rounded-md object-fit object-top shadow-lg"
                />
                
                {/* Overlay - Always visible with color transition on hover */}
                <div className="
                    absolute 
                    inset-0
                    bg-gradient-to-b 
                    from-transparent 
                   
                  hover:to-zinc-800/90
                    transition-colors
                    duration-300
                    rounded-md
                    p-3
                ">
                    {/* Content Container - Using flex to create space between top and bottom content */}
                    <div className="flex flex-col h-full">
                        {/* Top Section - ID */}

                        <div className="absolute top-0 left-0 w-8 h-8 md:w-12 md:h-12 flex items-center justify-center">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-purple-800 opacity-90 rounded-md"></div>
                            <p className="relative text-xl md:text-3xl font-bold text-white">
                            {(Number(data.id) + 1).toString().padStart(2, '0')}
                            </p>
                        </div>
                        {/* <div className="flex-none">
                            <h1 className="text-black text-xl md:text-2xl"></h1>
                        </div> */}

                        {/* Bottom Section - Title, Subtitle, and Play Button */}
                        <div className="flex-grow flex flex-col justify-end gap-2 opacity-0
                    group-hover:opacity-100">

                              {/* Play Button */}
                              <button 
                                onClick={handleVideoClick}
                                className="
                                    w-8 
                                    h-8 
                                    md:w-10 
                                    md:h-10 
                                    bg-white 
                                    rounded-full 
                                    flex 
                                    items-center 
                                    justify-center 
                                    hover:bg-neutral-300 
                                    transition
                                    invisible
                                    group-hover:visible
                                "
                            >
                                <Play className="w-4 md:w-5 text-black" />
                            </button>

                            {/* Title */}
                            <h3 className="text-white text-sm md:text-base font-extrabold line-clamp-1">
                                {language === 'ko' ? data.title 
                                : language === 'en' ? data.title_en 
                                : language === 'ja' ? data.title_jp
                                : data.title_en}
                            </h3>

                            {/* Subtitle */}
                            <p className="text-white text-xs md:text-sm line-clamp-2">
                                {language === 'ko' ? data.subtitle 
                                : language === 'en' ? data.subtitle_en 
                                : language === 'ja' ? data.subtitle_jp
                                : data.subtitle_en}
                            </p>

                          
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CurriculumCard;