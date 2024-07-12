"use client"
import { Webnovel } from '@/components/Types'
import { useEffect, useState } from 'react';
import WebnovelComponent from "@/components/WebnovelComponent"
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react'

const Webnovels = () => {
  const [webnovels, setWebnovels] = useState<Webnovel[]>([]);
  const searchParams = useSearchParams();
  const genre = searchParams.get("genre");

  useEffect(() => {
    fetch('http://stellandai.com:5000/api/get_webnovels')
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
        <div className="scrollbar-hide max-w-screen-xl mx-auto snap-x overflow-x-scroll flex m-10">
          {webnovels
            .filter(item => filter_by_genre(item)) 
            .map((item, index) => (
          <div className="max-w-screen-sm flex mx-auto snap-center flex-shrink-0 w-80 p-4" key={index}>
            <center>
              <WebnovelComponent webnovel={item}/>
            </center>
          </div>
        ))}
        </div>
      )
};

const WebnovelsWrapper = () => {
  return (
  <Suspense>
    <Webnovels/>
  </Suspense>
  )
}

export default WebnovelsWrapper;