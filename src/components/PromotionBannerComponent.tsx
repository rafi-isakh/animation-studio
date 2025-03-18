'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';
import { useMediaQuery } from 'react-responsive';
import { useTheme } from '@/contexts/providers';
import { ArrowRight } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

export const AIPromotionComponent: React.FC = () => {
  const isDesktop = useMediaQuery({ query: '(min-width: 768px)' });
  const { dictionary, language } = useLanguage()
  const { stars } = useUser();

  const handleImageLoad = useCallback(() => {
    console.log('Image loaded successfully');
  }, []);

  const optimizedImage = useMemo(() => (
    <Image
      src='/stelli/stelli_8.svg'
      alt='Toonyz event banner'
      loading="eager"
      priority={true}
      sizes="cover"
      width={0}
      height={0}
      className='relative -bottom-1 mx-auto z-10'
      style={{
        width: isDesktop ? '100px' : '70px',
        height: 'auto'
      }}
      onLoad={handleImageLoad}
    />
  ), [isDesktop, handleImageLoad]); 


  return (
    <Link href='/stars' className="cursor-pointer">
      <div
        className='flex flex-row justify-center rounded-lg md:max-w-screen-xl  w-full bg-[#FFF0EC] dark:bg-[#FFF0EC] mx-auto gap-6 pb-1'
      >
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-row">
            <div className="flex flex-col justify-center items-start gap-1 text-sm font-pretendard">
              <p className="text-black text-center font-bold">
                {/* 투니즈 포스트를 즐겨보세요 */}
                {phrase(dictionary, "buyStars_promotion", language)}
              </p>
              <div className='flex flex-row gap-2 items-start justify-start' >
                <button disabled className="flex justify-center items-center gap-1 border-black text-black border-2 px-2 py-0 rounded-xl text-sm font-pretendard ">
                  <span className="text-sm">
                    {stars} stars
                  </span>
                </button>
                <button className="flex justify-center items-center gap-1 border-black text-black border-2 px-2 py-0 rounded-xl text-sm font-pretendard ">
                  <span className="text-sm">
                    {/* 지금 신청하기 */}
                    {phrase(dictionary, "buyStars", language)}
                  </span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </button>
              </div>
            </div>
            {optimizedImage}
          </div>
        </div>
      </div>
    </Link>
  );
};


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
      setLogoWidth(106);
      setLogoHeight(24);
    } else {
      setLogoWidth(90);
      setLogoHeight(20);
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



  // const ComponentOne: React.FC = () => {
  //   return (
  //     <Link href='https://www.instagram.com/toonyz_en'>
  //       <div
  //         className='flex flex-row justify-center rounded-lg md:max-w-screen-xl  w-full bg-gray-100 dark:bg-gray-500 mx-auto gap-6 '
  //       >
  //         <div className='flex flex-col justify-center md:p-0 pl-5'>
  //           <Image
  //             src={isDarkMode ? '/toonyz_logo_pink.svg' : '/toonyzLogo.png'}
  //             alt='Toonyz logo'
  //             sizes="cover"
  //             width={logoWidth}
  //             height={logoHeight}
  //             className=''
  //           />
  //           <p className='md:text-sm text-[10px]'>{phrase(dictionary, 'promotionInsta', language)}</p>
  //         </div>
  //         <div className='md:p-0'>
  //           <Image
  //             src='/toonyz_event_screen.png'
  //             alt='Toonyz banner image'
  //             sizes="100vw"
  //             width={bannerWidth}
  //             height={bannerHeight}
  //             className=''
  //           />
  //         </div>
  //       </div>
  //     </Link>
  //   )
  // }

  // const ComponentTwo: React.FC = () => (

  //   <Link href='/creators' className="cursor-pointer">
  //     <div
  //       className='flex flex-row justify-center rounded-lg md:max-w-screen-xl  w-full bg-[#FFF0EC] dark:bg-[#FFF0EC] mx-auto gap-6 pb-1'
  //     >
  //       <div className="flex items-center justify-center h-full">
  //         <div className="flex flex-row">
  //           <div className="flex flex-col justify-center items-center gap-1 text-sm font-pretendard">
  //             <p className="text-black text-center font-bold">
  //               {/* 투니즈의 크리에이터가 되어보세요! */}
  //               {phrase(dictionary, "applyCreator", language)}
  //             </p>
  //             <button className="flex flex-row justify-center items-center gap-1 border-black text-black border-2 px-2 py-0 rounded-xl text-sm font-pretendard self-start">
  //               <span className="text-sm">
  //                 {/* 지금 신청하기 */}
  //                 {phrase(dictionary, "applyCreator_button", language)}
  //               </span>
  //               <ArrowRight className="w-4 h-4 text-black" />
  //             </button>
  //           </div>
  //           <Image
  //             src='/stelli/stelli_5.png'
  //             alt='Toonyz event banner'
  //             sizes="cover"
  //             width={0}
  //             height={0}
  //             className='relative -bottom-1 mx-auto z-10'
  //             style={{
  //               width: isDesktop ? '100px' : '70px',
  //               height: 'auto'
  //             }}
  //           />
  //         </div>
  //       </div>
  //     </div>
  //   </Link>
  // );

  const ComponentThree: React.FC = () => {

    return (
      <div
        className='flex flex-row justify-center rounded-lg md:max-w-screen-xl  w-full bg-gray-100 dark:bg-gray-500 mx-auto gap-6 pb-1'
      >
        <div className='flex flex-col gap-4 justify-center items-center px-3 py-3 text-sm'>
          <Image
            src={isDarkMode ? '/toonyz_logo_pink.svg' : '/toonyzLogo.png'}
            alt='Toonyz logo'
            sizes="cover"
            width={logoWidth}
            height={logoHeight}
            className=''
          />
          <p className='text-center text-sm'>
            Advertise with our platform to reach more customers.</p>
        </div>
      </div>
    )
  };

  // ComponentOne, ComponentTwo, ComponentThree 
  // array of banner for promotion
  const componentsArray = [ComponentThree];

  const getRandomComponentIndex = (arrayLength: number) => {
    return Math.floor(Math.random() * arrayLength);
  };

  useEffect(() => {
    setSelectedComponent(getRandomComponentIndex(componentsArray.length));
  }, []);

  const SelectedComponent = componentsArray[selectedComponent];

  return (
    <div className='dark:text-white self-center max-w-screen-xl w-full mx-auto'>
      <SelectedComponent />
    </div>
  );
};

export default PromotionBannerComponent;

