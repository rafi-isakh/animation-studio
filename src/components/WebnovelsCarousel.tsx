'use client'
import React, { useState, useEffect } from 'react';
import CarouselComponentSquareStyle from '@/components/CarouselComponentSquareStyle';
import { Webnovel, SlickCarouselItem } from '@/components/Types';

const WebtoonsCarousel: React.FC<{ searchParams: { [key: string]: string | string[] | undefined }, items: SlickCarouselItem[], webnovel: Webnovel[] }> = ({ searchParams, items, webnovel }) => {  
 const [isMobile, setIsMobile] = useState(false)

  const carouselItems = [
    {
      id: '1',
      link: '/view_webnovels?id=25',
      title: '도사님이 오셨습니다',
      imageUrl: '/carousel/webnovels/carousel_1.png',
      imageUrl_mobile: '/carousel/webtoons/carousel_1_mobile.png',
      description: '도사님과의 스윗한 사랑 이야기!',
      genres: 'fantasy',
      tags: ['Ongoing', 'Free']
    },
    {
      id: '2', 
      link: '/view_webnovels?id=19',
      title: '대표님 안되요',
      imageUrl: '/carousel/webnovels/carousel_2.png',
      imageUrl_mobile: '/carousel/webtoons/carousel_2_mobile.png',
      description: '대표님과 금기적인 오피스 로맨스',
      genres: 'Romance',
      tags: ['Office love', 'Comedy']
    },
    {
      id: '3',
      link: '/view_webnovels?id=28',
      title: '대표님이 사랑한 두명의 나',
      imageUrl: '/carousel/webnovels/carousel_3.png',
      imageUrl_mobile: '/carousel/webtoons/carousel_3_mobile.png',
      description: '두명의 나와 대표님과의 러브 스토리',
      genres: 'Romance',
      tags: ['Ongoing', 'lovely']
    },
    {
      id: '4',
      link: '/view_webnovels?id=29',
      title: 'Attaque',
      imageUrl: '/carousel/webnovels/carousel_4.png',
      imageUrl_mobile: '/carousel/webtoons/carousel_4_mobile.png',
      description: '큐트 러블리 커플의 로맨틱 코미디',
      genres: 'Romance',
      tags: ['Free', 'Comedy']
    }
  ];

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
    // imageUrl: isMobile ? (item.imageUrl_mobile || item.imageUrl) : item.imageUrl
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