'use client';

import React, { useEffect, useRef, useState } from 'react';
import { User, Webnovel } from '@/components/Types';
import Link from 'next/link';
import Webnovels from '@/components/Webnovels';
import WebnovelComponent from './WebnovelComponent';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import OtherTranslateComponent from '@/components/OtherTranslateComponent';

const ProfileComponent = ({ user, novels }: { user: User, novels: Webnovel[] }) => {

  const [numberOfNovels, setNumberOfNovels] = useState(0);
  const [numberOfChapters, setNumberOfChapters] = useState(0);
  const [numberOfLikes, setNumberOfLikes] = useState(0);
  const [introActive, setIntroActive] = useState<boolean>(true);
  const [viewActive, setViewActive] = useState<boolean>(false);
  const { language, dictionary } = useLanguage();
  const viewRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const novelsRef = useRef<HTMLDivElement>(null);
  const [introWidth, setIntroWidth] = useState<string>("0px")
  const [viewWidth, setViewWidth] = useState(0)
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey(prevKey => prevKey + 1)
  }, [language])

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovels_byemail?email=${user.email}`)
      .then(response => response.json())
      .then(data => {
        console.log("webnovels data", data);
        setNumberOfNovels(data.length);
      }
      )

  }, [])

  useEffect(() => {

    if (introRef.current) {
      const width = introRef.current.offsetWidth + 1 + 'px';
      setIntroWidth(width);
    }
  }, [language])

  useEffect(() => {
    if (novelsRef.current) {
      novelsRef.current.style.transform = `translateX(-${introWidth})`
    }
  }, [introWidth])


  const handleIntroClick = () => {
    setIntroActive(true);
    setViewActive(false);
    const intro = document.getElementById('intro');
    intro?.classList.add('font-bold');
    intro?.classList.add('border-[#142448]')
    intro?.classList.remove('border-gray')
    const view = document.getElementById('view');
    view?.classList.remove('font-bold');
    view?.classList.remove('border-[#142448]')
    view?.classList.add('border-gray')
    const bio = document.getElementById('bio');
    bio?.classList.remove('hidden');
    const works = document.getElementById('works');
    works?.classList.add('hidden');
  }

  const handleViewClick = () => {
    setIntroActive(false);
    setViewActive(true);
    const intro = document.getElementById('intro');
    intro?.classList.remove('font-bold');
    intro?.classList.remove('border-[#142448]')
    intro?.classList.add('border-gray')
    const view = document.getElementById('view');
    view?.classList.add('font-bold');
    view?.classList.add('border-[#142448]')
    view?.classList.remove('border-gray')
    const bio = document.getElementById('bio');
    bio?.classList.add('hidden');
    const works = document.getElementById('works');
    works?.classList.remove('hidden');
  }

  return (
    <div className='max-w-screen-sm mx-auto flex flex-col space-y-8'>
      <div>
        <p className='text-xl font-bold'>{user.nickname}</p>
      </div>
      <div className="flex flex-row space-x-8">
        <div className='flex flex-col justify-center items-center'>
          <p>{Object.keys(dictionary).length != 0 && dictionary["numberOfWebnovels"][language]}</p>
          <p>{numberOfNovels}</p>
        </div>
        <div className='flex flex-col justify-center items-center'>
          <p>{Object.keys(dictionary).length != 0 && dictionary["numTotalChapters"][language]}</p>
          <p>{numberOfChapters}</p>
        </div>
        <div className='flex flex-col justify-center items-center'>
          <p><i className="fa-regular fa-heart"></i>{Object.keys(dictionary).length != 0 && dictionary["likes"][language]}</p>
          <p>{numberOfLikes}</p>
        </div>
      </div>
      <div className='flex flex-row'>
        <div className='flex flex-shrink-0 flex-col space-y-4' ref={introRef}>
          <Link href="#" onClick={handleIntroClick}><p id='intro' className='text-xl px-4 font-bold border-b-2 border-[#142448]'>{Object.keys(dictionary).length != 0 && dictionary["authorBio"][language]}</p></Link>
          <OtherTranslateComponent key={key} content={user.bio} elementId={user.id.toString()} elementType='user' />
        </div>
        <div className="flex flex-shrink-0 flex-col space-y-4" ref={viewRef} >
          <Link href="#" onClick={handleViewClick}>
            <p id='view' className='text-xl w-fit px-4 border-b-2 border-gray'>{Object.keys(dictionary).length != 0 && dictionary["viewWebnovels"][language]}</p></Link>
          <div id="works" ref={novelsRef} className={`max-w-screen-sm hidden flex flex-row flex-wrap after:content-[''] after:flex-auto`}>
            {novels.map((item, index) => (
              <div key={index} className='mx-auto'>
                <WebnovelComponent webnovel={item} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileComponent;
