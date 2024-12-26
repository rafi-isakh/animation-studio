'use client';
import React, { useState } from 'react';
import type { Settings } from 'react-slick';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Bookmark, ChevronLeft, Share2, ChevronRight } from "lucide-react";
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';
import Link from 'next/link';
// Define custom arrow props
interface ArrowProps {
    currentSlide?: number;
    slideCount?: number;
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
}

// Custom arrow components
const NextArrow: React.FC<ArrowProps> = ({ onClick,  currentSlide, slideCount }) => {
    const isLastSlide = currentSlide === slideCount! - 3; // Adjust based on slidesToShow

    if (isLastSlide) return null;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (onClick) onClick();
    };


    return (
        <button
            onClick={handleClick}
            className="
                absolute right-0 top-1/2 -translate-y-1/2 z-10 
                bg-black/50 p-4 rounded-l-lg hover:bg-black/70 
                transition-all duration-300
            "
        >
            <ChevronRight className="w-6 h-6 text-white " />
        </button>
    );
};

const PrevArrow: React.FC<ArrowProps> = ({ onClick, currentSlide }) => {
    const isFirstSlide = currentSlide === 0;

    if (isFirstSlide) return null;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (onClick) onClick();
    };


    return (
        <button
            onClick={handleClick}
            className="
                absolute left-0 top-1/2 -translate-y-1/2 z-10 
                bg-black/50 p-4 rounded-r-lg hover:bg-black/70 
                transition-all duration-300
            "
        >
            <ChevronLeft className="w-6 h-6 text-white" />
        </button>
    );
};


const contents = [
    {
        id: 1,
        title: "마법사와 춤을",
        description: "lorem ipsum dolor sit amet, ",
        author: 'author',
        date: '2024-12-24',
        image: "/contact/Contact_5.png",
        // featured: true
    },
    {
        id: 2,
        title: "마법사와 춤을",
        description: "Lorem ipsum dolor sit amet consectetur, adipisicing elit. In, accusantium? Eaque facilis nam iste assumenda reprehenderit ratione voluptates tenetur velit vitae necessitatibus ullam, dolor excepturi quae officiis omnis dolore ad.",
        author: 'author',
        date: '2024-12-24',
        image: "/contact/Contact_1.png",
    },
    {
        id: 3,
        title: "마법사와 춤을",
        description: "Lorem ipsum dolor sit amet consectetur, adipisicing elit. In, accusantium? Eaque facilis nam iste assumenda reprehenderit ratione voluptates tenetur velit vitae necessitatibus ullam, dolor excepturi quae officiis omnis dolore ad.",
        author: 'author',
        date: '2024-12-24',
        image: "/contact/Contact_2.png",
    },
    {
        id: 4,
        title: "마법사와 춤을",
        description: "lorem ipsum",
        author: 'author',
        date: '2024-12-24',
        image: "/contact/Contact_3.png",
    },
    {
        id: 5,
        title: "마법사와 춤을",
        description: "lorem ipsum",
        author: 'author',
        date: '2024-12-24',
        image: "/contact/Contact_3.png",
    }
];


