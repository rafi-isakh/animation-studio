import { auth } from '@/auth';
import { UserCreate } from '@/components/Types';
import { redirect } from 'next/navigation'

async function createUser(formData: FormData) {
  'use server';

  const session = await auth();
  const nickname = formData.get('nickname') as string;
  const bio = formData.get('bio') as string;


  if (session && session.user) {
    const data : UserCreate = {
      'email': session.user.email?? "",
      'nickname': nickname,
      'bio': bio
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/add_user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  redirect('/');
}

async function isUserInDB() {
  const session = await auth();
  if (session && session.user) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/check_user?email=${session.user.email}`);
    const data = await res.json();
    return data.exists;
  }
  return false;
}

export default async function NewUser() {
  const userExists = await isUserInDB();
  if (userExists) {
    redirect('/');
  }
  
  else {
    return (
      <div className='max-w-screen-md w-full flex flex-row justify-center mx-auto'>
        <form action={createUser}>
          <div className="flex flex-row space-x-4">
            <div className="mr-4 w-full">
              <p className="text-lg">닉네임</p>
              <input
                type="text"
                name="nickname"
                className='input border-none rounded focus:ring-pink-600 bg-gray-200 w-full'
              />
              <br/>
              <p className="text-lg">소개</p>
              <input
                type="text"
                name="bio"
                className='input border-none rounded focus:ring-pink-600 bg-gray-200 w-full'
              />
              <br/>
              <br/>
              <button
                type="submit"
                className="text-white bg-black hover:text-pink-600 font-medium text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700" >
                제출
              </button>
            </div>
          </div>
        </form>
      </div>
    )
  }
}