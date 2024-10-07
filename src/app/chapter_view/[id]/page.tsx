"use client"

import { Chapter, Webnovel } from "@/components/Types"
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useUser } from "@/contexts/UserContext"
import ViewerFooter from "@/components/ViewerFooter";
import WebnovelTranslateComponent from "@/components/WebnovelTranslateComponent";
import { useLanguage } from "@/contexts/LanguageContext";
import OtherTranslateComponent from "@/components/OtherTranslateComponent";

function ChapterView({ params: { id }, }: { params: { id: string } }) {
    const [webnovel, setWebnovel] = useState<Webnovel>();
    const [chapter, setChapter] = useState<Chapter>();
    const [upvotes, setUpvotes] = useState(0);
    const [likeToggle, setLikeToggle] = useState(false);
    const { email } = useUser();
    const [key, setKey] = useState(0); // for remounting WebnovelTranslateComponent
    const [key2, setKey2] = useState(0); // for remounting OtherTranslation for webnovel title

    const { language } = useLanguage();

    useEffect(() => {
        setKey(prevKey => prevKey + 1)
        setKey2(prevKey => prevKey + 1)
    }, [language])

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
            fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/increase_views?chapter_id=${id}&user_email=${email}`)
        }
    }, [email])

    const handleLikeClick = async () => {
        if (likeToggle) {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/upvote_chapter?chapter_id=${id}&user_email=${email}&undo=set`)
            const data = await res.json();
            setUpvotes(data);
            setLikeToggle(false);
        }
        else {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/upvote_chapter?chapter_id=${id}&user_email=${email}`)
            const data = await res.json();
            setUpvotes(data);
            setLikeToggle(true);
        }
    }

    if (webnovel && chapter) {
        return (
            <div>
                <div className='max-w-screen-sm max-h-dvh flex flex-col items-left mx-auto pb-40'>
                    {/* Back to novel and like button */}
                    <div className="flex flex-row max-w-full w-full justify-between">
                        <div>
                            <Link href={`/view_webnovels?id=${webnovel.id}`}><i className="fa-solid fa-chevron-left"></i>
                                <OtherTranslateComponent key={key2} content={webnovel.title} elementId={webnovel.id.toString()} elementType='webnovel' elementSubtype="title" /></Link>
                        </div>
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
                    <div className="max-w-full flex flex-col space-y-4 pb-24">
                        <div key={key}>
                            <OtherTranslateComponent content={chapter.title} elementId={id} elementType='chapter' elementSubtype="title" classParams="text-2xl mt-10 mb-10" />
                            <WebnovelTranslateComponent content={chapter.content} chapterId={id} />
                        </div>
                    </div>
                    {/* Novel title, chapter number, button to next chapter */}
                    <div>
                    </div>
                    {/* list, my library, comments, font */}
                    <div>
                    </div>
                </div>
                <ViewerFooter webnovel={webnovel} chapter={chapter} />
            </div>
        )
    }
    else {
        return <div></div>
    }
}

export default ChapterView;