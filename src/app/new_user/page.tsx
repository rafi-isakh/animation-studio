import { auth } from '@/auth';
import { redirect } from 'next/navigation'
import { useState } from 'react';

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

export default function NewUser() {
  return (
    <form action={createUser}>
      <input
        type="text"
        name="nickname"
        className='input input-bordered w-full'
      />
      <button 
        type="submit" 
        className="text-white bg-black hover:text-pink-600 font-medium text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
      >
        제출
      </button>
    </form>
  )
}