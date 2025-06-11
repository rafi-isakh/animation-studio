"use client"
import { User, ToonyzPost, Webnovel, Chapter } from "@/components/Types";
import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { getImageUrl, getVideoUrl } from "@/utils/urls";
import { Dialog } from "@/components/shadcnUI/Dialog";
import { MoveLeft, Heart, MessageCircle, Share2, Send, } from "lucide-react";
import { useWebnovels } from '@/contexts/WebnovelsContext';
import CommentsComponent from "@/components/CommentsComponent";
import OtherTranslateComponent from "@/components/OtherTranslateComponent";
import WatermarkedImage from "@/utils/watermark";
import ToonyzPostDropdownButton from "@/components/UI/ToonyzPostDropdownButton";
import { WebnovelHoverCard, WebnovelCard } from "@/components/UI/WebnovelHoverCard";
import ToonyzPostQuoteToggle from "@/components/UI/ToonyzPostQuoteToggle";
import { useUser } from '@/contexts/UserContext';
import UserInfoCard from "@/components/UI/UserInfoCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shadcnUI/Avatar"
import { Button } from "@/components/shadcnUI/Button"
import { Card, CardContent } from "@/components/shadcnUI/Card"
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { useMediaQuery } from "@mui/material";
import dynamic from 'next/dynamic';
import ShareDialog from "@/components/UI/ShareDialog";

const LottieLoader = dynamic(() => import('@/components/LottieLoader'), {
    ssr: false,
});
import animationData from '@/assets/N_logo_with_heart.json';

