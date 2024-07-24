"use client"
import ProfileComponent from '@/components/ProfileComponent';
import { User, Webnovel } from '@/components/Types';
import { useEffect, useState } from 'react';

export default function ViewProfile({ params: { id }, }: { params: { id: string } }) {
  // must do this because profile can be any user's
  const [user, setUser] = useState<User>();
  const [novels, setNovels] = useState<Webnovel[]>([]);

  useEffect(() => {
    async function getUser() {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_user_byid?id=${id}`);
      const user: User = await response.json();
      return user;
    }

    async function fetchNovels(user: User) {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovels_byemail?email=${user.email}`);
      const novels: Webnovel[] = await response.json();
      return novels;
    }

    async function fetchData() {
      const user = await getUser();
      setUser(user);
      const novels = await fetchNovels(user);
      setNovels(novels);
    }

    fetchData();
  }, [id]);

  if (!user) {
    return <div></div>;
  }

  return (
    <ProfileComponent user={user} novels={novels} />
  );
}
