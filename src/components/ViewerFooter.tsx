"use client"

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SearchComponent from '@/components/SearchComponent';
import { Chapter, Webnovel } from '@/components/Types';
import Link from 'next/link';

const ViewerFooter = ({ webnovel, chapter }: { webnovel: Webnovel, chapter: Chapter }) => {

  const [webnovelId, setWebnovelId] = useState(0);
  const [chapterId, setChapterId] = useState(0);
  useEffect(() => {
    setWebnovelId(webnovel.id);
    setChapterId(chapter.id);
  }, [])

  const adjustViewSettings = () => {

  }

  return (
    <div className="z-50 fixed bg-black bottom-0 left-0 right-0">
      <div className="max-w-md text-white flex flex-wrap items-center justify-between mx-auto p-4">
        <Link href={`/view_webnovels?id=${webnovelId.toString()}`}>
          <p className='hover:text-pink-600'>목록</p></Link>
        <Link href={`/library`}>
          <p className='hover:text-pink-600'>내 서재</p></Link>
        <Link href={`/comments?chapter_id=${chapterId.toString()}`}>
          <p className='hover:text-pink-600'>댓글</p></Link>
        <p onClick={adjustViewSettings} className='hover:text-pink-600'>보기 설정</p>
      </div>
    </div>
  );
};

export default ViewerFooter;