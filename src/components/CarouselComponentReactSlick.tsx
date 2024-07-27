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
  const [key2, setKey2] = useState(1000);
  const [key3, setKey3] = useState(2000);
  const [key4, setKey4] = useState(3000);
  const [key5, setKey5] = useState(4000);
  const [key6, setKey6] = useState(5000);


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
      return '/view_webnovels?id=2';
    } else if (index == 1) {
      return '/view_webnovels?id=4';
    } else if (index == 2) {
      return '/view_webnovels?id=6';
    }
    return '#';
  }

  const settings = {
    slidesToShow: 1,
    slidesToScroll: 1,
    swipeToSlide: true,
    infinite: true,
    speed: 1000,
    autoplaySpeed:6000,
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
                    <div className='relative'>
                      <div key={key1} className='absolute top-2 left-2 md:top-10 md:left-10 z-10 text-white md:text-4xl text-2xl font-bold w-[200px] md:w-[400px] flex flex-wrap'>
                        <OtherTranslateComponent content={item.title} elementId={item.id.toString()} 
                        elementType={'carouselItem'} elementSubtype='title' showLoading={false} /></div>
                      <div key={key2} className='absolute top-10 left-2 md:top-[7rem] md:left-10 z-10 text-white md:text-lg text-sm w-[230px] md:w-[400px] flex flex-wrap'>
                        <OtherTranslateComponent content={item.hook} elementId={item.id.toString()} 
                        elementType={'carouselItem'} elementSubtype='hook' showLoading={false} /></div>
                    </div>}
                  {index == 1 &&
                    <div className="relative">
                      <div key={key3} className='absolute top-4 right-2 md:top-64 md:right-20 z-10 text-black md:text-4xl text-2xl font-bold w-[200px] md:w-[400px] flex flex-wrap'>
                      <OtherTranslateComponent content={item.title} elementId={item.id.toString()} 
                      elementType={'carouselItem'} elementSubtype='title' showLoading={false} /></div>
                      <div key={key4} className='absolute top-16 right-2 md:top-80 md:right-20 z-10 text-black md:text-lg text-sm w-[200px] md:w-[400px] flex flex-wrap'>
                      <OtherTranslateComponent content={item.hook} elementId={item.id.toString()} 
                      elementType={'carouselItem'} elementSubtype='hook' showLoading={false}/></div>
                      </div>}
                  {index == 2 &&
                    <div className="relative">
                      <div key={key5} className='absolute top-2 md:top-10 left-6 md:left-10 z-10 text-black md:text-4xl text-2xl font-bold w-[200px] md:w-[400px] flex flex-wrap'>
                      <OtherTranslateComponent content={item.title} elementId={item.id.toString()} 
                      elementType={'carouselItem'} elementSubtype='title' showLoading={false}/></div>
                      <div key={key6} className='absolute top-14 md:top-[7rem] left-6 md:left-10 z-10 text-black md:text-lg text-sm w-[135px] md:w-[400px] flex flex-wrap'>
                      <OtherTranslateComponent content={item.hook} elementId={item.id.toString()} 
                      elementType={'carouselItem'} elementSubtype='hook' showLoading={false}/></div>
                      </div>}
                  <Image className="object-cover object-center w-full h-full rounded" src={getImageURL(item.image)}  fill alt={item.description}
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
