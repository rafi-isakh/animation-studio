"use client"
import { User, ToonyzPost, Webnovel } from "@/components/Types";
import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { getImageUrl, getVideoUrl } from "@/utils/urls";
import { MoveLeft, Heart, MessageCircle, Share2, Film, Clock4, Eye, Copy, Bookmark } from "lucide-react";
import { useWebnovels } from '@/contexts/WebnovelsContext';
import CommentsComponent from "@/components/CommentsComponent";
import OtherTranslateComponent from "@/components/OtherTranslateComponent";
import WatermarkedImage from "@/utils/watermark";
import TopNavigationMenu from "@/components/UI/TopNavigationMenu";
import ToonyzPostGrid from "@/components/UI/ToonyzPostGrid";
import { WebnovelHoverCard, WebnovelCard } from "@/components/UI/WebnovelHoverCard";
import ToonyzPostQuoteToggle from "@/components/UI/ToonyzPostQuoteToggle";
import { useUser } from '@/contexts/UserContext';
import UserInfoCard from "@/components/UI/UserInfoCard";
import { truncateText } from "@/utils/truncateText";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { useMediaQuery } from "@mui/material";
import dynamic from 'next/dynamic';
const LottieLoader = dynamic(() => import('@/components/LottieLoader'), {
    ssr: false,
});
import animationData from '@/assets/N_logo_with_heart.json';

function getRandomDimensions() {
    const widths = [900, 1000, 1200]
    const heights = [1000, 1200, 1400, 1600]
    return {
        width: widths[Math.floor(Math.random() * widths.length)],
        height: heights[Math.floor(Math.random() * heights.length)],
    }
}

