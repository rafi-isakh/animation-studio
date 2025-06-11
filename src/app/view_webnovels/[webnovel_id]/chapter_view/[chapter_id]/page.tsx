"use client"

import React from "react";
import { useEffect, useRef, useState } from "react";
import { Chapter, Webnovel, Dictionary, Language } from "@/components/Types"
import Link from "next/link";
import { useUser } from "@/contexts/UserContext"
import ViewerFooter from "@/components/ViewerFooter";
import WebnovelTranslateComponent from "@/components/WebnovelTranslateComponent";
import { useLanguage } from "@/contexts/LanguageContext";
import OtherTranslateComponent from "@/components/OtherTranslateComponent";
import { Button } from "@/components/shadcnUI/Button";
import { Menubar, MenubarMenu } from "@/components/shadcnUI/Menubar";
import { ChevronRight, ChevronLeft, Trash2, Heart, Type, Pencil } from 'lucide-react'
import { usePathname, useRouter } from "next/navigation";
import PleaseLoginModal from "@/components/PleaseLoginModal";
import { phrase } from '@/utils/phrases';
import { useReader } from '@/contexts/ReaderContext';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useAuth } from "@/contexts/AuthContext";
import { FloatingMenu } from '@/components/FloatingMenuComponent';
import Image from 'next/image';
import { getImageUrl } from "@/utils/urls";
import ProgressBar from '@/components/UI/ProgressBar';
import { useWebnovels } from "@/contexts/WebnovelsContext";
import ViewerSettingDialog from '@/components/UI/ViewerSettingDialog';
import dynamic from 'next/dynamic';
import { createEmailHash } from '@/utils/cryptography';
import DeleteChapterDialog from "@/components/UI/DeleteChapterDialog";
const LottieLoader = dynamic(() => import('@/components/LottieLoader'), {
    ssr: false,
});
import animationData from '@/assets/N_logo_with_heart.json';
import CommentsComponent from "@/components/CommentsComponent";
import ChapterPurchaseDialog from "@/components/UI/ChapterPurchaseDialog";
import NotEnoughStarsDialog from "@/components/UI/NotEnoughStarsDialog";
import { isPurchasedChapter } from "@/utils/webnovelUtils";
import { useToast } from "@/hooks/use-toast";
import TableOfContents from "@/components/UI/TableOfContents";

