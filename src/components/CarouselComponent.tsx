"use client"
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getLocalImageUrl } from '@/utils/urls';
import { SlickCarouselItem } from '@/components/Types';
import { Webnovel } from '@/components/Types';
import Image from 'next/image';
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import OtherTranslateComponent from '@/components/OtherTranslateComponent';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { Box } from "@mui/material";


const CarouselComponent = ({ searchParams, webnovels, items }: { 
  searchParams: { [key: string]: string | string[] | undefined }, 
  items: SlickCarouselItem[], 
  webnovels: Webnovel[] 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const { dictionary, language } = useLanguage();
  // Calculate the number of slides needed
  const totalSlides = Math.ceil(items.length / 3); // For larger screens
  const totalMobileSlides = items.length; 
  const [tabValue, setTabValue] = useState('1');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!isHovered) {
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === totalSlides - 1 ? 0 : prevIndex + 1
        );
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isHovered, totalSlides]);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === totalSlides - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? totalSlides - 1 : prevIndex - 1
    );
  };

  // Function to get current slide items
  const getCurrentSlideItems = () => {
    const start = currentIndex * 3;
    return items.slice(start, start + 3);
  };

  const getCurrentMobileSlideItem = () => {
    return items[currentIndex];
  };

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };


  return (
    <div 
      className="relative max-w-screen-xl mx-auto overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h1 className='flex flex-row justify-between text-xl font-extrabold mb-3'>
         {/* Recommended Webnovels */}
         {phrase(dictionary, "recommendedWebnovels", language)}
      </h1>

      <TabContext value={tabValue} >
        <Box sx={{ borderBottom: 0, borderColor: 'none' }} className='dark:text-gray-700'>
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
                          backgroundColor: '#8A2BE2',
                        },
                        '& button:active': {
                          color: 'white',
                          backgroundColor: '#8A2BE2',
                        },
                        '& button:hover': {
                          color: 'white',
                          backgroundColor: '#8A2BE2',
                        },
                        '& .MuiTab-root': {
                          // padding: '0px 10px',
                          color: 'gray', // Default tab color
                          '&.Mui-selected': {
                              backgroundColor: '#8A2BE2',
                              color: 'white', // Color when tab is selected
                          },
                        },
                        '& .MuiTabs-indicator': {
                          backgroundColor: '#8A2BE2', // Indicator color
                        }
                    }}
                   >
                    <Tab label={phrase(dictionary, "all", language)} value="1"/>
                    <Tab label={phrase(dictionary, "bl", language)} value="2" />
                    <Tab label={phrase(dictionary, "fantasy", language)} value="3"  />
                    <Tab label={phrase(dictionary, "romance", language)} value="4"  />
                    <Tab label={phrase(dictionary, "sf", language)} value="5"  />
                </TabList>
                <div className='self-center text-sm md:block hidden'>
                    {/* <button 
                    className="bg-white text-black hover:text-[#8A2BE2] px-2 py-1 rounded-md flex flex-row items-center gap-2"> 
                    </button> */}
                </div>
            </div>
        </Box>

        <TabPanel value="1">
       {/* Main carousel */}
       <div 
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
       >
        {/* Desktop view */}
        <div className="hidden md:flex w-full">
          {Array.from({ length: totalSlides }).map((_, slideIndex) => (
            <div 
              key={slideIndex}
              className="min-w-full h-[350px] flex gap-4" 
            >
              {items.slice(slideIndex * 3, (slideIndex * 3) + 3).map((item, itemIndex) => (
                <div 
                  key={item.id}
                  className="flex-1 relative rounded-sm overflow-hidden"
                >
                  <Image
                    src={getLocalImageUrl(item.image)}
                    fill
                    sizes="(max-width: 768px) 33vw, 25vw"
                    alt={item.image}
                    className="object-cover rounded-sm"
                    priority={slideIndex === 0}
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                    <h2 className="text-white dark:text-white text-lg font-bold">
                      {/* {item.title} */}
                     <OtherTranslateComponent
                        key={`title-${item.id}-${language}`}
                        content={item.title}
                        elementId={item.id.toString()}
                        classParams={`md:text-xl lg:text-xl text-sm !min-[400px]:text-[12px] font-extrabold text-white dark:text-white`}
                        elementType={'carouselItem'}
                        elementSubtype="title"
                        showLoading={false}
                    />
                      </h2>
                    <OtherTranslateComponent 
                      key={`hook-${item.id}-${language}`}
                      content={item.hook}
                      elementId={item.id.toString()}
                      classParams={`md:text-sm lg:text-sm !min-[400px]:text-[12px] text-white dark:text-white`}
                      elementType={'carouselItem'}
                      elementSubtype="hook"
                      showLoading={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

         {/* Mobile view */}
         <div className="flex md:hidden w-full">
              {items.map((item, slideIndex) => (
                <div 
                  key={item.id}
                  className="min-w-full h-[350px] flex gap-4 px-4"
                >
                  <div 
                    className="flex-1 relative rounded-xl overflow-hidden"
                  >
                    <Image
                      src={getLocalImageUrl(item.image)}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      alt={item.image}
                      className="object-cover rounded-sm"
                      priority={slideIndex === 0}
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                      <h2 className="text-white dark:text-white text-lg font-bold">
                        <OtherTranslateComponent
                          key={`title-${item.id}-${language}`}
                          content={item.title}
                          elementId={item.id.toString()}
                          classParams={`md:text-xl lg:text-xl text-sm !min-[400px]:text-[12px] font-extrabold text-white dark:text-white`}
                          elementType={'carouselItem'}
                          elementSubtype="title"
                          showLoading={false}
                        />
                      </h2>
                      <OtherTranslateComponent 
                        key={`hook-${item.id}-${language}`}
                        content={item.hook}
                        elementId={item.id.toString()}
                        classParams={`md:text-sm lg:text-sm !min-[400px]:text-[12px] text-white dark:text-white`}
                        elementType={'carouselItem'}
                        elementSubtype="hook"
                        showLoading={false}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

     
      {/* Indicators */}
      <div className=''>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              currentIndex === index ? 'bg-white w-6' : 'bg-white/50'
            }`}
          />
        ))}
          </div>

        <div className='absolute bottom-2 right-1 flex text-white text-[10px] font-bold'>
          <div className="flex">
            <button
              onClick={handlePrev}
              className="bg-black/50 p-2 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="w-2 h-2" />
            </button>
            <button
              onClick={handleNext}
              className="bg-black/50 p-2 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="w-2 h-2" />
            </button>
          </div>
        </div>
        
      </div>

        </TabPanel>

        <TabPanel value="2">
        </TabPanel>
        
        <TabPanel value="3">
        </TabPanel>
      </TabContext>
    </div>
  );
};

export default CarouselComponent;
