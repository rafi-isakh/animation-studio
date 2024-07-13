"use client"

import { auth } from '@/auth';
import ProfileComponent from '@/components/ProfileComponent';
import { User } from '@/components/Types';
import { useAuth } from '@/contexts/AuthContext';

export default function Profile() {
  const { nickname, email } = useAuth();

  const user: User = {
    email: email,
    nickname: nickname
  }

  return (
    <ProfileComponent user={user} />
  )
}
