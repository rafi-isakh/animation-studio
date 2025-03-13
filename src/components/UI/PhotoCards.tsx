
import React from 'react';
import Image from 'next/image';
import { getImageUrl } from '@/utils/urls';

const PhotoCards = ({ images }: {images: string[]}) => {

  return (
    <div className="w-full bg-black flex justify-start items-center border-0 shadow-none">
      <div className="relative w-full h-96 perspective-1000">
        {/* First Photo */}
        <div className="absolute w-24 h-24 rounded-3xl shadow-xl bg-blue-100 overflow-hidden 
                      top-5 left-32 z-40 -rotate-6 transition-all duration-500 ease-in-out
                      hover:-translate-y-3">
          <div className="relative w-full h-full">
            <Image
              src={`data:image/png;base64,${images[0]}`}
              alt="image"
              fill
              sizes="(max-width: 768px) 100vw, 256px"
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Second Photo */}
        <div className="absolute w-24 h-24 rounded-3xl shadow-xl bg-blue-100 overflow-hidden 
                      top-2 left-10 z-30 rotate-3 transition-all duration-500 ease-in-out
                      hover:-translate-y-3">
          <div className="relative w-full h-full">
            <Image
              src={`data:image/png;base64,${images[1]}`}
              alt="Water feature with lilies"
              fill
              sizes="(max-width: 768px) 100vw, 256px"
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Third Photo */}
        <div className="absolute w-24 h-24 rounded-3xl shadow-xl bg-blue-100 overflow-hidden 
                      -top-2 left-44 z-20 -rotate-6 transition-all duration-500 ease-in-out
                      hover:-translate-y-3  ">
          <div className="relative w-full h-full">
            <Image
              src={`data:image/png;base64,${images[2]}`}
              alt="Lily arrangement"
              fill
              sizes="(max-width: 768px) 100vw, 256px"
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Fourth Photo */}
        <div className="absolute w-24 h-24 rounded-3xl shadow-xl bg-blue-100 overflow-hidden 
                      top-5 left-120 z-10 rotate-12 transition-all duration-500 ease-in-out
                      hover:-translate-y-3 ">
          <div className="relative w-full h-full">
            <Image
              src={`data:image/png;base64,${images[3]}`}
              alt="Field of lilies"
              fill
              sizes="(max-width: 768px) 100vw, 256px"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoCards;