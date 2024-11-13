import React, { useCallback } from 'react';
import { Play } from 'lucide-react';
import phrases from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';

interface CurriculumCardProps {
    isOpen: boolean;
    onClose: () => void;
    video: JSX.Element | null;
    data: {
        id: string;
        image: string;
        title: string;
        subtitle: string;
        onVideoClick: (video: JSX.Element) => void;
        file_src: string;
    };
}

const CurriculumCard: React.FC<CurriculumCardProps> = ({ data }) => {
    const handleVideoClick = () => {
        const videoElement = <video src={data.file_src} controls autoPlay loop />;
        data.onVideoClick(videoElement);
    };

    return (
        <div className="relative group w-64 md:w-72">
            {/* Base Card */}
            <div className="relative w-full h-[400px]">
                <img 
                    src={data.image} 
                    alt={data.title} 
                    draggable={false} 
                    className="
                        w-full
                        rounded-md
                        object-cover
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
                scale-95
                transform
                group-hover:scale-100
                group-hover:opacity-100
                group-hover:-translate-y-4
                w-full
                h-full
                z-10
            ">
                {/* Overlay Image */}
                <div className="relative w-full h-[200px] md:h-[200px]">
                    <img 
                        src={data.image} 
                        alt={data.title} 
                        draggable={false} 
                        className="
                            w-full
                            h-full
                            rounded-t-md
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
                    <div className="mt-3">
                        <h3 className="text-white text-sm md:text-base font-medium">
                            {data.title}
                        </h3>
                    </div>

                    {/* Subtitle */}
                    <div className="mt-2 pb-2">
                        <p className="text-neutral-400 text-xs md:text-sm">
                            {data.subtitle}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CurriculumCard;