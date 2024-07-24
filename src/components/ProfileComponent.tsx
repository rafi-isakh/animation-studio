'use client';

import React, { useEffect, useState } from 'react';
import { User, Webnovel } from '@/components/Types';
import Link from 'next/link';
import Webnovels from '@/components/Webnovels';
import WebnovelComponent from './WebnovelComponent';
import { useLanguage } from '@/contexts/LanguageContext';

const ProfileComponent = ({ user }: { user: User }) => {

  const [novels, setNovels] = useState<Webnovel[]>([]);
  const [numberOfNovels, setNumberOfNovels] = useState(0);
  const [numberOfChapters, setNumberOfChapters] = useState(0);
  const [numberOfLikes, setNumberOfLikes] = useState(0);
  const [introActive, setIntroActive] = useState<boolean>(true);
  const [viewActive, setViewActive] = useState<boolean>(false);
  const {language, dictionary} = useLanguage();


  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovels_byemail?email=${user.email}`)
      .then(response => response.json())
      .then(data => {
        console.log("webnovels data", data);
        setNumberOfNovels(data.length);
        setNovels(data);
      }
      )
  }, [])

  const handleIntroClick = () => {
    setIntroActive(true);
    setViewActive(false);
    const intro = document.getElementById('intro');
    intro?.classList.add('font-bold');
    intro?.classList.add('border-black')
    intro?.classList.remove('border-gray')
    const view = document.getElementById('view');
    view?.classList.remove('font-bold');
    view?.classList.remove('border-black')
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
    intro?.classList.remove('border-black')
    intro?.classList.add('border-gray')
    const view = document.getElementById('view');
    view?.classList.add('font-bold');
    view?.classList.add('border-black')
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
        <div className='flex flex-col space-y-4'>
          <Link href="#" onClick={handleIntroClick}><p id='intro' className='text-xl px-4 font-bold border-b-2 border-black'>{Object.keys(dictionary).length != 0 && dictionary["authorBio"][language]}</p></Link>
          <p id="bio">{user.bio}</p>
        </div>
        <div className="flex flex-col space-y-4">
          <Link href="#" onClick={handleViewClick}><p id='view' className='w-28 text-xl px-4 border-b-2 border-gray'>{Object.keys(dictionary).length != 0 && dictionary["viewWebnovels"][language]}</p></Link>
          <div id="works" className="hidden flex flex-row -translate-x-28 space-x-4">
            {novels.map((item, index) => (
              <div key={index}>
                <WebnovelComponent webnovel={item}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileComponent;
