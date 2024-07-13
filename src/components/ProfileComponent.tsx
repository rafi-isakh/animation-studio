'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link'
import { redirect } from 'next/navigation';
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
