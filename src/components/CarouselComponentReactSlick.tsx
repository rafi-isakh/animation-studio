"use client"
// components/CarouselComponent.tsx
import React, { useEffect, useState } from 'react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Image from 'next/image'
import styles from '@/styles/CarouselComponent.module.css';
import { SlickCarouselItem } from '@/components/Types'

const CarouselComponentReactSlick = () => {
  const placeholder : SlickCarouselItem = {
    image: "placeholder_blank.png",
    description: "placeholder"
  }
  const [carouselItems, setCarouselItems] = useState<SlickCarouselItem[]>([placeholder, placeholder]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_carousel_items`)
      .then(response => response.json())
      .then(data => setCarouselItems(data));
  }, []);

  function SampleNextArrow(props: any) {
    const { className, style, onClick } = props;
    return (
      <div
        className={className}
        style={{ ...style, display: "block", zIndex: "10", transform: 'translateX(-50px) scale(2)'}}
        onClick={onClick}
      />
    );
  }
  function SamplePrevArrow(props: any) {
    const { className, style, onClick } = props;
    return (
      <div
        className={className}
        style={{ ...style, display: "block", zIndex: "10", transform: 'translateX(50px) scale(2)'}}
        onClick={onClick}
      />
    );
  }

  const settings = {
    slidesToShow: 1,
    slidesToScroll: 1,
    swipeToSlide: true,
    infinite: true,
    speed: 500,
    autoplay: true,
    className: "center",
    nextArrow: <SampleNextArrow/>,
    prevArrow: <SamplePrevArrow/>
  };
  return (
    <div className={`max-w-screen-xl w-full mx-auto items-center justify-center ${styles.carouselContainer}`}>
      <div>
        <Slider {...settings}>
          {carouselItems.map((item, index) => (
            <div className="relative w-full h-auto aspect-[10/5] md:aspect-[1280/500] max-w-[1280px] mx-auto overflow-hidden" key={index} >
              <Image className="object-cover object-center w-full h-full rounded" src={`/upload/${item.image}`} sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1280px" fill  alt={item.description} 
                 placeholder="blur" blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg==" // 추가
              />
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
}

export default CarouselComponentReactSlick;
