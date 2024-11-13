import React, { useCallback } from 'react';
import Link from 'next/link';
import { Info } from 'lucide-react';
import { initialWebtoonContents } from '@/utils/curriculum';
import { getCloudfrontURL } from '@/utils/cloudfront';

const Billboard = () => {
    const webtoonContents = initialWebtoonContents.map(content => ({
        ...content,
        file_src: getCloudfrontURL(content.file_src)
    }));

  return (
    <div className="relative h-[56.25vw] -top-10">
      <video 
      poster='/curriculum/video_heroImage.png' 
      className="w-full h-[56.25vw] object-cover brightness-[60%] transition duration-500" 
      autoPlay muted loop src={webtoonContents[0]?.file_src}>
      </video>
      <div className="absolute top-[30%] md:top-[40%] ml-4 md:ml-16">
        <p className="text-white dark:text-white text-1xl md:text-5xl h-full w-full lg:text-2xl font-bold drop-shadow-xl">
            여러분의 꿈을 Toonyz와 함께 하세요!
        </p>
        <p className="text-white dark:text-white text-[8px] md:text-lg mt-3 md:mt-8 w-[90%] md:w-full lg:w-full drop-shadow-xl">
            Your Favorite Story Universe, Toonyz
        </p>
        <div className="flex flex-row items-center mt-3 md:mt-4 gap-3">
         
              <Link 
               className="
                bg-white
                text-white
                dark:text-white
                  bg-opacity-30 
                  rounded-md 
                  py-1 md:py-2 
                  px-2 md:px-4
                  w-auto 
                  text-xs lg:text-lg 
                  font-semibold
                  flex
                  flex-row
                  items-center
                  hover:bg-opacity-20
                  transition" 
                href='https://www.youtube.com/watch?v=f4iW6Rd5raM'>
                <Info className="w-4 md:w-7 mr-1" />
                More Info
              </Link>
       
        </div>
      </div>
    </div>
  )
}
export default Billboard;