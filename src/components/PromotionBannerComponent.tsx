'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';
import { useMediaQuery } from 'react-responsive';
import { useTheme } from '@/contexts/providers';
import { ArrowRight } from 'lucide-react';

const PromotionBannerComponent = () => {
  const [selectedComponent, setSelectedComponent] = useState<number>(0);
  const { dictionary, language } = useLanguage();
  const isDesktop = useMediaQuery({ query: '(min-width: 768px)' });
  const [bannerWidth, setBannerWidth] = useState(144);
  const [bannerHeight, setBannerHeight] = useState(110);
  const [logoWidth, setLogoWidth] = useState(141);
  const [logoHeight, setLogoHeight] = useState(32);
  const { isDarkMode } = useTheme();

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
    return (
      <Link href='https://www.instagram.com/stelland_official/'>
        <div
          className='flex flex-row justify-center rounded-md md:max-w-screen-xl sm:w-[100vw] w-[100vw] bg-gray-100 dark:bg-gray-500 mx-auto gap-6 pt-3 '
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className='flex flex-col justify-center md:p-0 pl-5'>
            <Image
              src={isDarkMode ? '/toonyz_logo_pink.svg' : '/toonyzLogo.png'}
              // src='/toonyzLogo.png' 
              // src={isHovered ? '/toonyzLogo.png' : '/toonyz_logo_black.svg'} 
              alt='Toonyz logo'
              sizes="cover"
              width={logoWidth}
              height={logoHeight}
              className=''
            />
            <p className='md:text-base text-[10px]'>{phrase(dictionary, 'promotionInsta', language)}</p>
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

    <Link href='/creators' className="cursor-pointer">
      <div
        className='flex flex-row justify-center rounded-md md:max-w-screen-xl sm:w-[100vw] w-[100vw] bg-[#FFF0EC] dark:bg-[#FFF0EC] mx-auto gap-6 pt-3 pb-1'
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-row">
            <div className="flex flex-col justify-center items-center gap-1 text-sm font-pretendard">
              <p className="text-black text-center font-bold">
                {/* 투니즈의 크리에이터가 되어보세요! */}
                {phrase(dictionary, "applyCreator", language)}
              </p>
              <button className="flex flex-row justify-center items-center gap-1 border-black text-black border-2 px-2 py-0 rounded-md text-sm font-pretendard self-start">
                <span className="text-sm">
                  {/* 지금 신청하기 */}
                  {phrase(dictionary, "applyCreator_button", language)}
                </span>
                <ArrowRight className="w-4 h-4 text-black" />
              </button>
            </div>
            <Image
              src='/stelli/stelli_5.png'
              alt='Toonyz event banner'
              sizes="cover"
              width={0}
              height={0}
              className='relative -bottom-2 mx-auto z-10'
              style={{
                width: '100px',
                height: 'auto'
              }}
            />
          </div>
        </div>
      </div>
    </Link>
  );

  const ComponentThree: React.FC<{ isHovered: boolean; setIsHovered: React.Dispatch<React.SetStateAction<boolean>> }> = ({ isHovered, setIsHovered }) => {

    return (
      <div
        className='flex flex-row justify-center rounded-md md:max-w-screen-xl sm:w-[100vw] w-[100vw] bg-gray-100 dark:bg-gray-500 mx-auto gap-6 pt-3 pb-1'
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >

        <div className='flex md:flex-row flex-col gap-4 justify-center items-center md:p-5 p-4 px-10'>
          <Image
            src={isDarkMode ? '/toonyz_logo_pink.svg' : '/toonyzLogo.png'}
            alt='Toonyz logo'
            sizes="cover"
            width={logoWidth}
            height={logoHeight}
            className=''
          />
          {/* Begin exploring with the app today! */}
          {phrase(dictionary, 'promotionApp', language)}

          <div className='flex flex-row gap-4 justify-center md:p-0 md:pb-1 pb-2'>     {/* items-center */}

            <button className='flex flex-row justify-center items-center gap-1 bg-white dark:text-black rounded-md px-3 md:h-10 h-5 hover:bg-[#FFF0EC] md:text-base text-[10px]'>
              <i className="fab fa-apple"></i>
              <span className='md:block hidden'> iOS </span> Download
            </button>
            <button className='flex flex-row justify-center items-center gap-1 bg-white dark:text-black rounded-md px-3 md:h-10 h-5 hover:bg-[#FFF0EC] md:text-base text-[10px]'>
              <i className="fab fa-android text-[12px]"></i>
              <span className='md:block hidden'> Android </span> Download
            </button>
          </div>
        </div>
      </div>
    )
  };

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
    <div className='dark:text-white self-center max-w-screen-xl mx-auto'>
      <SelectedComponent isHovered={isHovered} setIsHovered={setIsHovered} />
    </div>
  );
};

export default PromotionBannerComponent;
