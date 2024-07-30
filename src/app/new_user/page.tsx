import { auth } from '@/auth';
import { UserCreate } from '@/components/Types';
import { redirect } from 'next/navigation'
import '@/styles/globals.css'
import NewUserNicknameComponent from '@/components/NewUserNicknameComponent';
import NewUserSubmitComponent from '@/components/NewUserSubmitComponent';
import NewUserBioComponent from '@/components/NewUserBioComponent';
import NewUserCodeComponent from '@/components/NewUserCodeComponent';
import UserWithSameEmailExistsModalComponent from '@/components/UserWithSameEmailExistsModalComponent';

async function createUser(formData: FormData) {
  'use server';

  const session = await auth();
  const nickname = formData.get('nickname') as string;
  const bio = formData.get('bio') as string;
  const promoCode = formData.get('promoCode') as string;

  if (session && session.user) {
    const data: UserCreate = {
      'email': session.user.email ?? "",
      'nickname': nickname,
      'bio': bio,
      'provider': session.provider
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/add_user?promo_code=${promoCode}`, {
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
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/check_user?email=${session.user.email}&provider=${session.provider}`);
    const data = await res.json();
    return data;
  }
  return null;
}

export default async function NewUser() {
  const data = await isUserInDB();
  const {user_exists, user_with_same_email_exists} = data;
  if (user_exists) {
    redirect('/');
  } else if (user_with_same_email_exists) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/signout`, {
      method: 'POST',
    });
    console.log(response);
    return (
      <UserWithSameEmailExistsModalComponent />
    )
  }

  else {
    return (
      <div className='max-w-screen-sm w-full flex flex-col mx-auto'>
        <form action={createUser}>
          <div className="flex flex-col">
            <div className="w-1/2 md:w-2/3 mx-auto">
              <NewUserNicknameComponent />
              <br />
              <NewUserBioComponent />
              <br />
              <NewUserCodeComponent />
              <br />
              <NewUserSubmitComponent />
              <br/>
              <p>웹사이트에 등록하시면 웹사이트 이용을 위해 이메일 정보가 수집됩니다.</p>
            </div>
          </div>
        </form>
      </div>
    )
  }
}