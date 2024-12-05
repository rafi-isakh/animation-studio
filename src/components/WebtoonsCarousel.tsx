'use client'
import React, { useState, useEffect } from 'react';
import CarouselComponentSquareStyle from '@/components/CarouselComponentSquareStyle';
import { SlickCarouselItem, Webtoon } from '@/components/Types';

const WebtoonsCarousel: React.FC<{ webtoons: Webtoon[], carouselItems: SlickCarouselItem[] }> = ({ webtoons, carouselItems }) => {
  const [isMobile, setIsMobile] = useState(false)

  // Check screen size and update isMobile state
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768); // Adjust breakpoint as needed
    };

    // Check initial screen size
    checkMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);

    // Cleanup event listener
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Modify carousel items to use mobile image when appropriate
  const responsiveCarouselItems = carouselItems.map(item => ({
    ...item,
    image: isMobile ? (item.image_mobile || item.image) : item.image
  }));


  return (
    <CarouselComponentSquareStyle
      items={responsiveCarouselItems}
      title="Featured Series"
      autoSlide={true}
    />
  );
};

export default WebtoonsCarousel;