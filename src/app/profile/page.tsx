import { auth } from '@/auth';
import ProfileComponent from '@/components/ProfileComponent';
import { User } from '@/components/Types';

export default async function Profile() {
  const session = await auth();
  if (session && session.user) {

    const user : User = {
      "email": session.user.email,
      "name": session.user.name,
      "image": session.user.image
    }

    return (
      <ProfileComponent user={user} />
    )
  }

  return <p>User not logged in</p>;
}
