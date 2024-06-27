import { auth } from '@/auth';
import ProfileComponent from '@/components/ProfileComponent';

export default async function Profile() {
  const session = await auth();

  if (session && session.user) {
    return <ProfileComponent user={session.user} />;
  }

  return <p>User not logged in</p>;
}
