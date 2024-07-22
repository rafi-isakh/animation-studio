import ProfileComponent from '@/components/ProfileComponent';
import { User } from '@/components/Types';
import { cache } from 'react';

export default async function ViewProfile({ params: { id }, }: { params: { id: string } }) {
  // must do this because profile can be any user's
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_user_byid?id=${id}`);
  const user: User = await response.json();

  return (
    <ProfileComponent user={user} />
  )
}
