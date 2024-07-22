'use client';

import React, { useEffect, useState } from 'react';
import { User } from '@/components/Types';

const ProfileComponent = ({ user }: { user: User }) => {

  const [numberOfNovels, setNumberOfNovels] = useState();
  const [numberOfChapters, setNumberOfChapters] = useState();
  const [numberOfLikes, setNumberOfLikes] = useState();

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovels_byemail?email=${user.email}`)
      .then(response => response.json())
      .then(data =>
        setNumberOfNovels(data.length)
      )
  }, [])

  return (
    <div className='max-w-screen-sm mx-auto'>
      <div>
        <p className='text-lg font-bold'>{user.nickname}</p>
      </div>
      <div>
        <div className='flex flex-col'>
          <p>작품수</p>
          <p>{numberOfNovels}</p>
        </div>
        <p>총 연재 글수</p>
        <p>좋아요</p>
      </div>
    </div>
  );
}

export default ProfileComponent;
