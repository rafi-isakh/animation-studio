"use client"
// components/CarouselComponent.tsx
import React, { useEffect, useState } from 'react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Image from 'next/image'
import '@/styles/CarouselComponent.module.css';
import { SlickCarouselItem } from '@/components/Types'

const CarouselComponentReactSlick = () => {
  const [carouselItems, setCarouselItems] = useState<SlickCarouselItem[]>([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/get_carousel_items')
      .then(response => response.json())
      .then(data => setCarouselItems(data));
  }, []);

  function SampleNextArrow(props) {
    const { className, style, onClick } = props;
    return (
      <div
        className={className}
        style={{ ...style, display: "block", zIndex: "10", transform: 'translateX(-50px)'}} // Change to desired color and size
        onClick={onClick}
      />
    );
  }
  function SamplePrevArrow(props) {
    const { className, style, onClick } = props;
    return (
      <div
        className={className}
        style={{ ...style, display: "block", zIndex: "10", transform: 'translateX(50px)'}}
        onClick={onClick}
      />
    );
  }

  const settings = {
    slidesToShow: 1,
    centerMode: true,
    swipeToSlide: true,
    infinite: true,
    dots: true,
    nextArrow: <SampleNextArrow/>,
    prevArrow: <SamplePrevArrow/>
  };
  return (
    <div className='flex max-w-screen-2xl justify-center mx-auto items-center'>
      <div className="max-w-full md:w-4/5 lg:w-3/5">
        <Slider {...settings}>
          {carouselItems.map((item, index) => (
            <div key={index}>
              <Image src={`/upload/${item.image}`} width={1020} height={402} alt={item.image} />
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
}

export default CarouselComponentReactSlick;
