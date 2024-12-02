"use client"
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getLocalImageUrl } from '@/utils/urls';
import { SlickCarouselItem } from '@/components/Types'
import { Webnovel } from '@/components/Types'
import Image from 'next/image';
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';


const CarouselComponent = ({ searchParams, webnovels, items }: { 
  searchParams: { [key: string]: string | string[] | undefined }, 
  items: SlickCarouselItem[], 
  webnovels: Webnovel[] 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const { dictionary, language } = useLanguage();
  // Calculate the number of slides needed
  const totalSlides = Math.ceil(items.length / 3);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!isHovered) {
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === totalSlides - 1 ? 0 : prevIndex + 1
        );
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isHovered, totalSlides]);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === totalSlides - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? totalSlides - 1 : prevIndex - 1
    );
  };

  // Function to get current slide items
  const getCurrentSlideItems = () => {
    const start = currentIndex * 3;
    return items.slice(start, start + 3);
  };

  return (
    <div 
      className="relative max-w-screen-lg mx-auto h-[350px] overflow-hidden"
      // max-w-screen-xl
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h1 className='text-white text-xl font-bold max-w-screen-lg mx-auto mt-[10px] md:px-1 px-2'>
           {/* 오직 투니즈에서만! */}
           {phrase(dictionary, "onlyToonyz", language)}
      </h1>
      {/* Main carousel */}
      <div 
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {/* Generate slides */}
        {Array.from({ length: totalSlides }).map((_, slideIndex) => (
          <div 
            key={slideIndex}
            className="min-w-full h-2/3 flex gap-4 px-4 mt-[20px]"
          >
            {items.slice(slideIndex * 2, (slideIndex * 2) + 2).map((item, itemIndex) => (
              <div 
                key={item.id}
                className="flex-1 relative rounded-xl overflow-hidden"
              >
                <Image
                  src={getLocalImageUrl(item.image)}
                  fill
                  sizes="(max-width: 768px) 33vw, 25vw"
                  alt={item.image}
                  className="object-cover rounded-xl"
                  priority={slideIndex === 0}
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                  <h2 className="text-white text-lg font-bold">{item.title}</h2>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Navigation buttons */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white hover:bg-black/70 transition-colors"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white hover:bg-black/70 transition-colors"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              currentIndex === index ? 'bg-white w-6' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default CarouselComponent;