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
import { CircularProgress, Checkbox, FormControlLabel, Modal, Box } from '@mui/material';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import Image from 'next/image';
import dynamic from 'next/dynamic';

const LottieLoader = dynamic(() => import('@/components/LottieLoader'), {
    ssr: false,
});
import animationData from '@/assets/stelli_loader.json';
import { useModalStyle } from '@/styles/ModalStyles';

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

    // Extract genres data from formData and create an object
    const genres: { [key: string]: boolean } = {};
    for (const [key, value] of formData.entries()) {
        if (key.startsWith('genres[')) {
            const genreName = key.match(/\[(.*?)\]/)?.[1] || '';
            genres[genreName] = value === 'true';
        }
    }

    const formDataToSend = new FormData();
    formDataToSend.append('nickname', nickname);
    formDataToSend.append('bio', bio);
    formDataToSend.append('promoCode', promoCode);
    formDataToSend.append('genres', JSON.stringify(genres));

    const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/update_user?promo_code=${promoCode}`, {
        method: 'POST',
        body: formDataToSend,
    });
    redirect('/welcome');
}

async function createAndUpdateUser(formData: FormData) {
    await createUser();
    await updateUser(formData);
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
    const { language, dictionary } = useLanguage()
    const [showSelectAtLeastOneGenre, setShowSelectAtLeastOneGenre] = useState(false);

    // Add state for checkbox values
    const [genres, setGenres] = useState({
        romance: false,
        fantasy: false,
        action: false,
        orientalFantasy: false,
        bl: false,
        gl: false,
        romanceFantasy: false,
        sf: false
    });

    // Handler for checkbox changes
    const handleGenreChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setGenres({
            ...genres,
            [event.target.name]: event.target.checked
        });
    };

    // Modify the createAndUpdateUser function to include genres
    async function handleSubmit(formData: FormData) {
        // Add genres data to formData
        if (!Object.values(genres).some(Boolean)) {
            setShowSelectAtLeastOneGenre(true);
            return;
        }
        Object.entries(genres).forEach(([genre, checked]) => {
            formData.append(`genres[${genre}]`, checked.toString());
        });
        await createAndUpdateUser(formData);
    }

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = await isUserInDB();
            const { user_exists, user_with_same_email_exists } = data;
            if (user_exists) {
                setUserExists(true);
                router.push('/user_loggedin');
            } else if (user_with_same_email_exists) {
                return (
                    <UserWithSameEmailExistsModalComponent /> // bug: this modal is not shown
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
            <div role="status" className={`flex items-center justify-center min-h-screen`}>
                <LottieLoader
                    animationData={animationData}
                    width="w-32"
                    centered={true}
                    pulseEffect={true}
                />
            </div> :
            <div className='flex flex-col items-center h-[70vh] !p-10'>
                <div className="flex flex-col items-center justify-center w-[360px] py-4 rounded-md">

                    <span className="relative flex h-28 w-28">
                        <span className="relative inline-flex rounded-full h-28 w-28 border-[#FFE2DC]">
                            <Image src="/images/stelli_head.svg" alt="Stelli image" width={100} height={100} className='self-center mx-auto' />
                        </span>
                    </span>
                    <h1 className='text-center text-xl font-bold mb-4'>{phrase(dictionary, 'signup', language)}</h1>
                    
                    {/*
                    <p className="text-center text-[10px] text-gray-400 dark:text-white">
                        Your Favorite Story Universe, Between Us, Toonyz
                    </p>
                    */}

                    <form action={handleSubmit}>
                        <div className="flex flex-col w-72">
                            <div className="flex flex-col space-y-4 items-center justify-center text-black dark:text-white">
                                <NewUserNicknameComponent />
                                <NewUserBioComponent />
                                <NewUserCodeComponent />
                                <div className="flex flex-col gap-2">
                                    <p className="text-sm font-medium">선호하는 장르를 선택해주세요</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    name="romance"
                                                    checked={genres.romance}
                                                    onChange={handleGenreChange}
                                                    sx={{
                                                        color: '#db2777',
                                                        '&.Mui-checked': {
                                                            color: '#db2777',
                                                        }
                                                    }}
                                                />
                                            }
                                            label={phrase(dictionary, "romance", language)}
                                            sx={{ '& .MuiFormControlLabel-label': { fontSize: '14px' } }}
                                        />
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    name="fantasy"
                                                    checked={genres.fantasy}
                                                    onChange={handleGenreChange}
                                                    sx={{
                                                        color: '#db2777',
                                                        '&.Mui-checked': {
                                                            color: '#db2777',
                                                        }
                                                    }}
                                                />
                                            }
                                            label={phrase(dictionary, "fantasy", language)}
                                            sx={{ '& .MuiFormControlLabel-label': { fontSize: '14px' } }}
                                        />
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    name="action"
                                                    checked={genres.action}
                                                    onChange={handleGenreChange}
                                                    sx={{
                                                        color: '#db2777',
                                                        '&.Mui-checked': {
                                                            color: '#db2777',
                                                        }
                                                    }}
                                                />
                                            }
                                            label={phrase(dictionary, "action", language)}
                                            sx={{ '& .MuiFormControlLabel-label': { fontSize: '14px' } }}
                                        />
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    name="orientalFantasy"
                                                    checked={genres.orientalFantasy}
                                                    onChange={handleGenreChange}
                                                    sx={{
                                                        color: '#db2777',
                                                        '&.Mui-checked': {
                                                            color: '#db2777',
                                                        }
                                                    }}
                                                />
                                            }
                                            label={phrase(dictionary, "orientalFantasy", language)}
                                            sx={{ '& .MuiFormControlLabel-label': { fontSize: '14px' } }}
                                        />
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    name="bl"
                                                    checked={genres.bl}
                                                    onChange={handleGenreChange}
                                                    sx={{
                                                        color: '#db2777',
                                                        '&.Mui-checked': {
                                                            color: '#db2777',
                                                        }
                                                    }}
                                                />
                                            }
                                            label={phrase(dictionary, "bl", language)}
                                            sx={{ '& .MuiFormControlLabel-label': { fontSize: '14px' } }}
                                        />
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    name="gl"
                                                    checked={genres.gl}
                                                    onChange={handleGenreChange}
                                                    sx={{
                                                        color: '#db2777',
                                                        '&.Mui-checked': {
                                                            color: '#db2777',
                                                        }
                                                    }}
                                                />
                                            }
                                            label="GL"
                                            sx={{ '& .MuiFormControlLabel-label': { fontSize: '14px' } }}
                                        />
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    name="romanceFantasy"
                                                    checked={genres.romanceFantasy}
                                                    onChange={handleGenreChange}
                                                    sx={{
                                                        color: '#db2777',
                                                        '&.Mui-checked': {
                                                            color: '#db2777',
                                                        }
                                                    }}
                                                />
                                            }
                                            label={phrase(dictionary, "romanceFantasy", language)}
                                            sx={{ '& .MuiFormControlLabel-label': { fontSize: '14px' } }}
                                        />
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    name="sf"
                                                    checked={genres.sf}
                                                    onChange={handleGenreChange}
                                                    sx={{
                                                        color: '#db2777',
                                                        '&.Mui-checked': {
                                                            color: '#db2777',
                                                        }
                                                    }}
                                                />
                                            }
                                            label={phrase(dictionary, "sf", language)}
                                            sx={{ '& .MuiFormControlLabel-label': { fontSize: '14px' } }}
                                        />
                                    </div>
                                </div>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            required
                                            sx={{
                                                color: '#db2777',
                                                '&.Mui-checked': {
                                                    color: '#db2777',
                                                }
                                            }}
                                        />
                                    }
                                    label={phrase(dictionary, 'agree_terms', language)}
                                    sx={{ '& .MuiFormControlLabel-label': { fontSize: '14px' } }}
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            required
                                            sx={{
                                                color: '#db2777',
                                                '&.Mui-checked': {
                                                    color: '#db2777',
                                                }
                                            }}
                                        />
                                    }
                                    label={phrase(dictionary, 'agree_terms', language)}
                                    sx={{ '& .MuiFormControlLabel-label': { fontSize: '14px' } }}
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            sx={{
                                                color: '#db2777',
                                                '&.Mui-checked': {
                                                    color: '#db2777',
                                                }
                                            }}
                                        />
                                    }
                                    label={phrase(dictionary, 'agree_terms', language)}
                                    sx={{ '& .MuiFormControlLabel-label': { fontSize: '14px' } }}
                                />
                                <NewUserSubmitComponent />
                            </div>
                        </div>
                    </form>

             
                </div>
                <Modal open={showSelectAtLeastOneGenre} onClose={() => setShowSelectAtLeastOneGenre(false)}>
                    <Box sx={useModalStyle}>
                        <p className="text-center text-xl font">{phrase(dictionary, 'selectAtLeastOneGenre', language)}</p>
                    </Box>
                </Modal>
            </div>
    )
}