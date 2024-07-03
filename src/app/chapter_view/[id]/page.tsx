"use client"

import { Chapter, Webnovel } from "@/components/Types"
import Link from "next/link";
import { useEffect, useState } from "react";

function ChapterView({ params: { id }, }: { params: { id: string } }) {
    const [webnovel, setWebnovel] = useState<Webnovel>();
    const [chapter, setChapter] = useState<Chapter>();
    useEffect(() => {
        fetch(`http://localhost:5000/api/get_chapter_byid?id=${id}`)
            .then(response => response.json())
            .then(data => {
                setChapter(data);
                console.log(data);
                fetch(`http://localhost:5000/api/get_webnovel_byid?id=${data.webnovel_id}`)
                    .then(response2 => response2.json())
                    .then(data2 => {
                        setWebnovel(data2)
                    })
            }
            )
    }, []);

    const handleLikeClick = () => {

    }

    if (webnovel && chapter) {
        return (
            <div className='max-w-md flex flex-col items-left justify-center mx-auto'>
                {/* Back to novel and like button */}
                <div className="flex flex-row max-w-full w-full justify-between">
                    <div>
                    <i className="fa-solid fa-chevron-left"></i>
                    <Link className='ml-2' href={`/my_webnovels?id=${id}`}>{webnovel.title}</Link>
                    </div>
                    <div>
                    <i onClick={handleLikeClick} className="fa-regular fa-heart"></i>
                    </div>
                </div>
                {/* Title and content */}
                <div className="max-w-full flex flex-col space-y-4">
                    <p className="text-2xl mt-10 mb-10">{chapter.title}</p>
                    <p className="text-sm">{chapter.content}</p>
                </div>
                {/* Novel title, chapter number, button to next chapter */}
                <div>
                </div>
                {/* list, my library, comments, font */}
                <div>
                </div>
            </div>
        )
    }
    else {
        return <div></div>
    }
}

export default ChapterView;