const ToonyzPostPage = ({ params }: { params: { id: string } }) => {
    const [post, setPost] = useState<ToonyzPost | undefined>(undefined);
    const [allPosts, setAllPosts] = useState<ToonyzPost[] | undefined>(undefined);
    const [lastPostId, setLastPostId] = useState<string | null>(null);
    const { getWebnovelIdWithChapterMetadata } = useWebnovels();
    const [webnovel, setWebnovel] = useState<Webnovel | undefined>(undefined);
    const { email: currentUserEmail } = useUser();
    const { dictionary, language } = useLanguage();
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [chapterTitle, setChapterTitle] = useState<string | undefined>(undefined);
    const [imageDimensions, setImageDimensions] = useState<{ width: number, height: number }>();
    const [showShareDialog, setShowShareDialog] = useState<boolean>(false);
    useEffect(() => {
        const fetchPost = async () => {
            fetch(`/api/get_toonyz_post_by_id?id=${params.id}`)
                .then(res => res.json())
                .then(data => {
                    setPost(data);
                    setIsLoading(false);
                });
        };
        fetchPost();
    }, [params.id]);

    useEffect(() => {
        const fetchWebnovel = async () => {
            if (post?.webnovel_id) {
                const novel = await getWebnovelIdWithChapterMetadata(post.webnovel_id);
                setWebnovel(novel);
                const chapter = novel?.chapters.find((chapter: Chapter) => chapter.id.toString() === post.chapter_id.toString());
                setChapterTitle(chapter?.title);
            }
        };
        const fetchImageDimensions = async () => {
            if (post?.image) {
                const { width, height } = await fetch(`/api/get_image_dimensions?imageUrl=${getImageUrl(post.image)}`).then(res => res.json());
                console.log('width, height', width, height);
                setImageDimensions({ width: width ?? 1280, height: height ?? 1280 });
            }
        }
        if (post) {
            fetchWebnovel();
            fetchImageDimensions();
        }
    }, [post]);

    if (isLoading) {
        return (<div className="loader-container"> <LottieLoader width="w-40" animationData={animationData} /></div>)
    }

    if (!post) {
        return <div className="flex items-center justify-center min-h-screen">Post not found</div>;
    }

    const isAuthor = currentUserEmail === post.user.email_hash;

    return (
        <Card className="w-full h-full flex flex-col max-w-md mx-auto border-0 shadow-none">
            {/* Header */}
            <div className="w-full flex flex-row items-center justify-between gap-2 md:max-w-screen-xl mx-auto">
                <Link href="/feed" className="self-start my-5 flex flex-row items-center gap-2">
                    <MoveLeft size={20} className='dark:text-white text-gray-500' />
                    <p className="text-sm  font-bold font-base">{phrase(dictionary, "back", language)}</p>
                </Link>
            </div>

            <div className="flex flex-row items-center justify-between py-3 md:px-3 px-3">
                <div className="flex items-center gap-3">
                    <UserInfoCard post={post} />
                    <div className="flex flex-col">
                        {post.user.nickname && (
                            <span className="text-sm font-extrabold flex flex-row items-center dark:text-white text-gray-500">
                                {post.user.nickname}
                            </span>
                        )}
                        {post.created_at && (
                            <span className="text-sm flex flex-row items-center dark:text-white text-gray-500">
                                {new Date(post.created_at).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>
                <ToonyzPostDropdownButton
                    email={currentUserEmail}
                    isAuthor={isAuthor ?? false}
                    user={post.user}
                    postId={post.id.toString()}
                    post={post}
                />
            </div>

            {/* Image/Video Container  */}
            <CardContent className="p-0">
                <div className="w-full h-full bg-muted">
                    {post.image ? (
                        <div className="group h-full w-full">
                            <WatermarkedImage
                                imageUrl={getImageUrl(post.image)}
                                watermarkUrl="/toonyz_logo_white.svg"
                                webnovelTitle={webnovel?.title}
                                chapterTitle={chapterTitle}
                                width={imageDimensions?.width}
                                height={imageDimensions?.height}
                                watermarkOpacity={0.2}
                                watermarkPosition="bottomRight"
                                titlePosition="top"
                                titleColor="white"
                                className="object-cover overflow-hidden transition-all duration-300"
                            />
                        </div>
                    ) : (
                        <div className="group w-full h-full">
                            <video
                                src={getVideoUrl(post.video)}
                                muted
                                loop
                                autoPlay
                                playsInline
                                className="object-cover overflow-hidden transition-transform duration-200 "
                            />
                        </div>
                    )}
                </div>
            </CardContent>


            {/* Actions */}
            <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                    // onClick={() => setIsLiked(!isLiked)}
                    >
                        <Heart className={`h-6 w-6 
                            
                            `} />
                    </Button>
                    <Button variant="link" size="sm" className="h-8 w-8 p-0 !no-underline">
                        <MessageCircle size={16} className="mr-2" />
                        <span>{post.comments.length}</span>
                    </Button>
                    <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Link
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowShareDialog(true);
                                }}
                                className="text-sm font-base flex flex-row items-center gap-2 dark:text-white text-gray-500 ">

                                <Send className="h-6 w-6" />
                            </Link>
                        </Button>
                        <ShareDialog
                            shareImage={post.image || post.video}
                            mediaType={post.image ? 'image' : post.video ? 'video' : undefined}
                            url={`${process.env.NEXT_PUBLIC_HOST}/toonyz_posts/${post.id.toString()}`}
                            description={`Share this post with your friends and family.`}
                            webnovelTitle={webnovel?.title}
                            chapterTitle={chapterTitle}
                        />
                    </Dialog>
                </div>
            </div>

            <hr className="w-full border-gray-200" />

            {/* Caption */}
            <div className="px-3 py-3">
                <div className="text-sm font-bold py-3">
                    <OtherTranslateComponent element={post} content={post.title} elementId={post.id.toString()} elementType="toonyz_post" elementSubtype="title" />
                </div>

                <div className="text-sm ">
                    {/* <span className="font-semibold mr-2"></span> */}
                    {post.content && (<span className="text-black dark:text-white whitespace-pre-wrap py-3 text-start self-start"> <OtherTranslateComponent element={post} content={post.content} elementId={post.id.toString()} elementType="toonyz_post" elementSubtype="content" /></span>)}
                    {post.quote && (<ToonyzPostQuoteToggle quote={post.quote} postId={post.id.toString()} />)}
                </div>
            </div>

            <div className="flex flex-row items-center justify-center gap-2">
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
                            ];
                            const randomColor = colors[Math.floor(Math.random() * colors.length)];

                            return (
                                <span
                                    key={index}
                                    className={`text-sm font-base text-gray-500 dark:text-gray-500 rounded-lg border-none ${randomColor} px-2 py-1`}
                                >
                                    {tag}
                                </span>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="px-3 py-3">
                {webnovel && (<WebnovelCard webnovel={webnovel} post={post} isHoverCard={false} showDetailInfo={false} />)}
            </div>

            {/* Add comment */}
            <div className="px-3 py-3">
                <div className="flex items-center gap-3">
                    <CommentsComponent contentToAttachTo={post} webnovelOrPost={true} addCommentEnabled={true} />
                </div>
            </div>

        </Card>
    )
}

export default ToonyzPostPage;


{/*



</div> */}