"use client"

import React, { useEffect, useState } from 'react';
import { Chapter, Webnovel } from '@/components/Types';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import {phrase} from '@/utils/phrases'

const ViewerFooter = ({ webnovel, chapter }: { webnovel: Webnovel, chapter: Chapter }) => {

  const [webnovelId, setWebnovelId] = useState(0);
  const [chapterId, setChapterId] = useState(0);
  const {language, dictionary} = useLanguage();
  useEffect(() => {
    setWebnovelId(webnovel.id);
    setChapterId(chapter.id);
  }, [])

  const adjustViewSettings = () => {

  }

  return (
    <div className="z-50 fixed bg-[#142448] bottom-0 left-0 right-0">
      <div className="max-w-md text-white flex flex-wrap items-center justify-between mx-auto p-4">
        <Link href={`/view_webnovels?id=${webnovelId.toString()}`}>
          <p className='hover:text-pink-600'>{phrase(dictionary, "list", language)}</p></Link>
        <Link href={`/library`}>
          <p className='hover:text-pink-600'>{phrase(dictionary, "myLibrary", language)}</p></Link>
        <Link href={`/comments?chapter_id=${chapterId.toString()}`}>
          <p className='hover:text-pink-600'>{phrase(dictionary, "comments", language)}</p></Link>
        <p onClick={adjustViewSettings} className='hover:text-pink-600'>{phrase(dictionary, "viewSettings", language)}</p>
      </div>
    </div>
  );
};

export default ViewerFooter;