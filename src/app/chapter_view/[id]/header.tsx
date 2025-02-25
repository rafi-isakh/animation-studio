'use client';
import { useState, useEffect } from 'react';

const StickyHeader = () => {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // You can adjust this value to change when the header becomes sticky
      const scrollTrigger = 105;
      
      if (window.scrollY > scrollTrigger) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);

    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header 
      className={`
        p-4 w-full transition-all duration-300 ease-in-out
        ${isSticky 
          ? 'fixed top-0 bg-white shadow-md z-50' 
          : 'relative bg-gray-100'}
      `}
    >
      <div className="container mx-auto">
        
      </div>
    </header>
  );
};

export default StickyHeader;