import React, { useCallback } from 'react';
import { Play } from 'lucide-react';
import phrase from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';

interface CurriculumCardProps {
    isOpen: boolean;
    onClose: () => void;
    video: JSX.Element | null;
    data: {
        id: string;
        image: string;
        title: string;
        title_en: string;
        subtitle: string;
        subtitle_en: string;
        title_jp: string;
        subtitle_jp: string;
        onVideoClick: (video: JSX.Element) => void;
        file_src: string;
        file_src_jp: string
    };
}

const CurriculumCard: React.FC<CurriculumCardProps> = ({ data }) => {
    const { dictionary, language, setLanguage } = useLanguage();


    const handleVideoClick = () => {
        const videoElement = <video src={ language === 'ko' ? data.file_src : language === 'ja' ? data.file_src_jp : data.file_src } controls autoPlay loop />;
        data.onVideoClick(videoElement);
    };

    return (
        <div className="relative group w-64 md:w-72 aspect-[5/5] transition-all duration-300 hover:z-50">
            {/* Base Card */}
            <div className="relative w-full h-full transition-all duration-300 group-hover:scale-110 "> 
            {/*  */}
                <img 
                    src={data.image} 
                    alt={data.title} 
                    draggable={false} 
                    className="
                        w-full
                        h-full
                        rounded-md
                        object-fit
                        object-top
                        transition
                        duration-300
                        cursor-pointer
                        group-hover:opacity-0
                        shadow-lg
                    "
                />
            </div>
            {/* Hover Overlay */}
            <div className="
                absolute
                top-0
                left-0
                opacity-0
                transition-all
                duration-200
                transform 
                group-hover:opacity-100
                group-hover:-translate-y-1
                w-full
                min-h-full
                z-10
            "> 
               {/*   */}
                {/* Overlay Image */}
                <div className="relative w-full">
                    <img 
                        src={data.image} 
                        alt={data.title} 
                        draggable={false} 
                        className="
                            w-full
                            h-full
                            rounded-t-md
                            object-top
                            object-cover
                            shadow-xl
                        "
                    />
                </div>
                {/* Content Section */}
                <div className="
                    bg-zinc-800
                    rounded-b-md
                    p-3
                    shadow-xl
                ">
                    {/* Play Button */}
                    <div className="flex items-center gap-3">
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
                            "
                        >
                            <Play className="w-4 md:w-5 text-black" />
                        </button>
                    </div>
                    {/* Title */}
                    <div className="mt-2">
                        <h3 className="text-white text-sm md:text-base font-medium line-clamp-1">
                            { 
                              language === 'ko' ? data.title 
                              : language === 'en' ? data.title_en 
                              : language === 'ja' ? data.title_jp
                              : data.title_en 
                            }
                        </h3>
                    </div>

                    {/* Subtitle */}
                    <div className="mt-2 pb-2">
                        <p className="text-neutral-400 text-xs md:text-sm line-clamp-2">
                            {/* {data.subtitle} */}
                            { 
                              language === 'ko' ? data.subtitle 
                              : language === 'en' ? data.subtitle_en 
                              : language === 'ja' ? data.subtitle_jp
                              : data.subtitle_en 
                            }
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CurriculumCard;