import ProfileComponent from '@/components/ProfileComponent';
import { User, Webnovel } from '@/components/Types';
import { useEffect, useState } from 'react';

export default async function ViewProfile({ params: { id }, }: { params: { id: string } }) {
  // must do this because profile can be any user's

  async function getUser() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_user_byid?id=${id}`, {cache: 'no-store'});
    if (!response.ok) {
      const errorData = await response.json();
      console.error(errorData);
      throw new Error("Failed to fetch data");
    }
    const user: User = await response.json();
    return user;
  }

  async function fetchNovels(user: User) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovels_byemail?email=${user.email}`, {cache: 'no-store'});
    if (!response.ok) {
      const errorData = await response.json();
      console.error(errorData);
      throw new Error("Failed to fetch data")
    }
    const novels: Webnovel[] = await response.json();
    return novels;
  }

  const user = await getUser();
  const novels = await fetchNovels(user);

  if (!user) {
    return <div></div>;
  }

  return (
    <ProfileComponent user={user} novels={novels} />
  );
}
