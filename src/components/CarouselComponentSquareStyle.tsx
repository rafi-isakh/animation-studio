'use client'
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import OtherTranslateComponent from '@/components/OtherTranslateComponent';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';

// Updated interface to include genres
interface CarouselItem {
  id: string;
  title: string;
  imageUrl: string;
  description?: string;
  genres?: string;
  tags?: string[];
}

interface CarouselProps {
  items: CarouselItem[];
  title?: string;
  autoSlide?: boolean;
  autoSlideInterval?: number;
}

const CarouselComponentSquareStyle: React.FC<CarouselProps> = ({
  items,
  title,
  autoSlide = false,
  autoSlideInterval = 5000
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const { language, dictionary } = useLanguage();

  // Auto-sliding effect
  useEffect(() => {
    if (!autoSlide) return;

    const slideInterval = setInterval(() => {
      nextSlide();
    }, autoSlideInterval);

    return () => clearInterval(slideInterval);
  }, [autoSlide, autoSlideInterval, currentIndex]);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === items.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? items.length - 1 : prevIndex - 1
    );
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);



  function breakKeepOrNot() {
    if (language == 'ko' || language == "ar" || language == "th" || language == "vi" || language == 'en' || language == 'id') {
        return 'break-keep ';
    } else if (language == 'ja' || language == 'zh-CN' || language == 'zh-TW') {
        return '';
    }
    return '';
    }

  return (
    <div className="relative w-full md:max-w-screen-xl mx-auto group">

      {/* Main Carousel Container */}
      <div 
        ref={carouselRef}
        className="relative w-full overflow-hidden rounded-lg"
      >
        {/* Navigation Buttons */}
        <button
          onClick={prevSlide}
          className="
            absolute left-0 top-1/2 transform -translate-y-1/2 
            z-20 bg-black/50 hover:bg-black/70 
            rounded-full p-2 m-4 
            opacity-0 group-hover:opacity-100 
            transition-all duration-300
          "
        >
          <ChevronLeft className="text-white" size={32} />
        </button>
        <button
          onClick={nextSlide}
          className="
            absolute right-0 top-1/2 transform -translate-y-1/2 
            z-20 bg-black/50 hover:bg-black/70 
            rounded-full p-2 m-4 
            opacity-0 group-hover:opacity-100 
            transition-all duration-300
          "
        >
          <ChevronRight className="text-white" size={32} />
        </button>

        {/* Carousel Items */}
        <div 
          className="
            flex transition-transform duration-500 ease-in-out
            transform -translate-x-full 
            w-full relative
          "
          style={{ 
            transform: `translateX(-${currentIndex * 100}%)` 
          }}
        >
          {items.map((item, index) => (
            <div 
              key={item.id} 
              className="
                w-full flex-shrink-0 relative 
                h-[500px] overflow-hidden
              "
            >
              {/* Background Image */}
              <Image 
                src={item.imageUrl} 
                alt={item.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw"
                className="
                  absolute inset-0 w-full h-full 
                  object-cover object-center
                  filter brightness-75
                "
              />

              {/* Content Overlay */}
              <div 
                className="
                  absolute bottom-0 left-0 right-0 
                  bg-gradient-to-t from-black/80 to-transparent 
                  p-8 text-white
                "
              >


                
                <h3 className="text-xl md:text-3xl font-bold mb-2">
                  {item.title}

                  {/* <OtherTranslateComponent
                        key={`title-${index}-${language}`}
                        content={item.title}
                        elementId={item.id.toString()}
                        classParams={`${breakKeepOrNot()} md:text-2xl lg:text-2xl text-xl !min-[400px]:text-[12px] font-extrabold px-2`}
                        elementType={'carouselItem'}
                        elementSubtype="title"
                        showLoading={false}
                        /> */}
                </h3>

                {/* Genres and Tags */}
                {(item.genres || item.tags) && (
                  <div className="flex space-x-2 mb-3">
                    {item.genres && (
                      <span
                        key={item.genres}
                        className="
                          bg-white/20 
                          px-2 py-1 
                          rounded-md 
                          text-xs 
                          uppercase 
                          tracking-wider
                        "
                      >
                        {item.genres}
                      </span>
                    )}
                    {item.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="
                          bg-white/10 
                          px-2 py-1 
                          rounded-md 
                          text-xs 
                          lowercase 
                          text-gray-300
                        "
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {item.description && (
                  <p className="text-sm md:text-lg line-clamp-2 mb-3">
                    {item.description}
                  </p>
                )}

                {/* Numeric Indicator */}
                <div 
                  className="
                    bg-white/20 
                    px-3 py-1 
                    rounded-full 
                    text-sm 
                    inline-block
                    text-white
                  "
                >
                  {currentIndex + 1} / {items.length}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Optional Dot Indicators */}
        <div 
          className="
            absolute bottom-4 left-1/2 transform -translate-x-1/2 
            flex space-x-2
          "
        >
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`
                w-2 h-2 md:w-3 md:h-3  rounded-full 
                transition-all duration-300
                ${idx === currentIndex 
                  ? 'bg-white scale-125' 
                  : 'bg-white/50 hover:bg-white/75'
                }
              `}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CarouselComponentSquareStyle;