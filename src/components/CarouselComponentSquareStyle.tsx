'use client'
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import OtherTranslateComponent from '@/components/OtherTranslateComponent';
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';

interface CarouselItem {
  id: string;
  link: string;
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
  const [offset, setOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  // Swipe state
  const [touchStart, setTouchStart] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Dimensions and thresholds
  const SWIPE_THRESHOLD = 100; // Pixels to trigger a slide
  const TOTAL_SLIDES = items.length;

  const { language } = useLanguage();   

  // Auto-sliding effect
  useEffect(() => {
    if (!autoSlide) return;

    const slideInterval = setInterval(() => {
      nextSlide();
    }, autoSlideInterval);

    return () => clearInterval(slideInterval);
  }, [autoSlide, autoSlideInterval, currentIndex]);

  const nextSlide = () => {
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => 
      prevIndex === TOTAL_SLIDES - 1 ? 0 : prevIndex + 1
    );
    setOffset(0);
  };

  const prevSlide = () => {
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? TOTAL_SLIDES - 1 : prevIndex - 1
    );
    setOffset(0);
  };

  // Touch and drag start
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (isTransitioning) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setTouchStart(clientX);
    setIsDragging(true);
  };

  // Touch and drag move
  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || isTransitioning) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const diff = clientX - touchStart;
    setOffset(diff);
  };

  // Touch and drag end
  const handleTouchEnd = () => {
    if (!isDragging || isTransitioning) return;

    setIsDragging(false);

    // Determine slide direction based on offset
    if (Math.abs(offset) > SWIPE_THRESHOLD) {
      if (offset > 0) {
        // Swipe right (previous slide)
        prevSlide();
      } else {
        // Swipe left (next slide)
        nextSlide();
      }
    } else {
      // Snap back to current slide
      setOffset(0);
    }
  };

  // Transition end handler
  const handleTransitionEnd = () => {
    setIsTransitioning(false);
  };

  // Event handlers for both touch and mouse
  const touchProps = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onMouseDown: handleTouchStart,
    onMouseMove: handleTouchMove,
    onMouseUp: handleTouchEnd,
    onMouseLeave: handleTouchEnd
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioning) return;
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isTransitioning]);

  // Prepare slides for infinite loop-like effect
  const getSlideStyles = (index: number) => {
    const baseStyle = {
      transform: `translateX(calc(-${currentIndex * 100}% + ${offset}px))`,
      transition: isTransitioning ? 'transform 0.3s ease-out' : 'none'
    };

    return baseStyle;
  };

  return (
    <div 
      className="relative w-full md:max-w-screen-xl mx-auto group select-none"
      {...touchProps}
    >
      <div className="relative w-full overflow-hidden rounded-lg">
        {/* Navigation Buttons */}
        <button
          onClick={prevSlide}
          disabled={isTransitioning}
          className="
            absolute left-0 top-1/2 transform -translate-y-1/2 
            z-20 bg-black/50 hover:bg-black/70 
            rounded-full p-2 m-4 
            opacity-0 group-hover:opacity-100 
            transition-all duration-300
            disabled:opacity-30
          "
        >
          <ChevronLeft className="text-white" size={32} />
        </button>
        <button
          onClick={nextSlide}
          disabled={isTransitioning}
          className="
            absolute right-0 top-1/2 transform -translate-y-1/2 
            z-20 bg-black/50 hover:bg-black/70 
            rounded-full p-2 m-4 
            opacity-0 group-hover:opacity-100 
            transition-all duration-300
            disabled:opacity-30
          "
        >
          <ChevronRight className="text-white" size={32} />
        </button>

        {/* Carousel Container */}
        <div 
          ref={carouselRef}
          className="relative w-full overflow-hidden"
          onTransitionEnd={handleTransitionEnd}
        >
          <div 
            className="flex"
            style={getSlideStyles(currentIndex)}
          >
            {items.map((item) => (
              <div 
                key={item.id} 
                className="
                  w-full flex-shrink-0 relative 
                  h-[500px] overflow-hidden
                "
              >
                <Link href={item.link}>
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
                </Link>

                {/* Content Overlay */}
                <div 
                  className="
                    absolute bottom-0 left-0 right-0 
                    bg-gradient-to-t from-black/80 to-transparent 
                    p-8 text-white
                  "
                >
                  <h3 className="text-xl md:text-3xl font-bold mb-2">
                    {/* {item.title} */}
                    <OtherTranslateComponent
                        key={`title-${item.id}-${language}`}
                        content={item.title}
                        elementId={item.id.toString()}
                        classParams={` md:text-2xl lg:text-2xl text-xl !min-[400px]:text-[12px] font-extrabold`}
                        elementType={'carouselItem'}
                        elementSubtype="title"
                        showLoading={false}
                    />
                  </h3>

                  {/* Genres and Tags */}
                  {(item.genres || item.tags) && (
                    <div className="flex space-x-2 mb-3">
                      {item.genres && (
                        <span
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
                    {currentIndex + 1} / {TOTAL_SLIDES}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dot Indicators */}
        <div 
          className="
            absolute bottom-4 left-1/2 transform -translate-x-1/2 
            flex space-x-2
          "
        >
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (isTransitioning) return;
                setCurrentIndex(idx);
                setOffset(0);
              }}
              className={`
                w-2 h-2 md:w-3 md:h-3 rounded-full 
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