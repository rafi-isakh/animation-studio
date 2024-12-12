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
import { CircularProgress, Checkbox, FormControlLabel } from '@mui/material';
import { useLanguage } from '@/contexts/LanguageContext';
import {phrase} from '@/utils/phrases'
import Image from 'next/image';

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
        body: JSON.stringify(data)
    });
}

async function updateUser(formData: FormData) {
    // TODO: add option to upload picture at user registration
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
        body: formData
    });
    redirect('/welcome');
}

async function isUserInDB() {
    const res = await fetch(`/api/check_user`);
    const data = await res.json();
    return data;
}

export default function NewUser() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [userExists, setUserExists] = useState(false);   
    const {language, dictionary} = useLanguage()

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = await isUserInDB();
            await createUser();
            const { user_exists, user_with_same_email_exists } = data;
            if (user_exists) {
                setUserExists(true);
                router.push('/?version=free');
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
         <div className='flex flex-col items-center justify-center h-[70vh] mt-10 !p-10'>
           <div className="flex flex-col items-center justify-center w-[450px] py-20 rounded-xl border border-gray-300">
      
            <Image
            src="/N_Logo.png"
            alt="Toonyz Logo"
            width={0}
            height={0}
            sizes="100vh"
            style={{ 
                marginTop: '15px',
                height: '35px', 
                width: '35px', 
                justifyContent: 'center', 
                alignSelf: 'center', 
                borderRadius: '25%', 
                }}
            />
            <h1 className='text-center text-2xl font-bold mb-10'>{phrase(dictionary, 'signup', language)}</h1>
            <p className="text-center text-[10px] mb-10"> Your Favorite Story Universe, Between Us, Toonyz </p>

            <form action={updateUser}>
                <div className="flex flex-col w-72">
                    <div className="flex flex-col space-y-4 items-center justify-center ">
                        <NewUserNicknameComponent />
                        <NewUserBioComponent />
                        <NewUserCodeComponent />
                     <div className="">
                       <FormControlLabel
                         required
                         sx={{ '& .MuiFormControlLabel-label': { fontSize: '12px' },
                            // color: '#ec4899', // font color
                        }}
                         control={
                         <Checkbox required 
                          sx={{
                            color: '#db2777',
                            '&.Mui-checked': {
                              color: '#db2777',
                            }
                          }} 
                         />}
                        //  label="I agree to the terms & privacy policy"
                         label={phrase(dictionary, 'agree_terms', language)}
                       />
                     </div>   
                        <NewUserSubmitComponent />
                        <p className="text-center text-[12px] mb-10">{phrase(dictionary, 'agree_submit', language)}</p>
                    </div>
                </div>
              </form>
            </div>
        </div>
    )
}