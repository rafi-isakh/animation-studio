"use client"
import { Webnovel } from '@/components/Types'
import { useEffect, useState } from 'react';
import WebnovelComponent from "@/components/WebnovelComponent"
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';

const PopularWebnovels = ({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) => {
  const [webnovels, setWebnovels] = useState<Webnovel[]>([]);
  const genre = searchParams.genre;
  const { dictionary, language } = useLanguage();
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
    <div className='max-w-screen-xl mx-auto flex flex-col'>
      <div className='text-2xl p-2 font-bold'>
        {phrase(dictionary, 'popularWebnovels', language)}
      </div>
      <div className="flex justify-start grow md:grow-0 mt-4 overflow-y-visible overflow-x-scroll">
        {webnovels
          .filter(item => filter_by_genre(item))
          .sort((a, b) => b.views - a.views)
          .map((item, index) => (
            <div className="min-w-[120px] min-h-[73px] snap-center p-2" key={index}>
              <WebnovelComponent webnovel={item} index={index} ranking={true} width={300} height={180}/>
            </div>
          ))}
      </div>
    </div>
  )
};

export default PopularWebnovels;