function ChapterView({ params: { chapter_id, webnovel_id }, }: { params: { chapter_id: string, webnovel_id: string } }) {
    const [webnovel, setWebnovel] = useState<Webnovel>();
    const [chapter, setChapter] = useState<Chapter>();
    const [upvotes, setUpvotes] = useState(0);
    const [likeToggle, setLikeToggle] = useState(false);
    const { email, email_hash } = useUser();
    const { isLoggedIn } = useAuth();
    const [isAuthor, setIsAuthor] = useState(false);
    const { dictionary, language } = useLanguage();
    const router = useRouter();
    const pathname = usePathname();
    const [showPleaseLogin, setShowPleaseLogin] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteChapterId, setDeleteChapterId] = useState<number | null>(null);
    const { getWebnovelIdWithChapterMetadata } = useWebnovels();
    const {
        fontSize,
        fontFamily = 'default',
        lineHeight,
        margin,
        scrollType,
        page,
        maxPage,
    } = useReader();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [screenWidth, setScreenWidth] = useState('max-w-screen-sm');
    const webnovelViewRef = useRef<HTMLDivElement>(null);
    const { purchased_webnovel_chapters, checking, stars, setInvokeCheckUser } = useUser();
    const [upvotedChapters, setUpvotedChapters] = useState<number[]>([]);
    const { chaptersLikelyNeededWebnovel } = useWebnovels();
    const readerStyle = {
        fontSize: `${fontSize}px`,
        fontFamily: fontFamily === 'default' ? 'sans-serif' :
            fontFamily === 'gowun-batang' ? '"Gowun Batang", serif' :
                fontFamily === 'nanum-gothic' ? '"Nanum Gothic", sans-serif' : 'sans-serif',
        lineHeight: lineHeight,
        padding: `${isMobile ? '10px' : `${margin}px`}`,
        maxWidth: isMobile ? '100%' : '800px',
        margin: isMobile ? `${margin}px` : `${margin}px auto`,
        width: isMobile ? `calc(100% - ${margin * 2}px)` : 'auto',
    };
    const [showIsViewerModal, setShowIsViewerModal] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedTextRef = useRef<string>("");
    const [posts, setPosts] = useState([]);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [chapterToPurchase, setChapterToPurchase] = useState<Chapter>();
    const [showNotEnoughStarsModal, setShowNotEnoughStarsModal] = useState(false);
    const sortedChapters = webnovel?.chapters.sort((a, b) => a.id - b.id);
    const { toast } = useToast();

    useEffect(() => {
        if (webnovel && !JSON.parse(webnovel?.available_languages || '[]').includes(language)) {
            alert(phrase(dictionary, "languageNotAvailable", language));
            router.push(`/view_webnovels/${webnovel?.id}`);
        }
        if (webnovel && !checking && chapter && !chapter.free && !isPurchasedChapter(purchased_webnovel_chapters, Number(chapter_id), language)) {
            router.push(`/view_webnovels/${webnovel?.id}`);
        }
    }, [webnovel, language, checking])

    const handleViewSettings = () => {
        setShowIsViewerModal(true);
    }

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch(`/api/get_upvoted_chapters?email=${email}`);
            const data = await response.json();
            if (data.includes(chapter_id)) {
                setLikeToggle(true);
            }
        }
        if (email) {
            fetchData();
        }
    }, [email])

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    useEffect(() => {
        const fetchChapter = async () => {
            let chapter = chaptersLikelyNeededWebnovel?.chapters.find(chapter => chapter.id == Number(chapter_id));
            if (chapter?.content) {
                setChapter(chapter);
            }
            else {
                const response = await fetch(`/api/get_chapter_by_id?id=${chapter_id}`)
                chapter = await response.json();
                setChapter(chapter);
            }
            // If the chapter is not free and the user has not purchased it, redirect to the webnovel page
            if (!chapter?.free
                && !checking
                && purchased_webnovel_chapters
                && !isPurchasedChapter(purchased_webnovel_chapters, Number(chapter_id), language)) {
                router.push(`/view_webnovels/${chapter?.webnovel_id}`);
            }
            setUpvotes(chapter?.upvotes || 0)
            const webnovel = await getWebnovelIdWithChapterMetadata(chapter?.webnovel_id.toString() || '');
            setWebnovel(webnovel);
        }
        fetchChapter();
    }, [checking]);

    useEffect(() => {
        if (email && webnovel?.user?.email_hash) {
            const userEmailHash = createEmailHash(email);
            if (webnovel.user.email_hash === userEmailHash) {
                setIsAuthor(true);
            }
        }
    }, [email, webnovel])

    useEffect(() => {
        fetch(`/api/increase_views?chapter_id=${chapter_id}`)
    }, [chapter_id])

    const handleLikeClick = async () => {
        if (isLoggedIn) {
            if (likeToggle) {
                setUpvotes(prev => prev - 1); // optimistic update
                setLikeToggle(false);
                const res = await fetch(`/api/upvote_chapter?chapter_id=${chapter_id}&user_email=${email}&undo=set`)
                const data = await res.json();
                if (data.status === 200) {
                    setUpvotes(data.upvotes);
                    setLikeToggle(false);
                }
            }
            else {
                setUpvotes(prev => prev + 1);
                setLikeToggle(true);
                const res = await fetch(`/api/upvote_chapter?chapter_id=${chapter_id}&user_email=${email}`)
                const data = await res.json();
                if (data.status === 200) {
                    setUpvotes(data.upvotes);
                    setLikeToggle(true);
                }
            }
        } else {
            setShowPleaseLogin(true);
        }
    }

    const handleDelete = async (chapterId: number) => {
        const res = await fetch(`/api/delete_chapter?id=${chapter_id}`);
        if (res.ok) {
            router.push(`/view_webnovels/${webnovel?.id}`);
        }
    }

    const handleChapterDelete = async (chapterId: number) => {
        setShowDeleteModal(false);
        handleDelete(chapterId);
    }

    useEffect(() => {
        const _screenWidth = scrollType === 'horizontal' ? 'max-w-screen-lg' : 'max-w-screen-sm';
        setScreenWidth(_screenWidth);
    }, [scrollType])

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await fetch('/api/get_toonyz_posts');
                if (!response.ok) {
                    throw new Error('Failed to fetch posts');
                }

                const data = await response.json();
                const filteredPosts = data.filter((post: any) => post.webnovel_id === webnovel?.id);

                console.log(filteredPosts, "filteredPosts");

                setPosts(filteredPosts);
            } catch (error) {
                console.error('Error fetching posts:', error);
            }
        }
        fetchPosts();
    }, [webnovel?.id]);


    const handleChapterClick = (chapter: Chapter) => {
        if (!webnovel?.available_languages.includes(language)) {
            toast({
                title: phrase(dictionary, "languageNotAvailable", language),
                description: "Please select a different language",
                variant: "destructive",
            });
            return;
        }
        if (chapter.free) {
            router.push(`/view_webnovels/${webnovel?.id}/chapter_view/${chapter.id}`);
        } else {
            if (isPurchasedChapter(purchased_webnovel_chapters, chapter.id, language)) {
                router.push(`/view_webnovels/${webnovel?.id}/chapter_view/${chapter.id}`);
                return;
            }
            setChapterToPurchase(chapter);
            setShowPurchaseModal(true);
        }
    }

    const handleChapterPurchase = async (chapter: Chapter) => {
        if (!chapter) return;
        if (!isLoggedIn) {
            router.push("/signin");
        }
        else {
            setShowPurchaseModal(false);
            const price = language === "ko" ? webnovel?.price_korean : webnovel?.price_english;
            if (stars < price!) {
                setShowNotEnoughStarsModal(true);
                return;
            }
            const response = await fetch(`/api/purchase_chapter`, {
                method: 'POST',
                body: JSON.stringify({
                    chapter_id: chapter.id,
                    price: price,
                    language: language
                })
            });
            // TODO: tell user if there's not enough stars
            if (!response.ok) {
                console.error('Failed to purchase chapter');
                alert("Failed to purchase chapter");
            } else {
                const data = await response.json();
                if (data.success) {
                    setInvokeCheckUser(prev => !prev);
                    router.push(`/view_webnovels/${webnovel?.id}/chapter_view/${chapter.id}`);
                } else {
                    alert(data.message);
                }
            }
        }
    }

    const handleEditChapter = () => {
        router.push(`/edit_chapter?id=${chapter_id}&novelLanguage=${webnovel?.language}`);
    }

    const ExtraInfoContainer = ({ webnovel, chapter, dictionary, language }:
        { webnovel: Webnovel, chapter: Chapter, dictionary: Dictionary, language: Language }) => {
        const currentIndex = webnovel.chapters.findIndex(ch => ch.id === chapter.id);
        const nextChapter = currentIndex > -1 && currentIndex < webnovel.chapters_length - 1
            ? webnovel.chapters[currentIndex + 1]
            : null;

        if (!nextChapter) {
            return null;
        }

        return (
            <div className={`${screenWidth} mx-auto w-full pb-5`}>
                <Button
                    variant="link"
                    onClick={() => {
                        if (!nextChapter.free && !isPurchasedChapter(purchased_webnovel_chapters, nextChapter.id, language)) {
                            setChapterToPurchase(nextChapter);
                            setShowPurchaseModal(true);
                        } else {
                            handleChapterClick(nextChapter);
                        }
                    }}
                    className={`w-full !no-underline ${!nextChapter.free && !isPurchasedChapter(purchased_webnovel_chapters, nextChapter.id, language) ? "opacity-50" : ""}`}>
                    <div className="flex flex-row justify-between items-center rounded-lg bg-gray-100 dark:bg-gray-900 p-3 w-full">
                        <div className="flex flex-row items-center space-x-4">
                            <Image
                                src={getImageUrl(webnovel.cover_art)}
                                alt={webnovel.title}
                                width={50} height={50}
                                className="rounded-lg"
                            />
                            <div className="flex flex-col justify-start items-start">
                                <span>{phrase(dictionary, "nextChapterView", language)}</span>
                                <div className="text-sm text-gray-500 dark:text-gray-400 font-bold flex flex-row items-center justify-start">

                                    {!nextChapter.free && !isPurchasedChapter(purchased_webnovel_chapters, nextChapter.id, language) && (
                                        <span className="mr-2">🔒</span>
                                    )}
                                    {language == 'en' && <>Episode{' '}</>}
                                    {webnovel.chapters.findIndex(ch => ch.id === nextChapter.id) !== undefined ? webnovel.chapters.findIndex(ch => ch.id === nextChapter.id) + 1 : ''}
                                    {language == 'ko' && <>{' '}화</>}
                                </div>
                            </div>
                        </div>
                        <ChevronRight size={18} className="" />
                    </div>
                </Button>
            </div>
        );
    };

    if (webnovel && chapter) {
        return (
            <div className="">
                <ProgressBar page={page} maxPage={maxPage} scrollType={scrollType} />
                {/* Top bar: */}
                <header
                    className="w-full fixed top-0 left-0 right-0 z-[99] py-2 transition-all duration-300 ease-in-out
                    bg-white/10 dark:bg-black/10 backdrop-blur-sm"
                >
                    <div className={`md:max-w-screen-md w-full mx-auto flex flex-row items-center justify-between select-none`}>
                        <Button  variant='ghost' onClick={() => router.push(`/view_webnovels/${webnovel.id}`)}>
                            <div className="flex flex-row space-x-1 items-center">
                                <ChevronLeft size={18} />
                                {webnovel.other_translations?.find(
                                    translation =>
                                        translation.language === language &&
                                        translation.element_type === 'webnovel' &&
                                        translation.element_subtype === 'title' &&
                                        translation.webnovel_id === webnovel.id.toString()
                                )?.text ||
                                    <OtherTranslateComponent
                                        element={webnovel}
                                        content={webnovel.title}
                                        elementId={webnovel.id.toString()}
                                        elementType='webnovel'
                                        elementSubtype="title"
                                    />
                                }
                            </div>
                        </Button>

                        <Menubar className="flex flex-row gap-3 items-center list-none bg-transparent border-none shadow-none">
                            <TableOfContents
                                sortedChapters={sortedChapters || []}
                                purchased_webnovel_chapters={(purchased_webnovel_chapters || [])
                                    .filter((purchase) => purchase[1] === language)
                                    .map((purchase) => purchase[0])
                                }
                                language={language}
                                chapter_id={chapter_id}
                                setChapterToPurchase={setChapterToPurchase}
                                setShowPurchaseModal={setShowPurchaseModal}
                                webnovel={webnovel}
                                isPurchasedChapter={(purchasedChapters, chapterId) =>
                                    purchasedChapters.includes(chapterId)
                                }
                                phrase={phrase as (dictionary: Dictionary, key: string, language: string) => string}
                                dictionary={dictionary as Dictionary}
                            />
                            {/* viewer settings */}
                            <MenubarMenu>
                                <Button
                                    variant="ghost"
                                    className="rounded-sm"
                                    size="icon"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleViewSettings();
                                    }}>
                                    <Type className="h-5 w-5" />
                                </Button>
                            </MenubarMenu>
                            {/* like button */}
                            <MenubarMenu>
                                <div className="text-center flex flex-row items-center md:pr-0 pr-[15px]">
                                    {likeToggle ? (
                                        <Link href='#' className='p-0'
                                            onClick={(e) => { e.preventDefault(); handleLikeClick() }} onTouchStart={handleLikeClick}>
                                            {/* heart icon */}
                                            <svg width="1.25rem" height="1.25rem" viewBox="0 0 10 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M8.48546 5.591C9.18401 4.9092 9.98235 4.03259 9.98235 2.96119C10.0521 2.36601 9.91388 1.76527 9.5901 1.25634C9.26632 0.747404 8.77594 0.360097 8.19844 0.157182C7.62094 -0.0457339 6.99015 -0.0523672 6.40831 0.138357C5.82646 0.32908 5.32765 0.705985 4.99271 1.20799C4.63648 0.744933 4.13753 0.405536 3.56912 0.239623C3.0007 0.0737095 2.39277 0.0900199 1.83455 0.286159C1.27634 0.482299 0.797245 0.847936 0.467611 1.32939C0.137977 1.81085 -0.0248358 2.38277 0.00307225 2.96119C0.00307225 4.12999 0.801414 4.9092 1.49996 5.6884L4.99271 9L8.48546 5.591Z" fill="#6B7280" />
                                            </svg>
                                        </Link>
                                    ) : (
                                        <Link href='#' className='p-0'
                                            onClick={(e) => { e.preventDefault(); handleLikeClick() }} onTouchStart={handleLikeClick}>
                                            <Heart strokeWidth={1.5} className="h-5 w-5" />
                                        </Link>
                                    )
                                    }
                                    <p className='ml-1 self-center text-sm'>{upvotes}</p>
                                </div>
                            </MenubarMenu>
                            {/* Delete chapter button */}
                            {isAuthor && (
                                <>
                                <MenubarMenu>
                                    <Button color='gray' variant='ghost' onClick={(e) => {
                                        e.stopPropagation();
                                        setShowDeleteModal(true);
                                        setDeleteChapterId(chapter.id);
                                        //    handleChapterDelete(Number(id))
                                    }}>
                                        <Trash2 className="h-5 w-5 text-gray-500" />
                                        <span className="text-sm self-center">
                                            {phrase(dictionary, "delete", language)}
                                        </span>
                                    </Button>
                                </MenubarMenu>
                                <MenubarMenu>
                                    <Button color='gray' variant='ghost' onClick={handleEditChapter}>
                                        <Pencil className="h-5 w-5 text-gray-500" />
                                        <span className="text-sm self-center">
                                            {phrase(dictionary, "edit", language)}
                                        </span>
                                    </Button>
                                </MenubarMenu>
                                </>
                            )
                            }
                        </Menubar>
                    </div>
                    {/* view settings modal */}
                    <ViewerSettingDialog showIsViewerModal={showIsViewerModal} setShowIsViewerModal={setShowIsViewerModal} />
                </header>

                <div className="relative" style={{ ...readerStyle, fontSize: `${fontSize}px`, lineHeight: `${lineHeight}` }} >
                    <div className={`${screenWidth} h-full flex flex-col items-left mx-auto z-10 pt-[60px]`}>
                        {/* Title and content */}
                        <div className='flex flex-col space-y-4' >
                            <div id='translate-div'>
                                <div ref={webnovelViewRef} id="translated" className={`${scrollType == 'horizontal' ? 'h-fit' : ""}`}>
                                    <FloatingMenu selectedTextRef={selectedTextRef} webnovel={webnovel} chapter={chapter} webnovel_id={webnovel.id.toString()} chapter_id={chapter_id}>
                                        <WebnovelTranslateComponent availableLanguages={JSON.parse(webnovel.available_languages)} content={chapter.content} chapterId={chapter_id} webnovelId={webnovel.id.toString()} sourceLanguage={webnovel.language} />
                                    </FloatingMenu>
                                </div>
                            </div>
                        </div>
                        {/* Viewer footer */}
                        <div className="relative" ref={containerRef}>
                            <ViewerFooter webnovel={webnovel} chapter={chapter} selectedTextRef={selectedTextRef} page={page} maxPage={maxPage} posts={posts} />
                        </div>
                    </div>
                    <PleaseLoginModal open={showPleaseLogin} setOpen={setShowPleaseLogin} />
                    {/* delete confirmation modal */}
                    <DeleteChapterDialog language={language} dictionary={dictionary} showDeleteModal={showDeleteModal} setShowDeleteModal={setShowDeleteModal} deleteChapterId={deleteChapterId} handleChapterDelete={handleChapterDelete} />
                </div>
                <ExtraInfoContainer webnovel={webnovel} chapter={chapter} dictionary={dictionary} language={language} />
                {/* hr divider */}
                <div className='flex flex-col items-center justify-center w-full mb-4'>
                    <hr className='w-screen border-t border-gray-300 my-4' />
                    <div className='bg-white dark:bg-black px-4 absolute'>
                        <Image
                            src="/images/N_logo.svg"
                            alt="logo"
                            width={20}
                            height={20}
                            quality={100}
                            className="w-[20px] h-[20px] self-center md:mt-0 mt-1"
                        />
                    </div>
                </div>
                <CommentsComponent contentToAttachTo={chapter} webnovelOrPost={false} addCommentEnabled={true} />
                <div className="md:h-[10vh] h-[10vh]"></div>
                <ChapterPurchaseDialog showPurchaseModal={showPurchaseModal} setShowPurchaseModal={setShowPurchaseModal} handleChapterPurchase={handleChapterPurchase} content={webnovel} stars={stars} chapter={chapterToPurchase!} />
                <NotEnoughStarsDialog showNotEnoughStarsModal={showNotEnoughStarsModal} setShowNotEnoughStarsModal={setShowNotEnoughStarsModal} stars={stars} content={webnovel} />
            </div>
        )
    }
    else {
        return (
            <div className="loader-container">
                <LottieLoader width="w-40" animationData={animationData} />
            </div>
        )
    }
}

export default ChapterView;