"use client"
import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import Image from 'next/image';
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import OtherTranslateComponent from '@/components/OtherTranslateComponent';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { Box, useMediaQuery } from "@mui/material";

import { SlickCarouselItem } from '@/components/Types';

const WebtoonsRecommendationCarousel = ({ carouselItems }: { carouselItems: SlickCarouselItem[] }) => {
  const { dictionary, language } = useLanguage();
  const [tabValue, setTabValue] = useState('1');
  const isMediumScreen = useMediaQuery('(min-width:768px)')
  console.log(carouselItems)

  const settings = {
    dots: false,
    swipeToSlide: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    // adaptiveHeight: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
        }
      }
    ]
  };

  // function SampleNextArrow(props: any) {
  //   const { onClick } = props;
  //   return (
  //     <div className="absolute top-1/2 right-0 transform -translate-y-1/2 z-50">
  //       <button
  //         className="bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors duration-300"
  //         onClick={onClick}
  //       >
  //         <ChevronRight className="w-6 h-6 text-white" />
  //       </button>
  //     </div>
  //   );
  // }

  // function SamplePrevArrow(props: any) {
  //   const { onClick } = props;
  //   return (
  //     <div className="absolute top-1/2 left-0 transform -translate-y-1/2 z-50">
  //       <button
  //         className="bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors duration-300"
  //         onClick={onClick}
  //       >
  //         {/* w-6 h-6 */}
  //         <ChevronLeft className="w-6 h-6 text-white" />
  //       </button>
  //     </div>
  //   );
  // }

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };


  return (
    <div 
      className={`slider-container relative max-w-screen-lg mx-auto overflow-hidden`}
    >
      <h1 className='flex flex-row justify-between text-xl font-extrabold mb-3'>
         {/* Recommended Webnovels */}
         {phrase(dictionary, "recommendedWebtoons", language)}
      </h1>

      <TabContext value={tabValue} >
        <Box sx={{ borderBottom: 0, borderColor: 'none' }}>
            <div className="flex flex-row justify-between items-center">
                <TabList 
                    onChange={handleChange} 
                    aria-label="lab API tabs"
                    TabIndicatorProps={{
                      style: {
                        backgroundColor: 'transparent',
                      },
                    }}
                    sx={{
                        '& button': {
                          margin: '0px 10px 0px 0px',
                          borderRadius: '100px',
                          minHeight: '25px', // Set your desired height here
                          height: '25px', // Set your desired height here
                        },
                        '& button:focus': {
                          color: 'white',
                          backgroundColor: '#e5e7eb',
                          // text-gray-200 #e5e7eb
                          // gray-500 #6b7280
                        },
                        '& button:active': {
                          color: 'white',
                          backgroundColor: '#e5e7eb',
                        },
                        '& button:hover': {
                          color: 'white',
                          backgroundColor: '#e5e7eb',
                        },
                        '& .MuiTab-root': {
                          // padding: '0px 10px',
                          color: 'gray', // Default tab color
                          '&.Mui-selected': {
                              backgroundColor: '#e5e7eb',
                              color: '#6b7280', // Color when tab is selected
                          },
                        },
                        '& .MuiTabs-indicator': {
                          backgroundColor: '#e5e7eb', // Indicator color
                        }
                    }}
                   >
                    <Tab label={phrase(dictionary, "all", language)} value="1"/>
                    <Tab label={phrase(dictionary, "bl", language)} value="2" />
                    <Tab label={phrase(dictionary, "fantasy", language)} value="3"  />
                </TabList>
                <div className='self-center text-sm md:block hidden'>
                    {/* <button 
                    className="bg-white text-black hover:text-[#8A2BE2] px-2 py-1 rounded-md flex flex-row items-center gap-2"> 
                    </button> */}
                </div>
            </div>
        </Box>

        <TabPanel value="1" sx={{ padding: 0, margin: 0 }}>
            <div className="h-[380px]">
            <Slider {...settings}>
              {carouselItems.map((item) => (
                <div key={item.id} className="px-2">
                  <div className="relative h-[380px]">
                    <Image
                      src={item.image_mobile}
                      alt={item.title}
                      layout="fill"
                      className="rounded-md w-full h-full overflow-hidden object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-4 rounded-md">
                      <h2 className="text-lg font-bold">{item.title}</h2>
                      <p className="text-sm">{item.hook}</p>
                      <div className="flex mt-2">
                        {item.parsed_tags.map((tag, index) => (
                          <span key={index} className="bg-white/20 text-xs px-2 py-1 rounded-full mr-2">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        </TabPanel>
        <TabPanel value="2" sx={{ padding: 0, margin: 0 }}>
        <div className="h-[380px]">
            <Slider {...settings}>
              {carouselItems.map((item) => (
                <div key={item.id} className="px-2">
                  <div className="relative h-[380px]">
                    <Image
                      src={item.image_mobile}
                      alt={item.title}
                      sizes="100vw"
                      layout="fill"
                      className="rounded-md w-full h-full overflow-hidden object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-4 rounded-md">
                      <h2 className="text-lg font-bold">{item.title}</h2>
                      <p className="text-sm">{item.hook}</p>
                      <div className="flex mt-2">
                        {item.parsed_tags.map((tag, index) => (
                          <span key={index} className="bg-white/20 text-xs px-2 py-1 rounded-full mr-2">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        </TabPanel>
        <TabPanel value="3" sx={{ padding: 0, margin: 0 }}>
        <div className="h-[380px]">
            <Slider {...settings}>
              {carouselItems.map((item) => (
                <div key={item.id} className="px-2">
                  <div className="relative h-[380px]">
                    <Image
                      src={item.image_mobile}
                      alt={item.title}
                      sizes="100vw"
                      layout="fill"
                      className="rounded-md w-full h-full overflow-hidden object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-4 rounded-md">
                      <h2 className="text-lg font-bold">{item.title}</h2>
                      <p className="text-sm">{item.hook}</p>
                      <div className="flex mt-2">
                        {item.parsed_tags.map((tag, index) => (
                          <span key={index} className="bg-white/20 text-xs px-2 py-1 rounded-full mr-2">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        </TabPanel>

      </TabContext>
    </div>
  );
};

export default WebtoonsRecommendationCarousel;
