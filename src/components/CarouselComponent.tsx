"use client"
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getLocalImageUrl } from '@/utils/urls';
import { SlickCarouselItem } from '@/components/Types';
import { Webnovel } from '@/components/Types';
import Image from 'next/image';
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import OtherTranslateComponent from '@/components/OtherTranslateComponent';

const CarouselComponent = ({ searchParams, webnovels, items }: { 
  searchParams: { [key: string]: string | string[] | undefined }, 
  items: SlickCarouselItem[], 
  webnovels: Webnovel[] 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const { dictionary, language } = useLanguage();

  // Calculate the number of slides needed
  const totalSlides = Math.ceil(items.length / 3); // For larger screens
  const totalMobileSlides = items.length; // For smaller screens

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!isHovered) {
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === totalSlides - 1 ? 0 : prevIndex + 1
        );
      }, 2000);
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

  const getCurrentMobileSlideItem = () => {
    return items[currentIndex];
  };

  return (
    <div 
      className="relative max-w-screen-xl mx-auto h-[410px] overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
   
      {/* Main carousel */}
      <div 
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {/* Desktop view */}
        <div className="hidden md:flex w-full">
          {Array.from({ length: totalSlides }).map((_, slideIndex) => (
            <div 
              key={slideIndex}
              className="min-w-full h-[350px] flex gap-4 px-4 mt-[20px]"
            >
              {items.slice(slideIndex * 3, (slideIndex * 3) + 3).map((item, itemIndex) => (
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
                    <OtherTranslateComponent 
                      key={`hook-${item.id}-${language}`}
                      content={item.hook}
                      elementId={item.id.toString()}
                      classParams={`md:text-sm lg:text-sm !min-[400px]:text-[12px] text-white dark:text-black`}
                      elementType={'carouselItem'}
                      elementSubtype="hook"
                      showLoading={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Mobile view */}
        <div className="flex md:hidden w-full">
          {Array.from({ length: totalMobileSlides }).map((_, slideIndex) => (
            <div 
              key={slideIndex}
              className="min-w-full h-[350px] flex gap-4 px-4 mt-[20px]"
            >
              {items.slice(slideIndex, slideIndex + 1).map((item) => (
                <div 
                  key={item.id}
                  className="flex-1 relative rounded-xl overflow-hidden"
                >
                  <Image
                    src={getLocalImageUrl(item.image)}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    alt={item.image}
                    className="object-cover rounded-xl"
                    priority={slideIndex === 0}
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                    <h2 className="text-white text-lg font-bold">{item.title}</h2>
                    <OtherTranslateComponent 
                      key={`hook-${item.id}-${language}`}
                      content={item.hook}
                      elementId={item.id.toString()}
                      classParams={`md:text-sm lg:text-sm !min-[400px]:text-[12px] text-white dark:text-black`}
                      elementType={'carouselItem'}
                      elementSubtype="hook"
                      showLoading={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

     
      {/* Indicators */}
      <div className=''>
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
  
      <div className='absolute bottom-2 right-1 flex text-white text-[10px] font-bold'>
        {/* <h1>
          {phrase(dictionary, "onlyToonyz", language)}
        </h1> */}
        <div className="flex">
          <button
            onClick={handlePrev}
            className="bg-black/50 p-2 rounded-full text-white hover:bg-black/70 transition-colors"
          >
            <ChevronLeft className="w-2 h-2" />
          </button>
          <button
            onClick={handleNext}
            className="bg-black/50 p-2 rounded-full text-white hover:bg-black/70 transition-colors"
          >
            <ChevronRight className="w-2 h-2" />
          </button>
        </div>
      </div>
      
      </div>
    </div>
  );
};

export default CarouselComponent;
