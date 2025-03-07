import Link from "next/link";
import Image from "next/image";
import {
    HoverCard,
    HoverCardTrigger,
    HoverCardContent
} from "@/components/shadcnUI/HoverCard";
import { Button } from "@/components/shadcnUI/Button";
// Import your utility function
import { getImageUrl } from "@/utils/urls";
import { Webnovel, ToonyzPost } from "@/components/Types";

const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
};

export function WebnovelHoverCard({ webnovel, post }: { webnovel: Webnovel, post: ToonyzPost }) {
    return (
        <HoverCard>
            <div className="flex flex-row gap-2">
                <HoverCardTrigger asChild>
                    <Button variant="ghost">
                        <p className="text-sm text-gray-500">Novel: {webnovel.title} &#62;</p>
                        {post.chapter_id && (
                            <p className="text-sm text-gray-500">
                                Chapter {webnovel.chapters.find(chapter => chapter.id.toString() === post.chapter_id)?.title || post.chapter_id}
                            </p>
                        )}
                    </Button>
                </HoverCardTrigger>
            </div>
            <HoverCardContent className="w-80">
                <div className="flex justify-between space-x-4">
                    <Link href={`/view_webnovels?id=${webnovel.id}`}>
                        <Image
                            src={getImageUrl(webnovel.cover_art)}
                            alt={webnovel.title}
                            width={100}
                            height={100}
                            className="rounded-md"
                        />
                    </Link>
                    <div className="space-y-1">
                        <h4 className="text-sm font-semibold">{webnovel.title}</h4>
                        <p className="text-sm">
                            {truncateText(webnovel.description, 100)}
                        </p>
                        <div className="flex items-center pt-2">
                            {/* Placeholder for future content */}
                        </div>
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
}