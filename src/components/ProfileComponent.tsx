'use client';

import React from 'react';
import { User } from '@/components/Types';

const ProfileComponent = ({ user }: { user: User }) => {
  return (
    <div className='max-w-screen-sm mx-auto'>
        <p className='text-lg font-bold'>{user.nickname}</p>
    </div>
  );
}

export default ProfileComponent;
