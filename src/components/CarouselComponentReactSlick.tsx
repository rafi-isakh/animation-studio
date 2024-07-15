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
            <div className="relative w-full h-[30rem] overflow-hidden" key={index} >
              <Image className="w-full h-full" src={`/upload/${item.image}`} layout="fill" objectFit="cover"  alt={item.description} />
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
}

export default CarouselComponentReactSlick;
