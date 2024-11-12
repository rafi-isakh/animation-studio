"use client"

import { Chapter, Webnovel } from "@/components/Types"
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useUser } from "@/contexts/UserContext"
import ViewerFooter from "@/components/ViewerFooter";
import WebnovelTranslateComponent from "@/components/WebnovelTranslateComponent";
import { useLanguage } from "@/contexts/LanguageContext";
import OtherTranslateComponent from "@/components/OtherTranslateComponent";
import { Button, Modal, Box } from "@mui/material";
import { style } from '@/styles/ModalStyles';
import { ChevronLeftIcon, TrashIcon } from "@heroicons/react/24/solid";
import { usePathname, useRouter } from "next/navigation";
import PleaseLoginModal from "@/components/PleaseLoginModal";
import { phrase } from '@/utils/phrases';
import { useReader } from '@/contexts/ReaderContext';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useAuth } from "@/contexts/AuthContext";
import ThemeWrapper from '@/components/ThemeWrapper';

function ChapterView({ params: { id }, }: { params: { id: string } }) {
    const [webnovel, setWebnovel] = useState<Webnovel>();
    const [chapter, setChapter] = useState<Chapter>();
    const [upvotes, setUpvotes] = useState(0);
    const [likeToggle, setLikeToggle] = useState(false);
    const { email } = useUser();
    const { isLoggedIn } = useAuth();
    const [key, setKey] = useState(0); // for remounting WebnovelTranslateComponent
    const [key2, setKey2] = useState(0); // for remounting OtherTranslation for webnovel title
    const [deleteModal, setDeleteModal] = useState(false);
    const [isAuthor, setIsAuthor] = useState(false);
    const { dictionary, language } = useLanguage();
    const router = useRouter();
    const pathname = usePathname();
    const viewed = useRef(false);
    const [showPleaseLogin, setShowPleaseLogin] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteChapterId, setDeleteChapterId] = useState<number | null>(null);
    const { fontSize,
        setFontSize,
        fontFamily = 'default',
        setFontFamily,
        textColor,
        setTextColor,
        lineHeight,
        setLineHeight,
        backgroundColor,
        setBackgroundColor,
        margin,
        padding,
        scrollType } = useReader();

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [screenWidth, setScreenWidth] = useState('max-w-screen-sm');

    useEffect(() => {
        if (chapter?.content) {
            for (let i = 0; i < chapter?.content?.length; i++) {
                // make hidden div and put character in hidden div one by one until it exceeds
            }
        }
    }, [fontSize, fontFamily, lineHeight, margin, chapter])

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
        // backgroundColor: `${backgroundColor}`
    };

    // Define theme colors mapping
    const themeColors = {
        white: 'bg-white text-black',
        black: 'bg-black text-white',
        '#F5E6D3': 'bg-[#F5E6D3] text-[#5B4636]', // sepia
        'gray-200': 'bg-gray-200 text-gray-800'    // gray
    };


    useEffect(() => {
        setKey(prevKey => prevKey + 1)
        setKey2(prevKey => prevKey + 1)
    }, [language])


    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch(`/api/get_upvoted_chapters?email=${email}`);
            const data = await response.json();
            console.log(data);
            if (data.includes(id)) {
                setLikeToggle(true);
            }
        }
        if (email) {
            fetchData();
        }
    }, [email])

    useEffect(() => {
        fetch(`/api/get_chapter_by_id?id=${id}`)
            .then(response => response.json())
            .then(data => {
                setChapter(data);
                setUpvotes(data.upvotes)
                fetch(`/api/get_webnovel_by_id?id=${data.webnovel_id}`)
                    .then(response2 => response2.json())
                    .then(data2 => {
                        setWebnovel(data2)
                    })
            }
            )
    }, []);

    useEffect(() => {
        if (email) {
            if (webnovel?.user.email === email) {
                setIsAuthor(true);
            }
        }
    }, [email, webnovel])

    useEffect(() => {
        if (!viewed.current) {
            if (email) {
                fetch(`/api/increase_views?chapter_id=${id}&user_email=${email}`)
                viewed.current = true;
            } else {
                fetch(`/api/increase_views_not_logged_in?chapter_id=${id}`)
                viewed.current = true;
            }
        }
    }, [email])

    const handleLikeClick = async () => {
        if (isLoggedIn) {
            if (likeToggle) {
                setUpvotes(prev => prev - 1); // optimistic update
                setLikeToggle(false);
                const res = await fetch(`/api/upvote_chapter?chapter_id=${id}&user_email=${email}&undo=set`)
                const data = await res.json();
                if (data.status === 200) {
                    setUpvotes(data.upvotes);
                    setLikeToggle(false);
                }
            }
            else {
                setUpvotes(prev => prev + 1);
                setLikeToggle(true);
                const res = await fetch(`/api/upvote_chapter?chapter_id=${id}&user_email=${email}`)
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
        const res = await fetch(`/api/delete_chapter?id=${id}`);
        if (res.ok) {
            router.push(`/view_webnovels?id=${webnovel?.id}`);
        }
    }

    const handleChapterDelete = async (chapterId: number) => {
        setShowDeleteModal(false);
        handleDelete(chapterId);
    }

    useEffect(() => {
        const _screenWidth = scrollType === 'horizontal' ? 'max-w-screen-xl' : 'max-w-screen-sm';
        setScreenWidth(_screenWidth);
    }, [scrollType])

    if (webnovel && chapter) {
        return (
            <ThemeWrapper>
                <div
                    className={` text-gray-900 dark:text-white`}
                    style={{
                        ...readerStyle,
                    }}
                >
                    <div className={`${screenWidth} px-4 h-full flex flex-col items-left mx-auto `}>
                        {/* Back to novel and like button */}
                        <div className="flex flex-row max-w-full w-full justify-between">
                            <Button color='gray' variant='text' href={`/view_webnovels?id=${webnovel.id}`}>
                                <div className="flex flex-row space-x-1 items-center">
                                    <ChevronLeftIcon className="w-6 h-6" />
                                    <OtherTranslateComponent key={key2} content={webnovel.title} elementId={webnovel.id.toString()} elementType='webnovel' elementSubtype="title" />
                                </div>
                            </Button>

                            <div className="flex flex-row items-center">
                                <Link
                                    href=''
                                    className="text-center flex flex-row items-center "
                                >
                                    {
                                        likeToggle ?
                                            <i onClick={handleLikeClick} onTouchStart={handleLikeClick} className="fa-solid fa-heart self-center" style={{ fontSize: '16px' }}></i>
                                            :
                                            <i onClick={handleLikeClick} onTouchStart={handleLikeClick} className="fa-regular fa-heart self-center" style={{ fontSize: '16px' }}></i>
                                    }
                                    <p className='ml-2 w-6 self-center' style={{ fontSize: '16px' }}>{upvotes}</p>
                                </Link>
                                {isAuthor && <Button
                                    color='gray'
                                    variant='text'
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowDeleteModal(true);
                                        setDeleteChapterId(chapter.id);
                                        //    handleChapterDelete(Number(id))
                                    }}>
                                    <i className="fas fa-ellipsis-v self-center mr-3 text-gray-400"></i> <span className="text-sm self-center">
                                        {/* Delete */}
                                        {phrase(dictionary, "delete", language)}
                                    </span>
                                </Button>
                                }

                            </div>
                        </div>
                        {/* Title and content */}
                        <div className='flex flex-col space-y-4' >
                            <div key={key}>
                                <div className='flex justify-between'>
                                    <OtherTranslateComponent content={chapter.title} elementId={id} elementType='chapter' elementSubtype="title" classParams="text-2xl mt-2 mb-2" />
                                </div>
                                <WebnovelTranslateComponent content={chapter.content} chapterId={id} />
                            </div>
                        </div>
                        {/* Title and content : end */}
                        <ViewerFooter webnovel={webnovel} chapter={chapter} />
                    </div>
                    <PleaseLoginModal open={showPleaseLogin} setOpen={setShowPleaseLogin} />
                    {/* delete confirmation modal */}
                    <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
                        <Box sx={style}>
                            <div className='flex flex-col space-y-4 items-center justify-cente'>
                                <p className='text-lg font-bold text-black dark:text-black'>{phrase(dictionary, "deleteChapterConfirm", language)}</p>
                                <Button color='gray' variant='outlined' className='mt-10 w-32 text-black dark:text-black' onClick={() => handleChapterDelete(deleteChapterId as number)}>{phrase(dictionary, "yes", language)}</Button>
                                <Button color='gray' variant='outlined' className='mt-10 w-32 text-black dark:text-black' onClick={() => setShowDeleteModal(false)}>{phrase(dictionary, "no", language)}</Button>
                            </div>
                        </Box>
                    </Modal>
                    {/* delete confirmation modal */}
                </div>
            </ThemeWrapper>
        )
    }
    else {
        return <div></div>
    }
}

export default ChapterView;