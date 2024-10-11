"use client"

import { auth } from '@/auth';
import { UserCreate } from '@/components/Types';
import { redirect } from 'next/navigation'
import '@/styles/globals.css'
import NewUserNicknameComponent from '@/components/NewUserNicknameComponent';
import NewUserSubmitComponent from '@/components/NewUserSubmitComponent';
import NewUserBioComponent from '@/components/NewUserBioComponent';
import NewUserCodeComponent from '@/components/NewUserCodeComponent';
import UserWithSameEmailExistsModalComponent from '@/components/UserWithSameEmailExistsModalComponent';
import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircularProgress } from '@mui/material';

async function createUser() {
    let nickname = "Anonymous";
    let bio = "";

    const data = {
        'nickname': nickname,
        'bio': bio,
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/add_user`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        cache: 'no-store',
    });
    console.log("res:", await res.json())
}

async function updateUser(formData: FormData) {
    let nickname = formData.get('nickname') as string;
    if (!nickname) {
        nickname = "Anonymous";
    }
    const bio = formData.get('bio') as string;
    const promoCode = formData.get('promoCode') as string;

    const data = {
        'nickname': nickname,
        'bio': bio,
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/update_user?promo_code=${promoCode}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    redirect('/');
}

async function isUserInDB() {
    const res = await fetch(`/api/check_user`);
    const data = await res.json();
    return data;
}

export default function NewUser() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [userExists, setUserExists] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = await isUserInDB();
            await createUser();
            const { user_exists, user_with_same_email_exists } = data;
            if (user_exists) {
                setUserExists(true);
                router.push('/');
            } else if (user_with_same_email_exists) {
                signOut();
                return (
                    <UserWithSameEmailExistsModalComponent />
                )
            }
            setLoading(false);
        }
        fetchData();
    }, [])

    if (userExists) {
        return null;
    }

    return (
        loading ? 
        <div role="status" className='w-16 absolute top-1/2 left-1/2 -translate-y-8 -translate-x-8'>
            <CircularProgress color='secondary'/>
            </div> :
        <div className='max-w-screen-md p-6 w-full flex flex-col mx-auto'>
            <form action={updateUser}>
                <div className="flex flex-col">
                    <div className="flex flex-col md:w-3/4 w-full space-y-4 items-center justify-center mx-auto">
                        <NewUserNicknameComponent />
                        <NewUserBioComponent />
                        <NewUserCodeComponent />
                        <NewUserSubmitComponent />
                        <p>등록하시면 이메일 정보가 수집됩니다.</p>
                    </div>
                </div>
            </form>
        </div>
    )
}