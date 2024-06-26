"use client"

import { useEffect, useState } from 'react';
import Image from "next/image"



interface Webnovel {
  id: number;
  title: string;
  cover_art: string;
}

const Webnovels = () => {
  const [webnovels, setWebnovels] = useState<Webnovel[]>([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/webnovels', {
        cache: "force-cache"
      })
      .then(response => response.json())
      .then(data => setWebnovels(data));
  }, []);

  return (
        <div className="snap-x overflow-x-scroll flex m-10">
          {webnovels.map((item, index) => (
          <div className="snap-center flex-shrink-0 w-80 p-4" key={index}>
            <Image src={`http://localhost:5000/api/images/${item.cover_art}`} width={200} height={120} alt={item.title} />
            <center><h3 className="text-lg font-semibold mb-2">{item.title}</h3></center>
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

