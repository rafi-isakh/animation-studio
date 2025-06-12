"use client"

import NewUserNicknameComponent from '@/components/NewUserNicknameComponent';
import NewUserSubmitComponent from '@/components/NewUserSubmitComponent';
import NewUserBioComponent from '@/components/NewUserBioComponent';
import NewUserCodeComponent from '@/components/NewUserCodeComponent';
import UserWithSameEmailExistsModalComponent from '@/components/UserWithSameEmailExistsModalComponent';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CircularProgress, Checkbox, FormControlLabel, Modal, Box } from '@mui/material';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useUser } from '@/contexts/UserContext';

const LottieLoader = dynamic(() => import('@/components/LottieLoader'), {
    ssr: false,
});
import animationData from '@/assets/N_logo_with_heart.json';
import { useModalStyle } from '@/styles/ModalStyles';

const nouns = ["Star", "Moon", "Sun", "Cloud", "River", "Mountain", "Forest", "Ocean", "Sky", "Flower"];
const randomNickname = () => nouns[Math.floor(Math.random() * nouns.length)] + Math.floor(Math.random() * 1000);

export default function NewUser() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnTo = searchParams.get('returnTo');
    const pushTo = returnTo? `/user_loggedin?returnTo=${encodeURIComponent(returnTo)}` : '/user_loggedin';
    const { language, dictionary } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [userExists, setUserExists] = useState(false);
    const [userWithSameEmailExists, setUserWithSameEmailExists] = useState(false);
    const [showSelectAtLeastOneGenre, setShowSelectAtLeastOneGenre] = useState(false);
    const [formDataState, setFormDataState] = useState({ // should probably use FormData object instead
        nickname: "",
        bio: "",
        promoCode: "",
        genres: {
            romance: false,
            fantasy: false,
            action: false,
            orientalFantasy: false,
            bl: false,
            gl: false,
            romanceFantasy: false,
            sf: false,
        },
        marketing: false,
    });
    const [step, setStep] = useState(1);
    const { setInvokeCheckUser } = useUser();

    useEffect(() => {
        const checkUser = async () => {
            try {
                const res = await fetch("/api/check_user");
                const data = await res.json();
                if (data.user_exists) {
                    setUserExists(true);
                    router.push(pushTo)
                } else if (data.user_with_same_email_exists) {
                    setUserWithSameEmailExists(true);
                }
            } catch (error) {
                console.error("Error checking user:", error);
            } finally {
                setLoading(false);
            }
        };
        checkUser();
    }, [router, returnTo]);

    async function updateUser(formData: FormData) {
        // TODO: add option to upload picture at user registration
        let nickname = formData.get('nickname') as string;
        if (!nickname) {
            nickname = randomNickname();
        }
        const bio = formData.get('bio') as string;
        const promoCode = formData.get('promoCode') as string;
        const marketing = formData.get('marketing') as string;

        // Extract genres data from formData and create an object
        // const genres: { [key: string]: boolean } = {};
        const genres = formDataState.genres;
        for (const [key, value] of formData.entries()) {
            console.log(formData.entries());
            console.log('key', key);
            console.log('value', value);
            if (key.startsWith('genres[')) {
                const genreName = key.match(/\[(.*?)\]/)?.[1] || '';
                genres[genreName as keyof typeof genres] = value === 'true';
            }
        }

        const formDataToSend = new FormData();
        formDataToSend.append('nickname', nickname);
        formDataToSend.append('bio', bio);
        formDataToSend.append('promoCode', promoCode);
        formDataToSend.append('genres', JSON.stringify(genres));
        if (marketing) {
            formDataToSend.append('marketing', 'true');
        } else {
            formDataToSend.append('marketing', 'false');
        }

        Object.entries(formDataState.genres).forEach(([genre, checked]) => {
            formDataToSend.append('genres', genre);
        });

        const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/update_user?promo_code=${promoCode}`, {
            method: 'POST',
            body: formDataToSend,
        });
        if (!res.ok) {
            throw new Error(`Failed to update user: ${res.statusText} ${res.status}`);
        }
        console.log('returning to', pushTo);
        router.push(pushTo);
    }


    async function isUserInDB() {
        const res = await fetch(`/api/check_user`);
        const data = await res.json();
        return data;
    }


    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFormDataState({
            ...formDataState,
            [event.target.name]: event.target.value
        });
    }

    const handleGenreChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = event.target;
        setFormDataState((prev) => ({
            ...prev,
            genres: { ...prev.genres, [name]: checked },
        }));
    };

    const handleMarketingChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFormDataState((prev) => ({ ...prev, marketing: event.target.checked }));
    };

    const handleNextStep = () => {
        if (step < 3) setStep(step + 1);
    };

    const handlePrevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData2 = new FormData(e.target as HTMLFormElement); //no genres
        const selectedGenres = Object.values(formDataState.genres).some(Boolean);
        // Ensure at least one genre is selected
        if (!selectedGenres) {
            setShowSelectAtLeastOneGenre(true);
            return;
        }

        try {
            const userData = {
                nickname: formDataState.nickname || randomNickname(),
                bio: formDataState.bio,
                language: language,
            };

            const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/add_user`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData),
            });

            if (!res.ok) throw new Error("Failed to create user");
            await updateUser(formData2);

            // Trigger user context refresh after successful registration
            setInvokeCheckUser(prev => !prev);
            
            // Small delay to ensure user context is updated
            setTimeout(() => {
                router.push(pushTo);
            }, 1000);
        } catch (error) {
            console.error("Error creating user:", error);
        }
    };

    if (loading) {
        return (
            <div role="status" className="flex items-center justify-center min-h-screen">
                <LottieLoader animationData={animationData} width="w-40" centered={true} pulseEffect={true} />
            </div>
        );
    }

    if (userExists) return null;

    return (
        <div className="relative w-full flex flex-col items-center p-10">
            {userWithSameEmailExists && <UserWithSameEmailExistsModalComponent />}

            <div className="flex flex-col items-center justify-center md:w-max-screen-md w-full py-4">
                {(step === 1 || step === 3) && (
                    <>
                        <div className="relative flex h-28 w-28">
                            <Image src="/images/stelli_head.svg" alt="Stelli image" width={100} height={100} className="self-center mx-auto" />
                        </div>
                        <h1 className="text-center text-xl font-bold mb-4">
                            {phrase(dictionary, "signup", language)}
                        </h1>
                    </>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col w-72">
                        {/* {step === 1 && ( */}
                            <div className={`flex flex-col space-y-3 items-center ${step === 1 ? 'block' : 'hidden'}`}>
                                <NewUserNicknameComponent
                                    value={formDataState.nickname}
                                    onChange={handleInputChange}
                                />
                                <NewUserBioComponent
                                    value={formDataState.bio}
                                    onChange={handleInputChange}
                                />
                                <NewUserCodeComponent
                                    value={formDataState.promoCode}
                                    onChange={handleInputChange}
                                />
                                <button type="button" onClick={handleNextStep} className="w-full bg-pink-600 text-white py-2 rounded-md">
                                    {phrase(dictionary, "next", language)}
                                </button>
                            </div>
                        {/* )} */}

                        {/* step === 2  */}
                        <div className={`flex flex-col space-y-4 items-center ${step === 2 ? 'block' : 'hidden'}`}>
                            <Image
                                src="/icons/explore_icon.svg"
                                alt="Explore icon"
                                width={50}
                                height={50}
                                className="self-start"
                            />
                            <p className="relative md:text-4xl text-xl font-extrabold break-keep">
                                {phrase(dictionary, "choose_topics", language)}
                            </p>
                            <p className="text-sm font-medium">{phrase(dictionary, "selectFavoriteGenres", language)}</p>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(formDataState.genres).map(([genre, checked]) => (
                                    <FormControlLabel
                                        key={genre}
                                        control={<Checkbox
                                            name={genre}
                                            checked={checked}
                                            onChange={handleGenreChange}
                                            sx={{
                                                color: "#db2777",
                                                "&.Mui-checked": {
                                                    color: "#db2777",
                                                },
                                            }}
                                        />
                                        }
                                        label={phrase(dictionary, genre, language)}
                                        sx={{ "& .MuiFormControlLabel-label": { fontSize: "14px" } }}
                                    />
                                ))}
                            </div>
                            <div className="w-full flex flex-col space-y-4 justify-center items-center">
                                <button
                                    type="button" onClick={handleNextStep}
                                    className="w-full bg-pink-600 text-white py-2 px-4 rounded-md"
                                >
                                    {phrase(dictionary, "next", language)}
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePrevStep}
                                    className="w-full bg-gray-300 text-black py-2 px-4 rounded-md"
                                >
                                    {phrase(dictionary, "back", language)}
                                </button>
                            </div>
                        </div>

                        {step === 3 && (
                            <div className="flex flex-col space-y-4 items-center">
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            required
                                            sx={{
                                                color: "#db2777",
                                                "&.Mui-checked": {
                                                    color: "#db2777",
                                                },
                                            }}
                                        />
                                    }
                                    label={phrase(dictionary, "agree_terms", language)}
                                    sx={{ "& .MuiFormControlLabel-label": { fontSize: "14px" } }}
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            name='marketing'
                                            sx={{
                                                color: "#db2777",
                                                "&.Mui-checked": {
                                                    color: "#db2777",
                                                },
                                            }}
                                            checked={formDataState.marketing}
                                            onChange={handleMarketingChange}
                                        />
                                    }
                                    label={phrase(dictionary, "agree_marketing", language)}
                                    sx={{ "& .MuiFormControlLabel-label": { fontSize: "14px" } }}
                                />

                                <div className="flex flex-col space-y-4 items-center">
                                    <NewUserSubmitComponent />
                                    <button
                                        type="button"
                                        onClick={handlePrevStep}
                                        className="w-full bg-gray-300 text-black py-2 px-4 rounded-md"
                                    >
                                        {phrase(dictionary, "back", language)}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </form>
            </div>

            <Modal open={showSelectAtLeastOneGenre} onClose={() => setShowSelectAtLeastOneGenre(false)}>
                <Box sx={useModalStyle}>
                    <p className="text-center text-xl">{phrase(dictionary, "selectAtLeastOneGenre", language)}</p>
                </Box>
            </Modal>
        </div>
    );
}