import ProfileComponent from '@/components/ProfileComponent';
import { User } from '@/components/Types';

export default async function Profile({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const email = searchParams.email;
  // must do this because profile can be any user's
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_user?email=${email}`)
  const user: User = await response.json();

  return (
    <ProfileComponent user={user} />
  )
}
