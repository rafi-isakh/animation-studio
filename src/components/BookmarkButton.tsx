'use client'
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

const BookmarkButton = () => {
  const [isVisible, setIsVisible] = useState(true);
  let scrollTimeout: NodeJS.Timeout | null = null;

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(false);

      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      scrollTimeout = setTimeout(() => {
        setIsVisible(true);
      }, 200); // Adjust the timeout as needed
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, []);

  return (
    <button
    className={`text-[12px] text-gray-700 dark:text-gray-700 fixed bottom-0 left-0 right-0 mx-auto mb-4 w-52 max-w-md flex flex-row items-center justify-center bg-white border-2 border-gray-300 rounded-full px-3 py-2 hover:border-pink-600 hover:text-pink-600 dark:hover:text-pink-600 shadow-md md:hidden transition-opacity duration-300 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}
    style={{ zIndex: 1000 }}
      >
      <Image
        src="/images/N_logo.svg"
        alt="Toonyz Logo"
        width={0}
        height={0}
        sizes="100vh"
        style={{
          marginRight: '8px',
          height: '15px',
          width: '15px',
          padding: '1px',
          justifyContent: 'center',
          alignSelf: 'center',
          borderRadius: '25%',
        }}
      />
      Bookmark Us Now! 
      <div className='mt-[0.9px]'>
        <ChevronRight size={20} className='text-gray-400 hover:text-pink-600 dark:hover:text-pink-600'/>
      </div>
    </button>
  );
};

export default BookmarkButton;