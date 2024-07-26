"use client"
// components/CarouselComponent.tsx
import React, { useEffect, useState } from 'react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Image from 'next/image'
import styles from '@/styles/CarouselComponent.module.css';
import { SlickCarouselItem } from '@/components/Types'
import { getImageURL } from '@/utils/cloudfront';
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import OtherTranslateComponent from './OtherTranslateComponent';
import Link from 'next/link';


const CarouselComponentReactSlick = ({ items }: { items: SlickCarouselItem[] }) => {

  const [key1, setKey1] = useState(0);
  const [key2, setKey2] = useState(0);
  const [key3, setKey3] = useState(0);
  const [key4, setKey4] = useState(0);
  const [key5, setKey5] = useState(0);
  const [key6, setKey6] = useState(0);


  const { language, dictionary } = useLanguage();

  useEffect(() => {
    setKey1(prevKey => prevKey + 1);
    setKey2(prevKey => prevKey + 1);
    setKey3(prevKey => prevKey + 1);
    setKey4(prevKey => prevKey + 1);
    setKey5(prevKey => prevKey + 1);
    setKey6(prevKey => prevKey + 1);
  }, [language])

  function SampleNextArrow(props: any) {
    const { className, style, onClick } = props;
    return (
      <div
        className={className}
        style={{ ...style, display: "block", zIndex: "10", transform: 'translateX(-32px)' }}
        onClick={onClick}
      />
    );
  }
  function SamplePrevArrow(props: any) {
    const { className, style, onClick } = props;
    return (
      <div
        className={className}
        style={{ ...style, zIndex: "10", transform: 'translateX(32px)' }}
        onClick={onClick}
      />
    );
  }

  function getHref(index: number) {
    if (index == 0) {
      return '/view_webnovels?id=';
    } else if (index == 1) {
      return '/view_webnovels?id=';
    } else if (index == 2) {
      return '/view_webnovels?id=';
    }
    return '#';
  }

  const settings = {
    slidesToShow: 1,
    slidesToScroll: 1,
    swipeToSlide: true,
    infinite: true,
    speed: 1000,
    autoplay: true,
    className: "center",
    nextArrow: <SampleNextArrow />,
    prevArrow: <SamplePrevArrow />
  };
  return (
    <div className={`max-w-screen-xl w-full mx-auto items-center justify-center ${styles.carouselContainer}`}>
      <div>
        <Slider {...settings}>
          {items.map((item, index) => (
            <Link href={getHref(index)} key={index}>
              <div>
                <div className="relative w-full h-auto aspect-[10/5] md:aspect-[1280/500] max-w-[1280px] mx-auto overflow-hidden"  >
                  {index == 0 &&
                    <div>
                      <div className='absolute top-32 left-10 z-10 text-white text-4xl font-bold md:w-[400px] flex flex-wrap'>
                        <OtherTranslateComponent key={key1} content={item.title} elementId={item.id.toString()} elementType={'carouselItem'} elementSubtype='title' /></div>
                      <div className='absolute top-48 left-10 z-10 text-white text-lg font-bold md:w-[400px] flex flex-wrap'>
                        <OtherTranslateComponent key={key2} content={item.hook} elementId={item.id.toString()} elementType={'carouselItem'} elementSubtype='hook' /></div>
                    </div>}
                  {index == 1 &&
                    <div>
                      <div className='absolute top-64 right-20 z-10 text-black text-4xl font-bold md:w-[400px] flex flex-wrap'>
                        <OtherTranslateComponent key={key3} content={item.title} elementId={item.id.toString()} elementType={'carouselItem'} elementSubtype='title' /></div>
                      <div className='absolute top-80 right-20 z-10 text-black text-lg font-bold md:w-[400px] flex flex-wrap'>
                        <OtherTranslateComponent key={key4} content={item.hook} elementId={item.id.toString()} elementType={'carouselItem'} elementSubtype='hook' /></div>
                    </div>}
                  {index == 2 &&
                    <div>
                      <div className='absolute top-32 left-20 z-10 text-black text-4xl font-bold w-64 flex flex-wrap'>
                        <OtherTranslateComponent key={key5} content={item.title} elementId={item.id.toString()} elementType={'carouselItem'} elementSubtype='title' /></div>
                      <div className='absolute top-48 left-20 z-10 text-black text-lg font-bold w-64 flex flex-wrap'>
                        <OtherTranslateComponent key={key6} content={item.hook} elementId={item.id.toString()} elementType={'carouselItem'} elementSubtype='hook' /></div>
                    </div>}
                  <Image className="object-cover object-center w-full h-full rounded" src={getImageURL(item.image)} sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1280px" fill alt={item.description}
                    placeholder="blur" blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg=="
                  />
                </div>
              </div>
            </Link>
          ))}
        </Slider>
      </div>
    </div>
  );
}

export default CarouselComponentReactSlick;
