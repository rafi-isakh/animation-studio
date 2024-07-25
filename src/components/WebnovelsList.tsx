"use client"
import { SortBy, Webnovel } from '@/components/Types'
import { useEffect, useState } from 'react';
import WebnovelComponent from "@/components/WebnovelComponent"
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import moment from 'moment';

const WebnovelsList = ({ searchParams, sortBy }: { searchParams: { [key: string]: string | string[] | undefined }, sortBy: SortBy }) => {
  const [webnovels, setWebnovels] = useState<Webnovel[]>([]);
  const genre = searchParams.genre;
  const { dictionary, language } = useLanguage();

  let text = '';
  if (sortBy == 'views') {
    text = 'popularWebnovels'
  } else if (sortBy == 'likes') {
    text = 'likedWebnovels'
  } else if (sortBy == 'date') {
    text = 'latestWebnovels'
  }

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

  const sortByFn = (a: Webnovel, b: Webnovel): number => {
    if (sortBy == 'views') {
      return a.views - b.views
    } else if (sortBy == 'likes') {
      return a.upvotes - b.upvotes
    } else if (sortBy == 'date') {
      let latestDateA = new Date(0);
      let latestDateB = new Date(0);
      for (let i = 0; i < a.chapters.length; i++) {
        let dateA = moment(a.chapters[i].created_at).toDate();
        if (dateA > latestDateA) {
          latestDateA = dateA;
        }
      }
      for (let i = 0; i < b.chapters.length; i++) {
        let dateB = moment(b.chapters[i].created_at).toDate();
        if (dateB > latestDateB) {
          latestDateB = dateB;
        }
      }
      if (latestDateA > latestDateB) {
        return 1;
      } else if (latestDateA == latestDateB) {
        return 0;
      } else {
        return -1;
      }
    } else {
      return 0;
    }
  }


  return (
    <div className='max-w-screen-xl mx-auto flex flex-col'>
      <div className='text-2xl md:text-4xl p-2 font-bold'>
        {(webnovels.length > 0) ?
          phrase(dictionary, text, language) : <></>
        } 
      </div>
      <div className="flex justify-start grow md:grow-0 mt-4 overflow-x-scroll">
        {webnovels
          .filter(item => filter_by_genre(item))
          .sort(sortByFn)
          .map((item, index) => (
            <div className="min-w-[120px] min-h-[73px] md:min-w-[300px] md:min-h-[180px] p-2 overflow-y-hidden" key={index}>
              <WebnovelComponent webnovel={item} index={index} ranking={true} width={300} height={180} />
            </div>
          ))}
      </div>
    </div>
  )
};

export default WebnovelsList;