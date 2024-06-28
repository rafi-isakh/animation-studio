'use client';

import React from 'react';
import { useAuth } from '@/components/AuthContext';
import Link from 'next/link'

const ProfileComponent = ({ user }: { user: { name: string, image: string } }) => {

  return (
    <div>
      <center>
        <h2>{user.name}</h2>
        {<img src={user.image} alt="Profile" />}
      </center>
    </div>
  );
};

export default ProfileComponent;
