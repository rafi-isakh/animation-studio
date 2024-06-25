// components/CarouselComponent.tsx
import React from 'react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import styles from '@/styles/CarouselComponent.module.css';


interface CarouselItem {
  id: number;
  title: string;
  cover_art: string;
}

interface CarouselComponentProps {
  items: CarouselItem[];
  type: 'Webtoon' | 'Webnovel';
}

const CarouselComponent: React.FC<CarouselComponentProps> = ({ items, type }) => {
  const settings = {
    className: "center",
    centerPadding: "60px",
    slidesToShow: 5,
    swipeToSlide: true,
    afterChange: function(index: number) {
      console.log(
        `Slider Changed to: ${index + 1}, background: #222; color: #bada55`
      );
    }
  };
  return (
    <div>
      <Slider {...settings}>
        {items.map((item, index) => (
          <div key={index}>
            <center><h3>{item.title}</h3></center>
            <img className={styles.carouselItem} src={`http://localhost:5000/api/images/${item.cover_art}`} alt={item.title} />
          </div>
        ))}
      </Slider>
    </div>
  );
}

export default CarouselComponent;
