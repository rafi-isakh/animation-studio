"use client"
import { useEffect, useRef } from "react";
import WebtoonImageComponent from "@/components/WebtoonImageComponent";
import { WebtoonImage } from "@/components/Types";
import { useUser } from "@/contexts/UserContext";
import { Webtoon, WebtoonChapter } from "@/components/Types";

const ViewWebtoonChapterComponent = ({ images, episodeNumber, webtoon }: { images: WebtoonImage[], episodeNumber: string, webtoon: Webtoon }) => {
    const viewed = useRef(false);
    const { email } = useUser();

    useEffect(() => {
        const index = webtoon.chapters.find((ch: WebtoonChapter) => ch.directory === episodeNumber)?.id;
        if (!viewed.current) {
            if (email) {
                fetch(`/api/increase_views?chapter_id=${index}&is_webtoon=true&user_email=${email}`)
                viewed.current = true;
            } else {
                fetch(`/api/increase_views_not_logged_in?chapter_id=${index}&is_webtoon=true`)
                viewed.current = true;
            }
        }
    }, [email])

    return (
        <div className="flex flex-col justify-center items-center mx-auto w-[720px]">
            {images.map((image, index) =>
                <div key={`webtoon-${index}`}>
                    <WebtoonImageComponent image={image.url} width={image.width!} height={image.height!} />
                </div>
            )
            }
        </div>
    )
}

export default ViewWebtoonChapterComponent;