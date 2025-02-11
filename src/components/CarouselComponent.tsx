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
import CarouselComponentReactSlick from '@/components/CarouselComponentReactSlick';

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
      className="relative max-w-screen-lg w-full mx-auto overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h1 className='flex flex-row justify-between text-xl font-extrabold mb-3'>
         {/* Recommended Webnovels */}
         {phrase(dictionary, "recommendedWebnovels", language)}
      </h1>

      <TabContext value={tabValue} >
        <Box sx={{ 
          width: '100%',
          // Remove any fixed width constraints
          '& .MuiTabs-root': {
            // minHeight: 'unset',
          },
          '& .MuiTabs-scroller': {
            overflow: 'auto !important', // Force overflow auto
            '&::-webkit-scrollbar': {
              height: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#888',
              borderRadius: '3px',
            },
          }
        }} >
            <div className="flex flex-row justify-between items-center md:overflow-visible overflow-x-auto">
                <TabList 
                    onChange={handleChange} 
                    aria-label="lab API tabs"
                    variant="scrollable"
                    scrollButtons="auto"
                    TabIndicatorProps={{
                      style: {
                        backgroundColor: 'transparent',
                      },
                    }}
                    sx={{
                        overflowX: { xs: 'auto', md: 'visible' }, 
                        '& button': {
                          margin: '0px 10px 0px 0px',
                          borderRadius: '100px',
                          minHeight: '25px', 
                          height: '25px',
                          whiteSpace: 'nowrap',
                        },
                        '& button:focus': {
                          color: 'white',
                          backgroundColor: '#e5e7eb',
                      
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
                    <Tab label={phrase(dictionary, "romance", language)} value="4"  />
                    <Tab label={phrase(dictionary, "sf", language)} value="5"  />
                </TabList>
                <div className='self-center text-sm md:block hidden'>
                  
                </div>
            </div>
        </Box>
  
        <TabPanel value="1" sx={{ padding: 0, margin: 0 }}>
            <div className="h-[380px]">
                <CarouselComponentReactSlick 
                    items={items} 
                    slidesToShow={3} 
                    showDots={false} 
                    centerPadding='0px' 
                />
            </div>
        </TabPanel>
        <TabPanel value="2" sx={{ padding: 0, margin: 0 }}>
            <div className="h-[380px]">
                <CarouselComponentReactSlick 
                    items={items} 
                    slidesToShow={3} 
                    showDots={false} 
                    centerPadding='0px' 
                />
            </div>
        </TabPanel>
        <TabPanel value="3" sx={{ padding: 0, margin: 0 }}>
            <div className="h-[380px]">
                <CarouselComponentReactSlick 
                    items={items} 
                    slidesToShow={3} 
                    showDots={false} 
                    centerPadding='0px' 
                />
            </div>
        </TabPanel>

        <TabPanel value="4" sx={{ padding: 0, margin: 0 }}>
            <div className="h-[380px]">
                <CarouselComponentReactSlick 
                    items={items} 
                    slidesToShow={3} 
                    showDots={false} 
                    centerPadding='0px' 
                />
            </div>
        </TabPanel>
        <TabPanel value="5" sx={{ padding: 0, margin: 0 }}>
            <div className="h-[380px]">
                <CarouselComponentReactSlick 
                    items={items} 
                    slidesToShow={3} 
                    showDots={false} 
                    centerPadding='0px' 
                />
            </div>
        </TabPanel>
       </TabContext>
    
    </div>
  );
};

export default CarouselComponent;
