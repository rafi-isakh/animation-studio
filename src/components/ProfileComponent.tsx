'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
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
import { Box, Button, Modal, useMediaQuery } from '@mui/material';
import { useModalStyle } from '@/styles/ModalStyles';
import { Book, 
        Pencil, 
        Heart, 
        ExternalLink, 
        Ellipsis, 
        Eye, 
        CircleHelp, 
        Flag, 
        UserRoundX, 
        Twitter,
        Facebook,
        Copy
 } from 'lucide-react';
import { createEmailHash } from '@/utils/cryptography';

import AuthorAndWebnovelsAsideComponent from '@/components/AuthorAndWebnovelsAsideComponent';
import WebnovelsCardList from '@/components/WebnovelsCardList';
import WebnovelPictureComponent from '@/components/WebnovelPictureComponent';



const ProfileComponent = ({ user, novels }: { user: User, novels: Webnovel[] }) => {

    const [introActive, setIntroActive] = useState<boolean>(true);
    const [viewActive, setViewActive] = useState<boolean>(false);
    const { language, dictionary } = useLanguage();
    const viewRef = useRef<HTMLDivElement>(null);
    const introRef = useRef<HTMLDivElement>(null);
    const novelsRef = useRef<HTMLDivElement>(null);
    const [introWidth, setIntroWidth] = useState<string>("0px")
    const [key1, setKey1] = useState(0);
    const [key2, setKey2] = useState(1000);
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
    const [showDeleteAccountModal, setShowDeleteAccountModal] = useState<boolean>(false);
    const { email } = useUser();
    const router = useRouter();
    const { setIsLoggedIn, logout } = useAuth();
    const [isPremium, setIsPremium] = useState<boolean>(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const userDropdownRef = useRef<HTMLDivElement>(null);
    const [isShareDropdownOpen, setIsShareDropdownOpen] = useState(false);
    const shareDropdownRef = useRef<HTMLDivElement>(null);
    // const userMenuRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const isMobile = useMediaQuery('(max-width: 768px)');

    useEffect(() => {
        setKey1(prevKey => prevKey + 1)
        setKey2(prevKey => prevKey + 1)
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

    const getRecentNovel = () => {
        return novels.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    }

    const toggleUserDropdown = () => {
        setIsUserDropdownOpen(prev => !prev);
    }
    const toggleShareDropdown = () => {
        setIsShareDropdownOpen(prev => !prev);
    }

    return (
        <div className='max-w-screen-lg mx-auto md:p-0 p-4 flex flex-col my-auto justify-center items-center'>
            {/*Left component :: Profile picture */}

            <div className='w-full rounded-md flex md:flex-row flex-col gap-10 justify-center items-center order-1 mb-10 md:mb-0 relative'>
               
        {/* Existing content container */}
        <div className="relative p-10 md:p-0 z-10 flex md:flex-row flex-col justify-evenly items-center md:h-[200px] h-auto space-y-1 bg-[#929292]/10 w-full">
        <div className="absolute bg-white dark:bg-black rounded-md inset-0 bg-cover bg-center opacity-10 backdrop-blur-[300px] z-0" 
            style={{ backgroundImage: `url(${getImageUrl(user.picture)})`, backgroundColor: 'white', backgroundSize: 'cover', backgroundPosition: 'center',  }}>
        </div>
            {/* profile picture */}
            <div className='z-20 flex md:flex-row flex-col w-full justify-center items-center gap-6'>
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
        
                      

                {/* nickname */}
                <div className='flex flex-col justify-center md:items-start items-center gap-4'>
                    <p className="flex flex-row justify-start items-start font-boldtext-left">
                    <span className="text-[10px] self-center rounded-xl text-white bg-purple-500 px-2 py-1 mr-1">
                      {phrase(dictionary, "author", language)}
                    </span>
                       {user.nickname} 
                        <Link href="#" onClick={toggleUserDropdown} className='flex flex-row self-center ml-1 hover:text-gray-300'> 
                            <Ellipsis size={18} /> 
                        </Link> 
                    </p>
                    {isUserDropdownOpen && (
                            <div id="user-dropdown" ref={userDropdownRef} className={`absolute rounded-md md:border-0 border border-gray-400 -mt-2 ml-10 z-10 font-normal bg-white dark:bg-black dark:text-white divide-y divide-gray-100 shadow w-32 dark:divide-gray-600`}>
                                <ul className="py-2 text-sm text-gray-700 dark:text-black" aria-labelledby="dropdownLargeButton">
                                    <li className="px-3 py-2 hover:bg-gray-200  dark:hover:bg-gray-600 group/user-dropdown transition duration-150 ease-in-out">
                                      { isProfileOwner() && 
                                       <Link href="#" onClick={() => setShowDeleteAccountModal(true)} className="flex items-center gap-2 dark:text-white text-black dark:group-hover/user-dropdown:text-black">
                                        <UserRoundX size={20} />
                                        {phrase(dictionary, "deleteAccount", language)}
                                             {/* {isProfileOwner() && <Button color='gray' variant='outlined' className='flex items-center gap-2 dark:text-white text-black dark:group-hover/user-dropdown:text-black' onClick={() => setShowDeleteAccountModal(true)}>{phrase(dictionary, "deleteAccount", language)}</Button>} */}
                                        </Link>
                                        }
                                    </li>
                                     { !isProfileOwner() &&
                                    <li className="px-3 py-2 hover:bg-gray-200  dark:hover:bg-gray-600 group/user-dropdown transition duration-150 ease-in-out">   
                                        <Link href="#" className="flex items-center gap-2 dark:text-white text-black dark:group-hover/user-dropdown:text-black">
                                            <Flag size={20} className="dark:text-white text-black" />
                                              {phrase(dictionary, "report", language)}
                                        </Link>
                                    </li>
                                    }
                                    <li className="px-3 py-2 hover:bg-gray-200 dark:hover:bg-gray-600 group/user-dropdown transition duration-150 ease-in-out">
                                        <Link href="#" className="flex items-center gap-2 dark:text-white text-black dark:group-hover/user-dropdown:text-black">
                                            <CircleHelp size={20} className="dark:text-white text-black" />
                                               {phrase(dictionary, "help", language)}
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        )}
                {/* number of webnovels, chapters, likes */}
                   <div>
                  <div className="flex flex-row gap-4 justify-center items-center text-gray-600 dark:text-white">
                    <div className='flex flex-col justify-center items-center pr-3 border-r border-gray-300'>
                        {/* <p>{Object.keys(dictionary).length != 0 && dictionary["numberOfWebnovels"][language]}</p> */}
                        <p className='flex flex-row justify-center items-center gap-2'> 
                            <Book size={15} /> 
                            {/* Works  */}
                            {phrase(dictionary, "works", language)}
                        </p>
                        <p>{novels.length}</p>
                    </div>
                        <div className='flex flex-col justify-center items-center pr-3 border-r border-gray-300'>
                            {/* <p>{Object.keys(dictionary).length != 0 && dictionary["numTotalChapters"][language]}</p> */}
                            <p className='flex flex-row justify-center items-center gap-2'> 
                                {/* <Pencil size={15} />  */}
                                <Eye size={15} />
                                {/* Views  */}
                                {phrase(dictionary, "views", language)}
                            </p>
                            <p>{novels.reduce((acc: number, novel: Webnovel) => acc + novel.views, 0)}</p>
                            {/* <p>{getNumberOfChapters()}</p> */}
                        </div>
                        <div className='flex flex-col justify-center items-center'>
                            <p className='flex flex-row justify-center items-center gap-2'>
                            <Heart size={15} /> 
                            {/* Likes */}
                            {phrase(dictionary, "likes", language)}
                            {/* {Object.keys(dictionary).length != 0 && dictionary["likes"][language]} */}
                            </p>
                            <p>{getNumberOfLikes()}</p>
                        </div>
                    </div>
              </div>
                        
                    <div className='flex flex-row gap-4 text-gray-600'>
                        <Button color='gray' variant='outlined' className='border-2 bg-white border-gray-300 rounded-sm px-4 py-2 w-24'>
                            {/* +Follow */}
                            {phrase(dictionary, "follow", language)}
                        </Button>
                        <Button color='gray' variant='outlined' onClick={toggleShareDropdown} className='border-2 bg-white border-gray-300 rounded-sm px-4 py-2 w-24 flex flex-row justify-center items-center'>
                            <ExternalLink size={18} />
                            {/* share */}
                            {phrase(dictionary, "share", language)}
                        </Button>
                        {isShareDropdownOpen && (
                            <div id="share-dropdown" ref={shareDropdownRef} className={`absolute rounded-md md:border-0 border border-gray-400 mt-10 ml-24 z-10 font-normal bg-white dark:bg-black dark:text-white shadow w-44`}>
                                <p className='text-center font-bold text-sm m-1'> SHARE PROFILE </p>
                                <ul className="flex flex-row gap-2 justify-center items-center m-2 text-sm text-gray-700 dark:text-black" aria-labelledby="dropdownLargeButton">
                                    <li className="hover:opacity-80 transition duration-150 ease-in-out">
                                        <Link href="#" className="flex items-center dark:text-white text-black">
                                            <Facebook size={30} className="dark:text-white text-white bg-blue-900 rounded-full p-1" />
                                        
                                        </Link>
                                    </li>
                                    <li className="hover:opacity-80 transition duration-150 ease-in-out">
                                        <Link href="#" className="flex items-center dark:text-white text-black">
                                            <Twitter size={30} className="dark:text-white text-white bg-blue-500 rounded-full p-1" />
                                        
                                        </Link>
                                    </li>
                                    <li className="hover:opacity-80 transition duration-150 ease-in-out">
                                        <Link href="#" className="flex items-center dark:text-white text-black">
                                            <Copy size={30} className="dark:text-white text-white bg-gray-500 rounded-full p-1" />
                                        
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
               </div>
            </div>
        </div>

            </div>

                <div className='flex flex-col gap-4 w-full order-2 md:m-10 m-0'>
                   
                       


                        <Button color='gray' variant='outlined'className='border-b border-gray-300 rounded-sm px-4 py-2 '>
                            {/* Start To Read From Episode 1 &gt;  */}
                            {/* <span className='text-sm'>{getRecentNovel().title}</span> */}
                          <p className='flex flex-row gap-2 justify-center items-center'> 
                            <OtherTranslateComponent key={key1} content={getRecentNovel().title} elementId={user.id.toString()} elementType='user' /> 
                            {phrase(dictionary, "startToRead", language)}
                         </p> 
                        </Button>
                        {/* {isPremium ? <button className='border-2 border-gray-300 rounded-sm px-4 py-2'>
                            {phrase(dictionary, "unlockNextEpisode", language)}
                        </button> 
                        : <><button className='border-b-2 border-gray-300 rounded-sm px-4 py-2'>
                            {phrase(dictionary, "viewAnotherWorks", language)}
                        </button></> } */}
                  
                </div>

            {/*Right component :: Author bio & view webnovel */}
            <div className='flex flex-col w-full justify-center items-center order-2 mt-5'>
                {/* <div>
                   <p className="flex flex-row  font-bold hover:text-pink-600">
                    <span className="text-[10px] self-center rounded-xl text-white bg-purple-500 px-2 py-1 mr-1">
                      {phrase(dictionary, "author", language)}
                        </span>
                       {user.nickname}
                    </p>
                </div> 
                */}

               {/*--  left-hand side:  Author's other works link */}
                {/* <div className='w-full md:w-1/4 p-4 border-r md:block hidden'>
                    <Suspense>
                        <AuthorAndWebnovelsAsideComponent webnovels={novels} nickname={user.nickname} />
                    </Suspense>
                </div>  */}
                    {/*-- left-hand side:  Author's other works link end */}

                
                <div className='flex flex-col w-full md:justify-start md:items-start justify-center items-center gap-10'>
                   
                    <p className='text-lg border-b-1 border-gray-500 w-full uppercase'>
                        {Object.keys(dictionary).length !== 0 && phrase(dictionary, "authorBio", language)}
                    </p>
        
                    <div>
                        <OtherTranslateComponent key={key2} content={user.bio} elementId={user.id.toString()} elementType='user' />
                    </div>
                 
    
                    <p className='text-lg border-b-1 border-gray-500 w-full uppercase'>
                        {Object.keys(dictionary).length != 0 && dictionary["viewWebnovels"][language]}
                    </p>
             
                    <div className={`w-full flex flex-row gap-x-2 gap-y-4 flex-wrap `}>
                        {/* after:content-[''] after:flex-auto */}
                            {/* <div key={index} className=''> */}
                                 {/* This key may conflict with OtherTranslateComponent's key if len(webnovels) > 1000. */}
                                <WebnovelsCardList
                                    title=""
                                    subtitle=""
                                    webnovels={novels}
                                    scrollRef={scrollRef}
                                    isMobile={isMobile}
                                    renderItem={(item: Webnovel, index: number) => (
                                        <WebnovelPictureComponent 
                                            webnovel={item} 
                                            index={index} 
                                            ranking={false} 
                                            details={false}
                                            up={false}
                                            isOriginal={false}
                                        />
                                        )}
                                        />
                            {/* </div> */}
                     
                    </div>

                    <p className='text-lg border-b-1 border-gray-500 w-full uppercase'>
                        {/* PEOPLE ALSO LIKE */}
                        {phrase(dictionary, "peopleAlsoLike", language)}
                    </p>


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
