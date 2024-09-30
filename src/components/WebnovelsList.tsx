"use client"
import { SortBy, Webnovel } from '@/components/Types'
import { useEffect, useState } from 'react';
import WebnovelComponent from "@/components/WebnovelComponent"
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import moment from 'moment';

const WebnovelsList = ({ searchParams, sortBy, webnovels }: { searchParams: { [key: string]: string | string[] | undefined }, sortBy: SortBy, webnovels: Webnovel[]}) => {
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

  const filter_by_genre = (item: Webnovel) => {
    if (genre == "all" || genre == null) {
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
      return b.views - a.views
    } else if (sortBy == 'likes') {
      return b.upvotes - a.upvotes
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
        return -1;
      } else if (latestDateA == latestDateB) {
        return 0;
      } else {
        return 1;
      }
    } else {
      return 0;
    }
  }


  return (
    <div className='w-full max-w-screen-xl mx-auto flex flex-col'>
      <div className='text-2xl md:text-4xl p-2 font-bold'>
        {(webnovels.length > 0) ?
          phrase(dictionary, text, language) : <></>
        } 
      </div>
      <div className="flex scrollbar-hide justify-start grow md:grow-0 mt-4 overflow-x-scroll">
        {webnovels
          .filter(item => filter_by_genre(item))
          .sort(sortByFn)
          .map((item, index) => (
            <div className="min-w-[120px] min-h-[73px] md:min-w-[225px] md:min-h-[135px] p-2 md:p-4 overflow-y-hidden" key={index}>
              <WebnovelComponent webnovel={item} index={index} ranking={true} width={225} height={135}/>
            </div>
          ))}
      </div>
    </div>
  )
};

export default WebnovelsList;