const TrailerCardComponent: React.FC = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [slideCount, setSlideCount] = useState(0);
    const { dictionary, language } = useLanguage();
    const [activeSlide, setActiveSlide] = useState(0);
    const [selectedSlide, setSelectedSlide] = useState<number | null>(null);

    
    const settings: Settings = {
        dots: false,
        infinite: false,
        speed: 500,
        slidesToShow: 3,
        slidesToScroll: 1,
        nextArrow: <NextArrow currentSlide={currentSlide} slideCount={slideCount} />,
        prevArrow: <PrevArrow currentSlide={currentSlide} />,
        beforeChange: (current: number, next: number) => {
            setCurrentSlide(next);
        },
        onInit: () => {
            setSlideCount(contents.length); // Assuming 'contents' is your data array
        },
         // Optional: Enable clicking slides to navigate
        focusOnSelect: true,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 4,
                }
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 3,
                }
            },
            {
                breakpoint: 480,
                settings: {
                    slidesToShow: 1,
                }
            }
        ]
    };

    const handleSlideClick = (index: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedSlide(index);
    };

    const isActiveSlide = (index: number) => {
        return selectedSlide === index;
    };

    return (
        <div className="w-full md:max-w-screen-lg mx-auto">
            <div className="flex flex-col md:flex-row items-stretch">
                <div className="md:w-[250px] flex-shrink-0 bg-black p-6 flex flex-col justify-center md:rounded-l-lg rounded-t-lg md:rounded-tr-none"
                style={{
                   backgroundImage: 'url(/images/trailers_ui_bg.png)',
                   backgroundSize: 'cover',
                   backgroundPosition: 'center',
                   backgroundRepeat: 'no-repeat'    
                }}
                >
                    <h2 className="text-xl font-bold text-white">
                        {/* 신작 예고편 */}
                        {phrase(dictionary, 'trailers_title', language)}

                    </h2>
                    <p className="text-sm text-gray-400">
                        {/* 투니즈 최신 예고편을 모아봤어요 */}
                        {phrase(dictionary, 'trailers_description', language)}
                    </p>
                </div>
                <div className="flex-1 w-full md:w-[600px]">
                    <div className="relative group bg-black md:pt-10 pt-0 md:pb-10 pb-5 overflow-hidden md:rounded-r-lg rounded-b-lg md:rounded-bl-none">
                        <Slider {...settings}>
                            {contents.map((content, index) => (
                                <div 
                                    key={content.id} 
                                    className="cursor-pointer px-2"
                                >
                                    <Link 
                                        href=''
                                        onClick={(e) => handleSlideClick(index, e)}
                                        className="block"
                                    >
                                        <div className={`
                                            transition-all duration-300 transform-gpu
                                            ${isActiveSlide(index) ? 'scale-100' : 'scale-95'}
                                        `}>
                                            <div className={`
                                                bg-gray-800 rounded-lg p-4 py-10 flex flex-col items-center
                                                transition-all duration-300
                                                ${isActiveSlide(index) ? 
                                                    'border-4 border-pink-500 shadow-lg shadow-pink-500/50' : 
                                                    'border-0'
                                                }
                                            `}>
                                                <div className="relative aspect-square w-full max-w-[200px]">
                                                    <Image 
                                                        src={content.image} 
                                                        alt={content.title} 
                                                        fill
                                                        className={`
                                                            object-cover rounded-full transition-all duration-300
                                                            ${isActiveSlide(index) ? 
                                                                'brightness-100 scale-100' : 
                                                                'brightness-75'
                                                            }
                                                        `}
                                                    />
                                                </div>
                                                <div className={`
                                                    flex flex-col justify-center items-center
                                                    mt-4 transition-all duration-300 space-y-2
                                                    ${isActiveSlide(index) ? 
                                                        'opacity-100 transform translate-y-0' : 
                                                        'opacity-60 transform translate-y-2'
                                                    }
                                                `}>
                                                    <p className="text-[#DB2777] text-center font-medium border-2 border-[#DB2777] rounded-full px-2 py-1  flex-grow-0">
                                                        {content.date} {language === 'ko' ? <>예정</> : ''}
                                                    </p>
                                                    <p className="text-white text-center font-medium">
                                                        {content.title}
                                                    </p>
                                                    <p className="text-white text-center line-clamp-2 font-medium">
                                                        {content.description.length > 50 
                                                            ? `${content.description.slice(0, 50)}...` 
                                                            : content.description
                                                        }
                                                    </p>
                                                    <div className="text-white flex flex-row gap-2 justify-center mt-2">
                                                        <Share2 size={16} />
                                                        <Bookmark size={16} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </Slider>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrailerCardComponent;