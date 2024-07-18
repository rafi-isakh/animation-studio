"use client"
import { Webnovel } from '@/components/Types'
import { useEffect, useState } from 'react';
import WebnovelComponent from "@/components/WebnovelComponent"

const Webnovels = ({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) => {
  const [webnovels, setWebnovels] = useState<Webnovel[]>([]);
  const genre = searchParams.genre;
  if (typeof genre === 'string') {
  } else if (Array.isArray(genre)) {
    throw new Error("there should be only one genre param")
  } else {
  }

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovels`)
      .then(response => response.json())
      .then(data => setWebnovels(data));
  }, []);

  const filter_by_genre = (item: Webnovel) => {
    if (genre == "All" || genre == null) {
      return item;
    }
    else {
      if (genre == item.genre) {
        return item;
      }
    }
  }

  return (
    <div className="max-w-screen-xl mx-auto snap-x overflow-x-scroll flex m-4">
      {webnovels
        .filter(item => filter_by_genre(item))
        .map((item, index) => (
          <div className="max-w-screen-sm flex-grow min-w-[120px] min-h-[73px] mx-auto snap-center p-4" key={index}>
            <center>
              <WebnovelComponent webnovel={item} />
            </center>
          </div>
        ))}
    </div>
  )
};

export default Webnovels;