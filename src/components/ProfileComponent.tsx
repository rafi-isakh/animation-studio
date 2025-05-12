'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Webnovel, UserStripped, ToonyzPost } from '@/components/Types';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import OtherTranslateComponent from '@/components/OtherTranslateComponent';
import { useUser } from '@/contexts/UserContext';
import { getImageUrl, getVideoUrl } from '@/utils/urls';
import Image from 'next/image'
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/shadcnUI/Button';
import { useMediaQuery } from '@mui/material';
import {
    Book,
    Heart,
    Eye,
    ChevronRight,
    ImageUp,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/shadcnUI/Tooltip";
import WebnovelsCardList from '@/components/WebnovelsCardList';
import WebnovelPictureComponent from '@/components/WebnovelPictureComponent';
import ReportButton from '@/components/UI/ReportButton';
import BlockButton from '@/components/UI/BlockButton';
import dynamic from 'next/dynamic';
import animationData from '@/assets/N_logo_with_heart.json';
import UserBlockedComponent from '@/components/UserBlockedComponent';
import DeleteAccountModal from '@/components/UI/DeleteAccountModal';
import { usePathname } from 'next/navigation';
import ProfileShareButton from '@/components/UI/ProfileShareButton';
import { EditProfileButton } from '@/components/UI/EditProfileButton';
import ToonyzPostCardList from '@/components/UI/ToonyzPostCardList';
import DeleteAccountButton from './UI/DeleteAccountButton';

const ProfileComponent = ({ user, novels }: { user: UserStripped, novels: Webnovel[] }) => {
    const { language, dictionary } = useLanguage();
    const introRef = useRef<HTMLDivElement>(null);
    const novelsRef = useRef<HTMLDivElement>(null);
    const [introWidth, setIntroWidth] = useState<string>("0px")
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
    const [showDeleteAccountModal, setShowDeleteAccountModal] = useState<boolean>(false);
    const { id, email, email_hash } = useUser();
    const { isLoggedIn } = useAuth();
    const router = useRouter();
    const { logout } = useAuth();
    const scrollRef = useRef<HTMLDivElement>(null);
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [blockedUsers, setBlockedUsers] = useState<number[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshBlockedUsers, setRefreshBlockedUsers] = useState<boolean>(false);
    const pathname = usePathname();
    const [displayNickname, setDisplayNickname] = useState<string>(user.nickname);
    const [displayBio, setDisplayBio] = useState<string>(user.bio);
    const [posts, setPosts] = useState<ToonyzPost[]>([]);
    const [deleteAccountReason, setDeleteAccountReason] = useState<string>("");
    const [deleteAccountReasonType, setDeleteAccountReasonType] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);

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

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await fetch('/api/get_toonyz_posts');
                if (!response.ok) {
                    throw new Error('Failed to fetch posts');
                }

                const data = await response.json();
                if (id === user.id.toString()) {
                    const filteredMyPosts = data.filter((post: ToonyzPost) =>
                        post.user.email_hash === email_hash
                    );
                    setPosts(filteredMyPosts);
                } else {
                    const filteredPosts = data.filter((post: ToonyzPost) =>
                        post.user.id === user.id
                    );
                    setPosts(filteredPosts);
                }

            } catch (error) {
                console.error('Error fetching posts:', error);
            }
        };
        fetchPosts();
    }, [email_hash]);


    useEffect(() => {
        if (user.bio !== displayBio) {
            setDisplayBio(user.bio);
        }
    }, [user.bio]);

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
        setIsLoading(true);
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
            const message = `Deleted user: ${user.nickname} <br/> User ID: ${user.id} <br/><br/> Deleted at: ${new Date().toISOString()} <br/><br/> Content: ${deleteAccountReason} <br/><br/> Reason Type: ${deleteAccountReasonType}`;
            fetch('/api/send_email', {
                method: 'POST',
                body: JSON.stringify({ message: message, email: email, templateType: 'report', subject: 'Survey - Account deletion', staffEmail: 'dami@stelland.io, min@stelland.io' })
            })
            await logout(true, `/`);
        } catch (error) {
            console.error('Error signing out:', error);
            setIsLoading(false);
        }
        finally {
            setShowDeleteAccountModal(false);
            setIsLoading(false);
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

    const hideManuInPages = () => {
        if (pathname === '/view_profile') {
            return "hidden";
        }
        return "";
    }

    return (
        <div className={`${id === user.id.toString() ? 'md:max-w-screen-md' : 'md:max-w-screen-xl'}  w-full mx-auto md:p-0 p-4 flex flex-col my-auto justify-center items-center`}>
            <div className="flex flex-col md:flex-row w-full">
                <div className={`w-full flex flex-col md:gap-4 md:px-2`}>
                    <div className='w-full flex md:flex-row flex-col gap-6 justify-center items-center order-1 relative'>
                        <div className="relative rounded-xl p-6 md:p-0 z-10 flex md:flex-row flex-col justify-evenly items-center md:h-[200px] h-auto space-y-1 bg-[#929292]/10 w-full">
                            <div className="absolute rounded-xl bg-white dark:bg-black inset-0 bg-cover bg-center opacity-10 backdrop-blur-xl z-0"
                                style={{
                                    backgroundImage: `url(${getImageUrl(user.picture)})`,
                                    backgroundColor: 'white',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }}>
                            </div>
                            {/* profile picture */}
                            <div className='z-20 flex md:flex-row flex-col w-full justify-center items-center md:gap-6 gap-2'>
                                <div className='relative'>
                                    {id == user.id.toString() && <TooltipProvider delayDuration={0}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button onClick={handleProfilePictureUpload} size="icon" variant="ghost" className="!no-underline absolute bottom-0 right-0 overflow-visible bg-black rounded-full">
                                                    <ImageUp className=" text-white" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                {phrase(dictionary, "uploadProfilePicture", language)}
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    }
                                    <div className="w-[80px] h-[80px] overflow-hidden  bg-gray-100 rounded-full dark:bg-gray-600 flex items-center justify-center">
                                        <Link href={id == user.id.toString() ? "#" : ""}>
                                            {profilePicturePreview || user.picture ?
                                                <div className="">
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
                                </div>
                                <div className='flex flex-col justify-center md:items-start items-center gap-4'>
                                    <div className="flex flex-row justify-center items-center font-bold text-left gap-2 ">
                                        {novels.length > 0 && <span className="text-[10px] self-center rounded-xl text-white bg-[#8A2BE2] px-2 p-1 mr-1">
                                            {phrase(dictionary, "author", language)}
                                        </span>
                                        }
                                        <p className="text-xl">{displayNickname}</p>
                                        <div className='flex flex-row gap-0 text-gray-600 dark:text-white'>
                                            {isLoggedIn && user.id.toString() === id && <EditProfileButton nickname={user.nickname} setDisplayNickname={setDisplayNickname} setDisplayBio={setDisplayBio} />}
                                            <ProfileShareButton user={user} id={id} />
                                            {isLoggedIn && user.id.toString() !== id && <ReportButton user={user} />}
                                            {isLoggedIn && user.id.toString() !== id && <BlockButton user={user} setRefreshBlockedUsers={setRefreshBlockedUsers} />}
                                            {isLoggedIn && user.id.toString() === id && <DeleteAccountButton setShowDeleteAccountModal={setShowDeleteAccountModal} />}
                                        </div>
                                    </div>
                                    <div>
                                        {novels.length > 0 && <div className="flex flex-row gap-4 justify-center items-center text-gray-600 dark:text-white">
                                            <div className='flex flex-col justify-center items-center md:pr-6 pr-2 border-r border-gray-300'>
                                                <p className='flex flex-row justify-center items-center gap-1 text-sm'>
                                                    <Book size={15} />
                                                    <p className='text-sm capitalize'>{phrase(dictionary, "works", language)}</p>
                                                    <p className='text-sm text-center text-gray-500'>{novels.length}</p>
                                                </p>
                                            </div>
                                            <div className='flex flex-col justify-center items-center md:pr-6 pr-2 border-r border-gray-300'>
                                                <p className='flex flex-row justify-center items-center gap-1 text-sm'>
                                                    <Eye size={15} />
                                                    <p className='text-sm capitalize'>{phrase(dictionary, "views", language)}</p>
                                                    <p className='text-sm text-center text-gray-500'>{novels.reduce((acc: number, novel: Webnovel) => acc + novel.shown_views, 0)}</p>
                                                </p>
                                            </div>
                                            <div className='flex flex-col justify-center items-center'>
                                                <p className='flex flex-row justify-center items-center gap-1 text-sm'>
                                                    <Heart size={15} />
                                                    <p className='text-sm capitalize'>{phrase(dictionary, "likes", language)}</p>
                                                    <p className='text-sm text-center text-gray-500'>{getNumberOfLikes()}</p>
                                                </p>
                                            </div>
                                        </div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='flex flex-col gap-2 w-full order-2 md:my-0 my-4'>
                        {
                            novels.length > 0 ? (
                                <Button color='gray' onClick={() => router.push(`/view_webnovels/${getRecentNovel().id}`)} variant='outline' className='border border-gray-300 rounded-sm'>
                                    <div className='flex flex-row gap-1 justify-center items-center'>
                                        <OtherTranslateComponent
                                            element={getRecentNovel()}
                                            content={getRecentNovel().title}
                                            elementId={getRecentNovel().id.toString()}
                                            elementType='webnovel'
                                            elementSubtype='title'
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
                        <div className='flex flex-col w-full justify-start items-start gap-6'>
                            <h1 className="flex flex-row text-xl font-extrabold md:mb-0 mb-3">
                                {phrase(dictionary, "userBio", language)}
                            </h1>
                            <div>
                                {displayBio ? displayBio : user.bio ? (
                                    // TODO: this has to be reviewed by Min, because it's not the best way to do this
                                    // doesn't work when changing bio, otherTranslateComponent doesn't rerender
                                    <>
                                        <OtherTranslateComponent
                                            key={`bio-${user.bio}`}
                                            element={user}
                                            content={user.bio}
                                            elementId={user.id.toString()}
                                            elementType='user'
                                            classParams='text-base'
                                        />
                                    </>
                                ) : (
                                    user.bio === "" ?
                                        <p className='text-base text-gray-500'>
                                            {phrase(dictionary, "noBioYet", language)}
                                        </p>
                                        : (<></>)
                                )}
                            </div>

                            {novels.length > 0 ? (
                                <div className='w-full flex'>
                                    {/* This key may conflict with OtherTranslateComponent's key if len(webnovels) > 1000. */}
                                    <WebnovelsCardList
                                        title={phrase(dictionary, "viewWebnovels", language)}
                                        subtitle=""
                                        webnovels={novels}
                                        scrollRef={scrollRef}
                                        isMobile={isMobile}
                                        renderItem={(item: Webnovel, index: number) => (
                                            <WebnovelPictureComponent
                                                webnovel={item}
                                            />
                                        )}
                                    />
                                </div>
                            ) : (<></>)}
                            <div className='w-full flex'>
                                <ToonyzPostCardList posts={posts} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <DeleteAccountModal
                isOpen={showDeleteAccountModal}
                onClose={() => setShowDeleteAccountModal(false)}
                onConfirm={handleDeleteAccount}
                deleteAccountReason={deleteAccountReason}
                setDeleteAccountReason={setDeleteAccountReason}
                deleteAccountReasonType={deleteAccountReasonType}
                setDeleteAccountReasonType={setDeleteAccountReasonType}
                isLoading={isLoading}
            />
        </div >
    );
}

export default ProfileComponent;
