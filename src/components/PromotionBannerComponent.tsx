'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';
import { useMediaQuery } from 'react-responsive';

const PromotionBannerComponent = () => {
  const [selectedComponent, setSelectedComponent] = useState<number>(0);
  const { dictionary, language } = useLanguage();
  const isDesktop = useMediaQuery({ query: '(min-width: 768px)' });
  const [bannerWidth, setBannerWidth] = useState(144);
  const [bannerHeight, setBannerHeight] = useState(110);
  const [logoWidth, setLogoWidth] = useState(141);
  const [logoHeight, setLogoHeight] = useState(32);

  useEffect(() => {
    if (isDesktop) {
        setLogoWidth(141);
        setLogoHeight(32);
    } else {
        setLogoWidth(106);
        setLogoHeight(24);
    }
}, [isDesktop]);

  useEffect(() => {
    if (isDesktop) {
        setBannerWidth(141);
        setBannerHeight(110);
    } else {
        setBannerWidth(106);
        setBannerHeight(90);
    }
}, [isDesktop]);


  const ComponentOne: React.FC<{ isHovered: boolean; setIsHovered: React.Dispatch<React.SetStateAction<boolean>> }> = ({ isHovered, setIsHovered }) => {
   return(
    <Link href='https://www.instagram.com/stelland_official/'>
      <div 
        className='flex flex-row justify-center rounded-xl md:w-[1280px] sm:w-[100vw] w-[100vw] bg-pink-100 mx-auto gap-6 pt-3'
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className='flex flex-col justify-center md:p-0 pl-5'>
          <Image
            src='/toonyzLogo.png' 
            // src={isHovered ? '/toonyzLogo.png' : '/toonyz_logo_black.svg'} 
            alt='Toonyz logo'
            sizes="cover"
            width={logoWidth}
            height={logoHeight}
            className=''
          />
          <p>{phrase(dictionary, 'promotionInsta', language)}</p>
        </div>
        <div className='md:p-0'>
          <Image 
            src='/toonyz_event_screen.png'
            alt='Toonyz banner image'
            sizes="100vw"
            width={bannerWidth}
            height={bannerHeight}
            className=''
          />
        </div>
      </div>
    </Link>
   ) 
  }

  const ComponentTwo: React.FC<{ isHovered: boolean; setIsHovered: React.Dispatch<React.SetStateAction<boolean>> }> = ({ isHovered, setIsHovered }) => (    
    <div 
      className='flex flex-row justify-center rounded-xl md:w-[1280px] sm:w-[100vw] w-[100vw] bg-purple-100 mx-auto gap-6 pt-3  pb-1'
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className='flex flex-col justify-center justify-none md:p-0'>
        <Image 
          src='/stelli_2.png'
          alt='Toonyz banner image'
          sizes="100vw"
          quality={85}
          width={bannerWidth}
          height={bannerHeight}
          className=''
        /> 
      </div>
      <div className='flex flex-col justify-center md:p-0'>
        <Image 
          // src={isHovered ? '/toonyzLogo.png' : '/toonyz_logo_black.svg'} 
          src='/toonyzLogo.png'
          alt='Toonyz logo'
          sizes="cover"
          width={logoWidth}
          height={logoHeight}
          className=''
        />
        <p>{phrase(dictionary, 'promotionApplyAuthor', language)}</p>
      </div>
    </div>
  );

  const ComponentThree: React.FC<{ isHovered: boolean; setIsHovered: React.Dispatch<React.SetStateAction<boolean>> }> = ({ isHovered, setIsHovered }) => {
    
    return (    
    <div 
      className='flex flex-row justify-center rounded-xl md:w-[1280px] sm:w-[100vw] w-[100vw] bg-gray-100 mx-auto gap-6 pt-3 pb-1'
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >

      <div className='flex md:flex-row flex-col gap-4 justify-center items-center md:p-5 p-4 px-10'>
             <Image
                src='/toonyzLogo.png' 
                // src={isHovered ? '/toonyzLogo.png' : '/toonyz_logo_black.svg'} 
                alt='Toonyz logo'
                sizes="cover"
                width={logoWidth}
                height={logoHeight}
                className=''
                /> 
            {/* Begin exploring with the app today! */}
            {phrase(dictionary, 'promotionApp', language)} 

        <div className='flex flex-row gap-4 justify-center md:p-0 md:pb-1 pb-2'>     {/* items-center */}
               
            <button className='flex flex-row justify-center items-center gap-1 bg-white rounded-xl px-3 md:h-10 h-5 hover:bg-purple-100 md:text-base text-[10px]'>
                <i className="fab fa-apple"></i> 
                  <span className='md:block hidden'> iOS </span> Download
                </button>
                <button className='flex flex-row justify-center items-center gap-1 bg-white rounded-xl px-3 md:h-10 h-5 hover:bg-purple-100 md:text-base text-[10px]'>
                   <i className="fab fa-android text-[12px]"></i>
                    <span className='md:block hidden'> Android </span> Download
            </button>
        </div>
    </div>
  </div>
  )};

  const componentsArray = [ComponentOne, ComponentTwo, ComponentThree];

  const getRandomComponentIndex = (arrayLength: number) => {
    return Math.floor(Math.random() * arrayLength);
  };

  useEffect(() => {
    setSelectedComponent(getRandomComponentIndex(componentsArray.length));
  }, []);



  const SelectedComponent = componentsArray[selectedComponent];
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className='dark:text-black'>
      <SelectedComponent isHovered={isHovered} setIsHovered={setIsHovered} />
    </div>
  );
};

export default PromotionBannerComponent;
