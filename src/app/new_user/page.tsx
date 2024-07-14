import { auth } from '@/auth';
import { redirect } from 'next/navigation'
import { useEffect, useState } from 'react';

async function createUser(formData: FormData) {
  'use server';

  const session = await auth();
  const nickname = formData.get('nickname') as string;

  if (session && session.user) {
    const data = {
      'user_email': session.user.email,
      'user_name': session.user.name,
      'id': session.user.id,
      'nickname': nickname
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/add_user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    // You might want to check the response and handle any errors here
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
    return null;
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
                className='input input-bordered w-full'
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