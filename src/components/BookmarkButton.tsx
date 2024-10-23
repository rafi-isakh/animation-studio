import Image from 'next/image';
import { ChevronRight } from 'lucide-react';


const BookmarkButton = () => {
  return (
    <button
      className='text-[12px] fixed bottom-0 left-0 right-0 mx-auto mb-4 w-52 max-w-md flex flex-row items-center justify-center bg-white border-2 border-gray-300 rounded-full px-3 py-2 hover:border-pink-600 hover:text-pink-600 shadow-md md:hidden'
      style={{ zIndex: 1000 }}
    >
      <Image
        src="/N_Logo.png"
        alt="Toonyz Logo"
        width={0}
        height={0}
        sizes="100vh"
        style={{
          marginRight: '8px',
          height: '15px',
          width: '15px',
          justifyContent: 'center',
          alignSelf: 'center',
          borderRadius: '25%',
        }}
      />
      Bookmark Us Now! <ChevronRight size={20} className='text-gray-400'/>
    </button>
  );
};

export default BookmarkButton;