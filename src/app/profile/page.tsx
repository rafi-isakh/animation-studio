"use client"

import { auth } from '@/auth';
import ProfileComponent from '@/components/ProfileComponent';
import { User } from '@/components/Types';
import { useUser } from '@/contexts/UserContext';

export default function Profile() {
  const { nickname, email } = useUser();

  const user: User = {
    email: email,
    nickname: nickname
  }

  return (
    <ProfileComponent user={user} />
  )
}