const ToonyzPostPage = ({ params }: { params: { id: string } }) => {
    const [post, setPost] = useState<ToonyzPost | undefined>(undefined);
    const [allPosts, setAllPosts] = useState<ToonyzPost[] | undefined>(undefined);
    const [lastPostId, setLastPostId] = useState<string | null>(null);
    const { getWebnovelById } = useWebnovels();
    const [webnovel, setWebnovel] = useState<Webnovel | undefined>(undefined);
    const { email: currentUserEmail } = useUser();
    const { dictionary, language } = useLanguage();
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchPost = async () => {
            fetch('/api/get_toonyz_posts')
                .then(res => res.json())
                .then(data => {
                    const post = data.find((post: ToonyzPost) => post.id.toString() === params.id);
                    if (post) {
                        setPost(post);
                    }
                    setIsLoading(false);
                });
        };
        fetchPost();
    }, [params.id]);

    useEffect(() => {
        const fetchWebnovel = async () => {
            if (post?.webnovel_id) {
                const novel = await getWebnovelById(post.webnovel_id);
                setWebnovel(novel);
            }
        };
        fetchWebnovel();
    }, [post?.webnovel_id, getWebnovelById]);

    if (isLoading) {
        return (<div className="loader-container"> <LottieLoader width="w-40" animationData={animationData} /></div>)
    }

    if (!post) {
        return <div className="flex items-center justify-center min-h-screen">Post not found</div>;
    }

    const isAuthor = currentUserEmail === post.user.email_hash;

    return (
        <div className="flex flex-col mx-auto w-full min-h-screen pb-20 ">
            {/* header fixed */}
            <div className="fixed top-0 z-[99] w-full mx-auto bg-background backdrop-blur-lg supports-[backdrop-filter]:bg-background/80">
                <div className="flex flex-row items-center justify-between gap-2 md:px-5 px-4 md:max-w-screen-xl mx-auto">
                    <Link href="/feeds" className="self-start my-5 flex flex-row items-center gap-2">
                        <MoveLeft size={20} className='dark:text-white text-gray-500' />
                        <p className="text-sm text-gray-500 font-bold font-base">{phrase(dictionary, "back", language)}</p>
                    </Link>
                    <TopNavigationMenu
                        email={currentUserEmail}
                        isAuthor={isAuthor ?? false}
                        user={post.user}
                        postId={post.id.toString()}
                    />
                </div>
            </div>

            {/* Image/Video Container - simplified for mobile */}
            <div className={`relative max-w-screen-lg mx-auto w-full group
                            ${post.image
                            ? 'md:h-full h-[40vh] top-8 mt-8'
                            : 'md:h-full md:top-16 md:mt-16'}`}>
                {post.image ? (
                    <div className="group h-full w-full">
                        {/* <Image src={getImageUrl(post.image)} alt="Toonyz Post" fill className="object-cover h-full w-full overflow-hidden md:scale-125 scale-100 transition-all duration-300 group-hover:blur-sm" /> */}
                        <WatermarkedImage
                            imageUrl={getImageUrl(post.image)}
                            watermarkUrl="/toonyz_logo_white.svg"
                            webnovelTitle={webnovel?.title}
                            chapterTitle={webnovel?.chapters.find(chapter => chapter.id.toString() === post.chapter_id)?.title || post.chapter_id}
                            watermarkOpacity={0.2}
                            watermarkPosition="centerRight"
                            titlePosition="centerLeft"
                            titleColor="white"
                            className="object-cover h-full w-full overflow-hidden scale-100 transition-all duration-300"
                        />
                    </div>
                ) : (
                    <div className="relative group h-full w-full">
                        <video
                            src={getVideoUrl(post.video)}
                            muted
                            loop
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover md:scale-110 scale-100 transition-transform duration-200 overflow-hidden"
                        />
                    </div>
                )}
            </div>

            {/* Description Container - simplified for mobile */}
            <div className={`w-full flex flex-col gap-4 bg-white dark:bg-[#211F21] relative z-10
                            ${post.image ? 'p-4 md:mt-[2rem] mt-[2rem]' : 'p-4 md:mt-[8rem] mt-0'}`}>
                <div className="md:max-w-screen-md mx-auto w-full flex flex-col items-center gap-y-5 px-2 md:px-4">
                    <div className="relative flex justify-center md:-top-[2rem] -top-[2.1rem]">
                        {/* user hover card */}
                        <UserInfoCard post={post} />
                    </div>
                    <p className="text-center text-xl md:text-4xl font-bold">
                        <OtherTranslateComponent content={post.title} elementId={post.id.toString()} elementType="toonyz_post" elementSubtype="title" />
                    </p>

                    {/* views, comments likes and date */}
                    <div className='flex flex-row flex-wrap gap-2 justify-center'>
                        <div className="text-sm text-gray-500 flex flex-row items-center">
                            <Eye size={16} className="mr-2" />
                            <span>{post.views}</span>
                        </div>

                        <div className="text-sm text-gray-500 flex flex-row items-center">
                            <MessageCircle size={16} className="mr-2" />
                            <span>{post.comments.length}</span>
                        </div>

                        <div className="text-sm text-gray-500 flex flex-row items-center">
                            <Heart size={16} className="mr-2" />
                            <span>{post.upvotes}</span>
                        </div>

                        {post.created_at && (
                            <p className="text-sm text-gray-500 flex flex-row items-center">
                                <Clock4 size={16} className="mr-2" />   {new Date(post.created_at).toLocaleDateString()}
                            </p>
                        )}
                    </div>

                    {webnovel && (<WebnovelHoverCard webnovel={webnovel} post={post} isHoverCard={true} showDetailInfo={true} showEngagementStats={false} showSynopsis={false} showActionButtons={false} />)}

                    {post.content && (<p className="text-blackdark:text-white whitespace-pre-wrap mb-2 text-start self-start"> <OtherTranslateComponent content={post.content} elementId={post.id.toString()} elementType="toonyz_post" elementSubtype="content" /></p>)}

                    {/* quote toggle */}
                    {post.quote && (<ToonyzPostQuoteToggle quote={post.quote} postId={post.id.toString()} />)}


                    {post.tags && (
                        <div className="flex flex-row flex-wrap gap-2 items-center justify-start">
                            <span className="text-sm font-bold">Tags: </span>
                            {(typeof post.tags === 'string'
                                ? post.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
                                : Array.isArray(post.tags)
                                    ? post.tags
                                    : []
                            ).map((tag, index) => {
                                const colors = [
                                    'bg-pink-200',
                                    'bg-blue-200',
                                    'bg-green-200',
                                    'bg-purple-200',
                                    'bg-yellow-200',
                                    'bg-orange-200',
                                    'bg-red-200',
                                    'bg-indigo-200',
                                ];
                                const randomColor = colors[Math.floor(Math.random() * colors.length)];

                                return (
                                    <span
                                        key={index}
                                        className={`text-sm font-base text-gray-500 dark:text-gray-500 rounded-lg border border-gray-500 ${randomColor} px-2 py-1`}
                                    >
                                        {tag}
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    {/* card for the webnovel */}
                    {webnovel && (<WebnovelCard webnovel={webnovel} post={post} isHoverCard={false} showDetailInfo={false} />)}

                    <hr className="w-full border-gray-200" />
                    <CommentsComponent contentToAttachTo={post} webnovelOrPost={true} addCommentEnabled={true} />
                </div>
                <div className="h-[10vh]" />
                <div className="relative md:max-w-screen-xl w-full mx-auto px-4 py-8">
                    {/* reusable component for the feed */}
                    {/* {allPosts && (
                        <ToonyzPostGrid
                            key={post.id.toString()}
                            className="w-full"
                            initialPosts={allPosts}
                        />)} */}
                </div>
            </div>
        </div>
    )
}

export default ToonyzPostPage;