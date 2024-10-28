"use client"

import { Chapter, Webnovel } from "@/components/Types"
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useUser } from "@/contexts/UserContext"
import ViewerFooter from "@/components/ViewerFooter";
import WebnovelTranslateComponent from "@/components/WebnovelTranslateComponent";
import { useLanguage } from "@/contexts/LanguageContext";
import OtherTranslateComponent from "@/components/OtherTranslateComponent";
import { Button } from "@mui/material";
import { ChevronLeftIcon, TrashIcon } from "@heroicons/react/24/solid";
import { usePathname, useRouter } from "next/navigation";
import PleaseLoginModal from "@/components/PleaseLoginModal";

function ChapterView({ params: { id }, }: { params: { id: string } }) {
    const [webnovel, setWebnovel] = useState<Webnovel>();
    const [chapter, setChapter] = useState<Chapter>();
    const [upvotes, setUpvotes] = useState(0);
    const [likeToggle, setLikeToggle] = useState(false);
    const { email } = useUser();
    const [key, setKey] = useState(0); // for remounting WebnovelTranslateComponent
    const [key2, setKey2] = useState(0); // for remounting OtherTranslation for webnovel title
    const [deleteModal, setDeleteModal] = useState(false);
    const [isAuthor, setIsAuthor] = useState(false);
    const { language } = useLanguage();
    const router = useRouter();
    const pathname = usePathname();
    const viewed = useRef(false);
    const [showPleaseLogin, setShowPleaseLogin] = useState(false);
    useEffect(() => {
        setKey(prevKey => prevKey + 1)
        setKey2(prevKey => prevKey + 1)
    }, [language])


    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_chapter_byid?id=${id}`)
            .then(response => response.json())
            .then(data => {
                setChapter(data);
                setUpvotes(data.upvotes)
                fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovel_byid?id=${data.webnovel_id}`)
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
        if (likeToggle) {
            setUpvotes(prev => prev - 1); // optimistic update
            setLikeToggle(false);
            const res = await fetch(`/api/upvote_chapter?chapter_id=${id}&user_email=${email}&undo=set`)
            const data = await res.json();
            if (data.status === 200) {
                setUpvotes(data.upvotes);
                setLikeToggle(false);
            } 
            if (data.status === 401) {
                setShowPleaseLogin(true);
                setLikeToggle(true);
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
            if (data.status === 401) {
                setShowPleaseLogin(true);
                setLikeToggle(false);
            }
        }
    }

    const handleDelete = async () => {
        const res = await fetch(`/api/delete_chapter?id=${id}`);
        if (res.ok) {
            router.push(`/view_webnovels?id=${webnovel?.id}`);
        }
    }

    if (webnovel && chapter) {
        return (
            <div>
                <div className='max-w-screen-sm px-4 max-h-dvh flex flex-col items-left mx-auto'>
                    {/* Back to novel and like button */}
                    <div className="flex flex-row max-w-full w-full justify-between">
                        <Button color='gray' variant='text' href={`/view_webnovels?id=${webnovel.id}`}>
                            <div className="flex flex-row space-x-1 items-center">
                                <ChevronLeftIcon className="w-6 h-6" />
                                <OtherTranslateComponent key={key2} content={webnovel.title} elementId={webnovel.id.toString()} elementType='webnovel' elementSubtype="title" />
                            </div>
                        </Button>

                        <div className="flex flex-row items-center">
                            <Link href="#">
                                <div className="text-center">
                                    {
                                        likeToggle ?
                                            <i onClick={handleLikeClick} onTouchStart={handleLikeClick} className="fa-solid fa-heart"></i>
                                            :
                                            <i onClick={handleLikeClick} onTouchStart={handleLikeClick} className="fa-regular fa-heart"></i>
                                    }
                                </div>
                            </Link>
                            <p className='ml-2 w-6'>{upvotes}</p>
                        </div>
                    </div>
                    {/* Title and content */}
                    <div className="flex flex-col space-y-4">
                        <div key={key}>
                            <div className='flex justify-between'>
                                <OtherTranslateComponent content={chapter.title} elementId={id} elementType='chapter' elementSubtype="title" classParams="text-2xl mt-2 mb-2" />
                                {isAuthor && <Button color='gray' variant='text' onClick={handleDelete}>
                                    <TrashIcon className="w-6 h-6" />
                                </Button>
                                }
                            </div>
                            <WebnovelTranslateComponent content={chapter.content} chapterId={id} />
                        </div>
                    </div>
                    <ViewerFooter webnovel={webnovel} chapter={chapter} />
                </div>
                <PleaseLoginModal open={showPleaseLogin} setOpen={setShowPleaseLogin} />
            </div>
        )
    }
    else {
        return <div></div>
    }
}

export default ChapterView;