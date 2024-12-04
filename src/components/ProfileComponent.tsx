'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Webnovel, User } from '@/components/Types';
import Link from 'next/link';
import WebnovelComponent from './WebnovelComponent';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import OtherTranslateComponent from '@/components/OtherTranslateComponent';
import { uploadFile } from '@/utils/s3';
import { useUser } from '@/contexts/UserContext';
import { getImageUrl } from '@/utils/urls';
import Image from 'next/image'
import '@/styles/globals.css'
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Box, Button, Modal } from '@mui/material';
import { useModalStyle } from '@/styles/ModalStyles';
import { Book, Pencil, Heart } from 'lucide-react';
import { createEmailHash } from '@/utils/cryptography';


const ProfileComponent = ({ user, novels }: { user: User, novels: Webnovel[] }) => {

    const [introActive, setIntroActive] = useState<boolean>(true);
    const [viewActive, setViewActive] = useState<boolean>(false);
    const { language, dictionary } = useLanguage();
    const viewRef = useRef<HTMLDivElement>(null);
    const introRef = useRef<HTMLDivElement>(null);
    const novelsRef = useRef<HTMLDivElement>(null);
    const [introWidth, setIntroWidth] = useState<string>("0px")
    const [key, setKey] = useState(1000);
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
    const [showDeleteAccountModal, setShowDeleteAccountModal] = useState<boolean>(false);
    const { email } = useUser();
    const router = useRouter();
    const { setIsLoggedIn, logout } = useAuth();

    useEffect(() => {
        setKey(prevKey => prevKey + 1)
    }, [language])

    useEffect(() => {

        if (introRef.current) {
            const width = introRef.current.offsetWidth + 1 + 'px';
            setIntroWidth(width);
        }
    }, [language])

    useEffect(() => {
        if (novelsRef.current) {
            novelsRef.current.style.transform = `translateX(-${introWidth}px)`
        }
    }, [introWidth])

    // implementing utils function
    const isProfileOwner = (): boolean => {
        // if (!email || !user.email) return false;
        const userEmailHash = createEmailHash(email);
        const profileEmailHash = user.email_hash
        return userEmailHash === profileEmailHash;
    };

    const handleIntroClick = () => {
        setIntroActive(true);
        setViewActive(false);
        const intro = document.getElementById('intro');
        intro?.classList.add('font-bold');
        intro?.classList.add('border-[#142448]')
        intro?.classList.remove('border-gray')
        const view = document.getElementById('view');
        view?.classList.remove('font-bold');
        view?.classList.remove('border-[#142448]')
        view?.classList.add('border-gray')
        const bio = document.getElementById('bio');
        bio?.classList.remove('hidden');
        const works = document.getElementById('works');
        works?.classList.add('hidden');
    }

    const handleViewClick = () => {
        setIntroActive(false);
        setViewActive(true);
        const intro = document.getElementById('intro');
        intro?.classList.remove('font-bold');
        intro?.classList.remove('border-[#142448]')
        intro?.classList.add('border-gray')
        const view = document.getElementById('view');
        view?.classList.add('font-bold');
        view?.classList.add('border-[#142448]')
        view?.classList.remove('border-gray')
        const bio = document.getElementById('bio');
        bio?.classList.add('hidden');
        const works = document.getElementById('works');
        works?.classList.remove('hidden');
    }

    const handleProfilePictureUpload = () => {
        if (user.email_hash == createEmailHash(email)) {
            document.getElementById('profilePicture')?.click();
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (user.email_hash != createEmailHash(email)) {
            return;
        }
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfilePicture(file);
            setProfilePicturePreview(URL.createObjectURL(file));

            // Create FormData object
            const formData = new FormData();
            formData.append('file', file);
            formData.append('email', user.email);
            formData.append('bio', user.bio);
            formData.append('nickname', user.nickname);

            const response = await fetch('/api/update_user', {
                method: 'POST',
                body: formData, // Send FormData instead of JSON
                // Don't set Content-Type header - browser will set it automatically with boundary
            });

            if (!response.ok) {
                throw new Error("Update user failed")
            }
        }
    };

    const handleDeleteAccount = async () => {
        if (!isProfileOwner()) {
            console.error("Deleting account failed");
            return 
        }

        try {
            const response = await fetch(`/api/delete_account?email=${email}`);
                if (!response.ok) {
                    console.error("Deleting account failed");
                    return;
                }

                await logout(true, `/`);
            } catch (error) {
                console.error('Error signing out:', error);
            }
            finally {
                setShowDeleteAccountModal(false);
            }
    }

    const getNumberOfChapters = () => {
        let chapters = 0;
        for (let i = 0; i < novels.length; i++) {
            chapters += novels[i].chapters.length;
        }
        return chapters;
    }

    const getNumberOfLikes = () => {
        let likes = 0;
        for (let i = 0; i < novels.length; i++) {
            likes += novels[i].upvotes;
        }
        return likes;
    }

    return (
        <div className='max-w-screen-lg mx-auto p-4 flex flex-col md:flex-row my-auto justify-center md:items-start items-center md:justify-between'>
            {/*Left component :: Profile picture */}

            <div className='w-full md:w-1/4 flex flex-col space-y-4 justify-center items-center order-1  mb-10 md:mb-0'>
                <div className="w-[80px] h-[80px] overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600 flex items-center justify-center">
                    <Link href={createEmailHash(email) == user.email_hash ? "#" : ""}>
                        {profilePicturePreview || user.picture ?
                            <div>
                                {profilePicturePreview ?
                                    <p onClick={handleProfilePictureUpload}> 
                                    <Image 
                                    src={profilePicturePreview} 
                                    alt="Profile Picture Preview" 
                                    className="object-cover object-center" 
                                    width={80} 
                                    height={80} />
                                    </p>
                                    :
                                    user.picture ?
                                        <p onClick={handleProfilePictureUpload}>
                                            <Image 
                                            src={getImageUrl(user.picture)} 
                                            className="object-cover object-center" 
                                            alt="Profile Picture Preview" 
                                            width={80} 
                                            height={80}
                                             />
                                        </p>
                                        : <></>
                                }
                            </div>
                            :
                            <div>
                                <svg 
                                onClick={handleProfilePictureUpload} 
                                className="w-[80px] h-[80px] text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                                </svg>
                            </div>
                        }
                    </Link>

                    <input type="file" id="profilePicture" className='hidden' onChange={handleFileChange} />
                </div>

                <div>
                    <p className="flex flex-row  font-bold hover:text-pink-600">
                    <span className="text-[10px] self-center rounded-xl text-white bg-purple-500 px-2 py-1 mr-1">
                      {phrase(dictionary, "author", language)}
                        </span>
                       {user.nickname}
                    </p>
                </div>
                <div className="flex flex-row space-x-8">
                    <div className='flex flex-col justify-center items-center'>
                        {/* <p>{Object.keys(dictionary).length != 0 && dictionary["numberOfWebnovels"][language]}</p> */}
                        <Book size={18} />
                        <p>{novels.length}</p>
                    </div>
                    <div className='flex flex-col justify-center items-center'>
                        {/* <p>{Object.keys(dictionary).length != 0 && dictionary["numTotalChapters"][language]}</p> */}
                        <Pencil size={18} />
                        <p>{getNumberOfChapters()}</p>
                    </div>
                    <div className='flex flex-col justify-center items-center'>
                        <p>
                        <Heart size={18} />
                        {/* {Object.keys(dictionary).length != 0 && dictionary["likes"][language]} */}
                        </p>
                        <p>{getNumberOfLikes()}</p>
                    </div>
                </div>


                {isProfileOwner() && <Button color='gray' variant='outlined' className='mt-10 w-32' onClick={() => setShowDeleteAccountModal(true)}>{phrase(dictionary, "deleteAccount", language)}</Button>}
            </div>


            {/*Right component :: Author bio & view webnovel */}
            <div className='flex flex-col space-y-8 w-full md:w-3/4 order-2 md:order-1'>
                {/* <div>
                   <p className="flex flex-row  font-bold hover:text-pink-600">
                    <span className="text-[10px] self-center rounded-xl text-white bg-purple-500 px-2 py-1 mr-1">
                      {phrase(dictionary, "author", language)}
                        </span>
                       {user.nickname}
                    </p>
                </div> 
                */}
                
                <div className='flex flex-row'>
                    <Link href="#" onClick={handleIntroClick}>
                        <p id='intro' className='text-xl w-fit px-4 font-bold border-b-2 border-[#142448]'>{Object.keys(dictionary).length != 0 && dictionary["authorBio"][language]}</p>
                    </Link>
                    <Link href="#" onClick={handleViewClick}>
                        <p id='view' className='text-xl w-fit px-4 border-b-2 border-gray'>{Object.keys(dictionary).length != 0 && dictionary["viewWebnovels"][language]}</p>
                    </Link>
                </div>
                <div className='flex flex-shrink-0 -translate-y-4' ref={introRef}>
                    <div id='bio'>
                        <OtherTranslateComponent key={key} content={user.bio} elementId={user.id.toString()} elementType='user' />
                    </div>
                </div>
                <div className="flex flex-shrink-0 -translate-y-12" ref={viewRef} >
                    <div id="works" ref={novelsRef} className={`max-w-screen-sm hidden md:max-w-screen-md flex flex-row gap-x-2 gap-y-4 flex-wrap after:content-[''] after:flex-auto`}>
                        {novels.map((item, index) => (
                            <div key={index} className='mx-2'> {/* This key may conflict with OtherTranslateComponent's key if len(webnovels) > 1000. */}
                                <WebnovelComponent webnovel={item} index={index} ranking={false} chunkIndex={0} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <Modal open={showDeleteAccountModal} onClose={() => setShowDeleteAccountModal(false)}>
                <Box sx={useModalStyle}>
                    <div className='flex flex-col space-y-4 items-center justify-center'>
                        {/* Delete */}
                        <p className='text-lg font-bold'>{phrase(dictionary, "deleteAccountConfirm", language)}</p>
                        <Button color='gray' variant='outlined' className='mt-10 w-32' onClick={handleDeleteAccount}>{phrase(dictionary, "yes", language)}</Button>
                        <Button color='gray' variant='outlined' className='mt-10 w-32' onClick={() => setShowDeleteAccountModal(false)}>{phrase(dictionary, "no", language)}</Button>
                    </div>
                </Box>
            </Modal>

        </div>
    );
}

export default ProfileComponent;
