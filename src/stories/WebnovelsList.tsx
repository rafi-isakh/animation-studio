import Image from "next/image";
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import _ from 'lodash';
import { ChevronLeft, ChevronRight } from "lucide-react"

const WebnovelsList = ({ items }: { items: any[] }) => {
  // Adjust chunk size to match grid layout
  const chunkedItems = _.chunk(items, 3);

  const settings = {
    dots: false,
    infinite: false,
    autoplay: false,
    slidesToShow: 3,
    slidesToScroll: 1,
    rows: 1, 
    slidesPerRow: 1,
    centerPadding: '0px',
    nextArrow: <SampleNextArrow />,
    prevArrow: <SamplePrevArrow />,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        }
      }
    ]
  };

  function SampleNextArrow(props: any) {
    const { onClick } = props;
    return (
      <button
        onClick={onClick}
        className='absolute md:-right-2 -right-5 top-1/2 -translate-y-1/2 z-50 rounded-full md:p-2 p-1 opacity-0 group-hover:opacity-80 transition-opacity duration-300 -translate-x-1/2 bg-white/80 '
      >
        <ChevronRight className="w-6 h-6 text-gray/80" />
      </button>
    )
  }

  function SamplePrevArrow(props: any) {
    const { onClick } = props;
    return (
      <button 
        onClick={onClick}
        className="absolute md:left-8 left-1 top-1/2 -translate-y-1/2 z-50 rounded-full md:p-2 p-1 opacity-0 group-hover:opacity-80 transition-opacity duration-300 -translate-x-1/2 bg-white/80 "
      >
        <ChevronLeft className="w-6 h-6 text-gray/80" />
      </button>
    );
  }

  return (
    <>
    <Slider {...settings} className="slider-container">
      {chunkedItems.map((chunk, chunkIndex) => (
        <div 
          key={chunkIndex} 
          className="grid grid-cols-2 gap-4 -z-10"
        >
          {chunk.map((item, index) => (
            <div
              key={`${chunkIndex}-${index}`}
              className="bg-white shadow rounded-lg overflow-hidden border border-gray-200 flex flex-row items-center"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-gray-700 mr-4">
                {chunkIndex * 3 + index + 1}
              </div>
              <Image
                src={item.image}
                alt={item.title}
                className="object-cover"
                width={100}
                height={100}
              />
              <div className="p-4 text-center">
                <h3 className="text-lg font-medium">{item.title}</h3>
                <p className="text-gray-500">{item.episode}</p>
                <div className="flex justify-center items-center mt-2">
                  <span className="text-yellow-500 font-bold">{item.score}</span>
                  <span className="text-gray-500 ml-2">({item.scoreCount})</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </Slider>
    <style jsx global>
            {`

                  .slider-container  {
                   
                     padding: 0px 30px 0px 0px;
                     transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
                      border-radius: 0.25rem;
                      
                  }

              
              `}
            </style>
    </>
  );
};

export default WebnovelsList;