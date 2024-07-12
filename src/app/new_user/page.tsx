import { auth } from '@/auth';
import { redirect } from 'next/navigation'

const NewUser = async () => {
  const session = await auth();
  if (session && session.user) {
    const data = {
        'user_email': session.user.email,
        'user_name': session.user.name,
        'id': session.user.id
    }
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/add_user`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
  }
  redirect("/");
}

export default NewUser;