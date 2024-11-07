import EmptyProfileComponent from '@/components/EmptyProfileComponent';
import ProfileComponent from '@/components/ProfileComponent';
import { User, Webnovel } from '@/components/Types';
import { decrypt } from '@/utils/cryptography';
import { useEffect, useState } from 'react';

export default async function ViewProfile({ params: { id }, }: { params: { id: string } }) {
  // must do this because profile can be any user's

  async function getUser() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_user_by_id?id=${id}`);
    if (!response.ok) {
      const errorData = await response.json();
      console.error(errorData);
      return null;
    }
    const user: User = await response.json();
    return user;
  }

  async function fetchNovels(user: User) {
    const decryptedEmail = await decrypt(user.email); // necessary because email comes from user.email, which is retrieved from db (encrypted)
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovels_by_email?email=${decryptedEmail}`);
    if (!response.ok) {
      const errorData = await response.json();
      console.error(errorData);
      return null;
    }
    const novels: Webnovel[] = await response.json();
    return novels;
  }

  const user = await getUser();
  let novels: Webnovel[] | null = [];
  if (user) {
    novels = await fetchNovels(user);
  } else {
    return (
      <EmptyProfileComponent />
    )
  }
  if (user && novels) {
    return (
      <ProfileComponent user={user} novels={novels} />
    );
  } else {
    return (
      <EmptyProfileComponent />
    )
  }
}
