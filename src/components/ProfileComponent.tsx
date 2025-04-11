'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Webnovel, UserStripped, User } from '@/components/Types';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import OtherTranslateComponent from '@/components/OtherTranslateComponent';
import { useUser } from '@/contexts/UserContext';
import { getImageUrl } from '@/utils/urls';
import Image from 'next/image'
import '@/styles/globals.css'
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Box, Button, Modal, useMediaQuery } from '@mui/material';
import { useModalStyle } from '@/styles/ModalStyles';
import {
    Book,
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
    Plus,
    ChevronRight,
    Copy
} from 'lucide-react';

import WebnovelsCardList from '@/components/WebnovelsCardList';
import WebnovelPictureComponent from '@/components/WebnovelPictureComponent';
import ReportButton from '@/components/ReportButton';
import BlockButton from '@/components/BlockButton';
import dynamic from 'next/dynamic';
import animationData from '@/assets/N_logo_with_heart.json';
import UserBlockedComponent from '@/components/UserBlockedComponent';
import ProfileDropdownButton from '@/components/UI/ProfileDropdownButton';
import SharingModal from '@/components/UI/SharingModal';
import DeleteAccountModal from '@/components/UI/DeleteAccountModal';
const ProfileComponent = ({ user, novels }: { user: UserStripped, novels: Webnovel[] }) => {

    const [introActive, setIntroActive] = useState<boolean>(true);
    const [viewActive, setViewActive] = useState<boolean>(false);
    const { language, dictionary } = useLanguage();
    const viewRef = useRef<HTMLDivElement>(null);
    const introRef = useRef<HTMLDivElement>(null);
    const novelsRef = useRef<HTMLDivElement>(null);
    const [introWidth, setIntroWidth] = useState<string>("0px")
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
    const [showDeleteAccountModal, setShowDeleteAccountModal] = useState<boolean>(false);
    const { id, email } = useUser();
    const { isLoggedIn } = useAuth();
    const router = useRouter();
    const { setIsLoggedIn, logout } = useAuth();
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const userDropdownRef = useRef<HTMLDivElement>(null);
    const [isShareDropdownOpen, setIsShareDropdownOpen] = useState(false);
    const shareDropdownRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [blockedUsers, setBlockedUsers] = useState<number[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshBlockedUsers, setRefreshBlockedUsers] = useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        async function getBlockedUsers() {
            setLoading(true);
            const response = await fetch('/api/get_blocked_users');
            if (!response.ok) {
                return null;
            }
            const data = await response.json();
            setBlockedUsers(data.blockedUsers.map((user: UserStripped) => user.id));
            setLoading(false);
        }
        if (isLoggedIn) {
            getBlockedUsers();
        } else {
            setLoading(false);
        }
    }, [refreshBlockedUsers, isLoggedIn]);

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
    // Import the LottieLoader dynamically
    const LottieLoader = dynamic(() => import('@/components/LottieLoader'), {
        ssr: false,
    });

    // implementing utils function
    const handleProfilePictureUpload = () => {
        if (id === user.id.toString()) {
            document.getElementById('profilePicture')?.click();
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (id !== user.id.toString()) {
            return;
        }
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfilePicture(file);
            setProfilePicturePreview(URL.createObjectURL(file));

            // Create FormData object
            const formData = new FormData();
            formData.append('file', file);
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
        if (id !== user.id.toString()) {
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

    const getNumberOfLikes = () => {
        let likes = 0;
        for (let i = 0; i < novels.length; i++) {
            likes += novels[i].upvotes;
        }
        return likes;
    }

    const getRecentNovel = () => {
        // TODO: optimize this
        return novels.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    }

    if (loading) {
        return <div className="loader-container">
            <LottieLoader width="w-40" animationData={animationData} />
        </div>
    }

    if (blockedUsers.includes(user.id)) {
        return <UserBlockedComponent id={user.id.toString()} />
    }

    return (
        <div className=' md:max-w-screen-xl w-full mx-auto  p-4 flex flex-col my-auto justify-center items-center'>
            {/*Left component :: Profile picture */}
            {/*    The side bar width is 72px  md:pl-[72px]  */}

            <div className='w-full rounded-md flex md:flex-row flex-col gap-6 justify-center items-center order-1 mb-10 md:mb-0 relative'>

                {/* Existing content container */}
                <div className="relative p-10 md:p-0 z-10 flex md:flex-row flex-col justify-evenly items-center md:h-[200px] h-auto space-y-1 bg-[#929292]/10 w-full">
                    <div className="absolute bg-white dark:bg-black rounded-md inset-0 bg-cover bg-center opacity-10 backdrop-blur-xl z-0"
                        style={{ backgroundImage: `url(${getImageUrl(user.picture)})`, backgroundColor: 'white', backgroundSize: 'cover', backgroundPosition: 'center', }}>
                    </div>
                    {/* profile picture */}
                    <div className='z-20 flex md:flex-row flex-col w-full justify-center items-center gap-6'>
                        <div className="w-[80px] h-[80px] overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600 flex items-center justify-center">
                            <Link href={id == user.id.toString() ? "#" : ""}>
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
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                                        </svg>
                                    </div>
                                }
                            </Link>

                            <input type="file" id="profilePicture" className='hidden' onChange={handleFileChange} />
                        </div>

                        {/* nickname */}
                        <div className='flex flex-col justify-center md:items-start items-center gap-4'>
                            <div className="flex flex-row justify-center items-center font-boldtext-left ">
                                {novels.length > 0 && <span className="text-[10px] self-center rounded-xl text-white bg-[#8A2BE2] px-2 p-1 mr-1">
                                    {phrase(dictionary, "author", language)}
                                </span>}
                                <p className="text-base">{user.nickname}</p>
                                <ProfileDropdownButton
                                    isProfileOwner={id === user.id.toString()}
                                    onDeleteAccount={() => setShowDeleteAccountModal(true)}
                                    user={user}
                                />
                            </div>

                            {/* number of webnovels, chapters, likes */}
                            <div>
                                <div className="flex flex-row gap-4 justify-center items-center text-gray-600 dark:text-white">
                                    <div className='flex flex-col justify-center items-center pr-6 border-r border-gray-300'>
                                        {/* <p>{Object.keys(dictionary).length != 0 && dictionary["numberOfWebnovels"][language]}</p> */}
                                        <p className='flex flex-row justify-center items-center gap-1 text-sm'>
                                            <Book size={15} />
                                            {/* Works  */}
                                            {phrase(dictionary, "works", language)}
                                        </p>
                                        <p className='text-sm text-center text-gray-500'>{novels.length}</p>
                                    </div>
                                    <div className='flex flex-col justify-center items-center pr-6 border-r border-gray-300'>
                                        {/* <p>{Object.keys(dictionary).length != 0 && dictionary["numTotalChapters"][language]}</p> */}
                                        <p className='flex flex-row justify-center items-center gap-1 text-sm'>
                                            {/* <Pencil size={15} />  */}
                                            <Eye size={15} />
                                            {/* Views  */}
                                            {phrase(dictionary, "views", language)}
                                        </p>
                                        <p className='text-sm text-center text-gray-500'>{novels.reduce((acc: number, novel: Webnovel) => acc + novel.views, 0)}</p>
                                        {/* <p>{getNumberOfChapters()}</p> */}
                                    </div>
                                    <div className='flex flex-col justify-center items-center'>
                                        <p className='flex flex-row justify-center items-center gap-1 text-sm'>
                                            <Heart size={15} />
                                            {/* Likes */}
                                            {phrase(dictionary, "likes", language)}
                                            {/* {Object.keys(dictionary).length != 0 && dictionary["likes"][language]} */}
                                        </p>
                                        <p className='text-sm text-center text-gray-500'>{getNumberOfLikes()}</p>
                                    </div>
                                </div>
                            </div>
                            <div className='flex flex-row gap-4 text-gray-600'>
                                {/* share */}
                                <Button
                                    color='gray'
                                    variant='outlined'
                                    onClick={() => setIsModalOpen(true)}
                                    className='border-2 bg-white border-gray-300 rounded-sm px-4 py-2 w-16 flex flex-row justify-center items-center gap-1'>
                                    <ExternalLink size={10} />
                                </Button>
                                {/* report */}
                                <ReportButton user={user} />
                                {/* block */}
                                {isLoggedIn && <BlockButton user={user} setRefreshBlockedUsers={setRefreshBlockedUsers} />}
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <div className='flex flex-col gap-2 w-full order-2 md:m-6 m-0'>
                {
                    novels.length > 0 ? (
                        <Button color='gray' onClick={() => router.push(`/view_webnovels/${getRecentNovel().id}`)} variant='outlined' className='border-b border-gray-300 rounded-sm px-4 py-2'>
                            <div className='flex flex-row gap-1 justify-center items-center'>
                                <OtherTranslateComponent
                                    content={getRecentNovel().title}
                                    elementId={user.id.toString()}
                                    elementType='user'
                                />
                                {phrase(dictionary, "startToRead", language)}
                            </div>
                            <ChevronRight size={10} />
                        </Button>
                    ) : <p className='flex flex-row gap-2 justify-center items-center'>

                    </p>
                }
            </div>

            <div className='flex flex-col w-full justify-center items-center order-2'>

                <div className='flex flex-col w-full md:justify-start md:items-start justify-center items-center gap-6'>

                    <p className='text-lg border-b-1 border-gray-500 font-bold w-full uppercase'>
                        {phrase(dictionary, "authorBio", language)}
                    </p>

                    <div>
                        {user.bio ? (
                            <>
                                <OtherTranslateComponent
                                    content={user.bio}
                                    elementId={user.id.toString()}
                                    elementType='user'
                                />
                            </>
                        )
                            : <p className='text-sm text-gray-500'>
                                {phrase(dictionary, "noBioYet", language)}
                            </p>
                        }
                    </div>


                    <p className='text-lg border-b-1 border-gray-500 w-full uppercase font-bold'>
                        {phrase(dictionary, "viewWebnovels", language)}
                    </p>

                    {novels.length > 0 ? (<div className={`w-full flex flex-row gap-x-2 gap-y-4 flex-wrap `}>
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
                    </div>) : (<div className='flex flex-col gap-4 justify-center items-center text-center text-sm border-b-1 border-gray-300 w-full uppercase'>
                        {/* 작품이 없습니다 */}
                        <p>{phrase(dictionary, "noNovelsYet", language)} </p>
                        <Button className="bg-[#DB2777] text-md text-white px-4 py-2 rounded-md">
                            <Link href="/new_webnovel">
                                {phrase(dictionary, "writeYourStory", language)}
                            </Link>
                        </Button>
                    </div>)}


                    {/* <div>
                    <p className='text-lg border-b-1 border-gray-500 w-full uppercase'>
                        PEOPLE ALSO LIKE 
                        {phrase(dictionary, "peopleAlsoLike", language)}
                    </p>
                       
                    </div> 
                    */}
                </div>

            </div>
            <SharingModal
                isProfileOwner={id === user.id.toString()}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                user={user}
                onConfirm={() => { setIsModalOpen(false) }}
                onCancel={() => { setIsModalOpen(false) }}
            />
            <DeleteAccountModal
                isOpen={showDeleteAccountModal}
                onClose={() => setShowDeleteAccountModal(false)}
                onConfirm={handleDeleteAccount}
            />

        </div>
    );
}

export default ProfileComponent;
