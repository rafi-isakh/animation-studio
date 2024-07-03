"use client"
import { Webnovel } from '@/components/Types'
import { useEffect, useState } from 'react';
import WebnovelComponent from "@/components/WebnovelComponent"

const Webnovels = () => {
  const [webnovels, setWebnovels] = useState<Webnovel[]>([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/get_webnovels')
      .then(response => response.json())
      .then(data => setWebnovels(data));
  }, []);

  return (
        <div className="scrollbar-hide max-w-screen-xl mx-auto snap-x overflow-x-scroll flex m-10">
          {webnovels.map((item, index) => (
          <div className="max-w-screen-sm flex mx-auto snap-center flex-shrink-0 w-80 p-4" key={index}>
            <center>
              <WebnovelComponent webnovel={item}/>
            </center>
          </div>
        ))}
        </div>
      )

/*<CarouselComponent items={webnovels} type="Webnovel" />*/

  /*
  return (
    <div className={styles.gridContainer}>
      {webnovels.map(webnovel => (
        <div key={webnovel.id} className={styles.gridItem}>
          <img src={`http://localhost:5000/api/webnovels/images/${webnovel.cover_art}`} alt={webnovel.title} />
          <h3>{webnovel.title}</h3>  
        </div>
      ))}
    </div>
  );
  */
};

export default Webnovels;

