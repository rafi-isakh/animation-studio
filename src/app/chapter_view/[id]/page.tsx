"use client"

import { Chapter, Webnovel } from "@/components/Types"
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext"
import ViewerFooter from "@/components/ViewerFooter";
import SSEComponent from "@/components/SSEComponent";
import { useLanguage } from "@/contexts/LanguageContext";

function ChapterView({ params: { id }, }: { params: { id: string } }) {
    const [webnovel, setWebnovel] = useState<Webnovel>();
    const [chapter, setChapter] = useState<Chapter>();
    const [upvotes, setUpvotes] = useState(0);
    const [likeToggle, setLikeToggle] = useState(false);
    const { email } = useAuth();

    useEffect(() => {
        fetch(`http://localhost:5000/api/get_chapter_byid?id=${id}`)
            .then(response => response.json())
            .then(data => {
                setChapter(data);
                setUpvotes(data.upvotes)
                fetch(`http://localhost:5000/api/get_webnovel_byid?id=${data.webnovel_id}`)
                    .then(response2 => response2.json())
                    .then(data2 => {
                        setWebnovel(data2)
                    })
            }
            )
    }, []);

    useEffect(() => {
        fetch(`http://localhost:5000/api/increase_views?chapter_id=${id}&user_email=${email}`)
    }, [email])

    const handleLikeClick = async () => {
        if (likeToggle) {
            const res = await fetch(`http://localhost:5000/api/upvote_chapter?chapter_id=${id}&user_email=${email}&undo=set`)
            const data = await res.json();
            setUpvotes(data);
            setLikeToggle(false);
        }
        else {
            const res = await fetch(`http://localhost:5000/api/upvote_chapter?chapter_id=${id}&user_email=${email}`)
            const data = await res.json();
            setUpvotes(data);
            setLikeToggle(true);
        }
    }

    if (webnovel && chapter) {
        return (
            <div>
                <div className='max-w-md max-h-dvh flex flex-col items-left mx-auto pb-40'>
                    {/* Back to novel and like button */}
                    <div className="flex flex-row max-w-full w-full justify-between">
                        <div>
                            <Link href={`/view_webnovels?id=${webnovel.id}`}><i className="fa-solid fa-chevron-left"></i> {webnovel.title}</Link>
                        </div>
                        <div className="flex flex-row items-center">
                            <a href="#">
                                <div className="text-center">
                                    {
                                        likeToggle ?
                                            <i onClick={handleLikeClick} className="fa-solid fa-heart"></i>
                                            :
                                            <i onClick={handleLikeClick} className="fa-regular fa-heart"></i>
                                    }
                                </div>
                            </a>
                            <p className='ml-2 w-6'>{upvotes}</p>
                        </div>
                    </div>
                    {/* Title and content */}
                    <div className="max-w-full flex flex-col space-y-4 pb-24">
                        <p className="text-2xl mt-10 mb-10">{chapter.title}</p>
                        {/*<p className="text-sm" dangerouslySetInnerHTML={{ __html: newlineToBr(chapter.content) }}></p>*/}
                        <SSEComponent content={chapter.content} chapterId={id}/>
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