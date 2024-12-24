'use client';
import React from 'react';
import type { Settings } from 'react-slick';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Define custom arrow props
interface ArrowProps {
    currentSlide?: number;
    slideCount?: number;
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
}

// Custom arrow components
const NextArrow: React.FC<ArrowProps> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 p-4 rounded-l-lg hover:bg-black/70 transition-colors"
        >
            <ChevronRight className="w-6 h-6 text-white" />
        </button>
    );
};

const PrevArrow: React.FC<ArrowProps> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 p-4 rounded-r-lg hover:bg-black/70 transition-colors"
        >
            <ChevronLeft className="w-6 h-6 text-white" />
        </button>
    );
};

const TrailerCardComponent: React.FC = () => {
    const settings: Settings = {
        dots: false,
        infinite: false,
        speed: 500,
        slidesToShow: 3,
        slidesToScroll: 1,
        nextArrow: <NextArrow />,
        prevArrow: <PrevArrow />,
        
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
                    slidesToShow: 2,
                }
            }
        ]
    };

    return (
        <div className="w-full md:max-w-screen-lg mx-auto">
            <div className="flex flex-col md:flex-row items-stretch">
                <div className="md:w-[250px] flex-shrink-0 bg-black p-6 flex flex-col justify-center">
                    <h2 className="text-xl font-bold text-white">header</h2>
                    <p className="text-sm text-gray-400">description</p>
                </div>
                {/* 1024px  */}
                <div className="flex-1 w-full md:w-[600px]">
                    <div className="relative bg-black py-6 overflow-hidden ">
                        <Slider {...settings}>
                            <div className="px-2">
                                <div className="bg-gray-800 rounded-lg p-4 h-48 flex items-center justify-center">
                                    <span className="text-white text-center">레진의 모든 것</span>
                                </div>
                            </div>
                            <div className="px-2">
                                <div className="bg-gray-800 rounded-lg p-4 h-48 flex items-center justify-center">
                                    <span className="text-white text-center">BL만 빼주세요🌲</span>
                                </div>
                            </div>
                            <div className="px-2">
                                <div className="bg-gray-800 rounded-lg p-4 h-48 flex items-center justify-center">
                                    <span className="text-white text-center">BL만 주세요🍆</span>
                                </div>
                            </div>
                            <div className="px-2">
                                <div className="bg-gray-800 rounded-lg p-4 h-48 flex items-center justify-center">
                                    <span className="text-white text-center">드라마만 빼주세요🌶️</span>
                                </div>
                            </div>
                            <div className="px-2">
                                <div className="bg-gray-800 rounded-lg p-4 h-48 flex items-center justify-center">
                                    <span className="text-white text-center">드라마 위주로 주세요🎯</span>
                                </div>
                            </div>
                        </Slider>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrailerCardComponent;