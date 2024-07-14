'use client';

import React from 'react';
import { User } from '@/components/Types';

const ProfileComponent = ({ user }: { user: User }) => {
  return (
    <div>
      <center>
        <h2>{user.nickname}</h2>
        <h2>{user.email}</h2>
      </center>
    </div>
  );
}

export default ProfileComponent;
