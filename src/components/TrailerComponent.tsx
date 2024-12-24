'use client';
import React, { useState } from 'react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';
import Image from 'next/image';

// Custom arrow components
const PrevArrow = ({ onClick = () => {} }: { onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="absolute left-10 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-transparent text-white transition-colors"
    aria-label="Previous"
  >
    <ChevronLeft size={24} />
  </button>
);

const NextArrow = ({ onClick = () => {} }: { onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-transparent text-white transition-colors"
    aria-label="Next"
  >
    <ChevronRight size={24} className='text-white/80' />
  </button>
);

export default function TrailerComponent() {
    const [activeSlide, setActiveSlide] = useState(0);
    const { language, dictionary } = useLanguage();
    const mangaItems = [
        {
            id: 1,
            title: "마법사와 춤을",
            description: "lorem ipsum dolor sit amet, ",
            author: 'author',
            date: '2024-12-24',
            image: "/contact/Contact_5.png",
            featured: true
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
        }
    ];

    const settings = {
        dots: false,
        infinite: true,
        speed: 500,
        autoplay: true,
        autoplaySpeed: 3000,
        slidesToShow: 4,
        slidesToScroll: 1,
        centerMode: true,
        centerPadding: '0px',
        focusOnSelect: true,
        nextArrow: <NextArrow />,
        prevArrow: <PrevArrow />,
        beforeChange: (current: number, next: number) => {
            setActiveSlide(next);
        },
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 3,
                    centerPadding: '40px',
                }
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 2,
                    centerPadding: '30px',
                }
            },
            {
                breakpoint: 480,
                settings: {
                    slidesToShow: 1,
                    centerPadding: '20px',
                }
            }
        ]
    };

    return (
        <div className='relative w-full md:max-w-screen-lg mx-auto'>
        <h1 className="flex flex-row justify-between text-xl font-extrabold mb-3">
                <span className='text-black dark:text-white'>
                    {phrase(dictionary, "toonyzTrailers", language)}
                </span>
            </h1>
     
        <div className="relative w-full md:max-w-screen-lg  mx-auto px-4 py-10 bg-gray-900 rounded-lg">
            {/* Carousel */}
            <div className="">
                <Slider {...settings}>
                    {mangaItems.map((item, index) => (
                        <div key={item.id} className="px-6 py-8">
                            <div className={`relative group transition-all duration-300 
                                ${activeSlide === index 
                                    ? 'scale-110 opacity-100 z-10' 
                                    : 'scale-95 opacity-60'}`}
                                >
                        
                                {/* Image Container */}
                                <div className="relative aspect-[1/2] rounded-lg overflow-hidden">
                                    <Image
                                        src={item.image}
                                        alt={item.title || 'Manga cover'}
                                        fill
                                        className={`w-full h-full object-cover transition-all duration-300
                                            ${activeSlide === index 
                                                ? 'brightness-100' 
                                                : 'brightness-75'}`}
                                    />
                                    
                                    {/* Overlay Text - Appears on hover */}
                                    <div className={`absolute inset-0 flex flex-col justify-end p-4 
                                        bg-gradient-to-t from-black/80 to-transparent 
                                        transition-all duration-300
                                        ${activeSlide === index 
                                            ? 'opacity-0 group-hover:opacity-100' 
                                            : 'opacity-0'}`}
                                    >
                                        <h3 className="text-white font-bold text-lg truncate">
                                            {item.author}
                                        </h3>
                                        <p className="text-white text-sm line-clamp-2">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                                {/* text area */}
                                <div className={`mt-2 transition-all duration-300 flex flex-col justify-center items-center
                                    ${activeSlide === index 
                                        ? 'opacity-100' 
                                        : 'opacity-0'}`}
                                >
                                    <span className="text-black font-bold text-sm bg-white px-2 py-1">
                                        {item.date} {language === 'ko' ? '공개예정' : 'Release date'}
                                    </span>
                                    <p className={`text-white text-sm line-clamp-2 
                                        ${activeSlide === index ? 'opacity-100' : 'opacity-0'}`}>
                                        {item.title}
                                    </p>
                                </div>
                               
                            </div>
                        </div>
                    ))}
                </Slider>
            </div>
        </div>
      </div>
    );
}