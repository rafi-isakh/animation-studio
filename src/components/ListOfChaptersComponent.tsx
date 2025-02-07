import { Chapter, Webnovel, Webtoon, WebtoonChapter } from "@/components/Types";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import { phrase } from '@/utils/phrases';
import OtherTranslateComponent from "./OtherTranslateComponent";
import { useEffect, useState } from "react";
import moment from 'moment';
import { Button, Modal, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, ThemeProvider } from "@mui/material";
import { useModalStyle } from '@/styles/ModalStyles';
import { ChevronDownIcon, Eye, Heart, MessageCircle, BadgeCheck } from "lucide-react";
import Image from "next/image";
import { getImageUrl } from "@/utils/urls";
import { MdStars } from "react-icons/md";
import { useRouter } from "next/navigation";
import { chapterPrice } from "@/utils/webnovelUtils";
import { useUser } from "@/contexts/UserContext";

const ListOfChaptersComponent = ({
    webnovel,
    sortToggle,
    onUpdate
}: {
    webnovel: Webnovel | undefined,
    sortToggle: boolean,
    onUpdate?: (updatedContent: Webnovel) => void
}) => {
    const { dictionary, language } = useLanguage();
    const [key, setKey] = useState(0);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteChapterId, setDeleteChapterId] = useState<number | null>(null);
    const [showMoreChapters, setShowMoreChapters] = useState(false);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [chapterToPurchase, setChapterToPurchase] = useState<Chapter | null>(null);
    const date = new Date();
    const router = useRouter();
    const { purchased_webnovel_chapters, setInvokeCheckUser } = useUser();

    useEffect(() => {
        setKey(prevKey => prevKey + 1)
    }, [language])

    const sortedChapters = sortToggle ? webnovel?.chapters.sort((a, b) => b.id - a.id) : webnovel?.chapters.sort((a, b) => a.id - b.id);

    const handleChapterDelete = async (id: number) => {
        try {
            const res = await fetch(`/api/delete_chapter?id=${id}`);
            if (res.ok) {
                setShowDeleteModal(false);
                setTimeout(() => {
                    window.location.href = `/view_webnovels?id=${webnovel?.id}`;
                }, 100);
            } else {
                console.error('Failed to delete chapter');
            }
        } catch (error) {
            console.error('Error deleting chapter:', error);
        }
    }

    const handleChapterClick = (chapter: Chapter) => {
        if (chapter.free) {
            router.push(`/chapter_view/${chapter.id}`);
        } else {
            if (purchased_webnovel_chapters.includes(chapter.id)) {
                router.push(`/chapter_view/${chapter.id}`);
                return;
            }
            setChapterToPurchase(chapter);
            setShowPurchaseModal(true);
        }
    }

    const handleChapterPurchase = async (chapter: Chapter) => {
        if (!chapter) return;
        else {
            setShowPurchaseModal(false);
            const response = await fetch(`/api/purchase_chapter`, {
                method: 'POST',
                body: JSON.stringify({
                    chapter_id: chapter.id,
                    price: chapterPrice(language)
                })
            });
            if (!response.ok) {
                console.error('Failed to purchase chapter');
                alert("Failed to purchase chapter");
            } else {
                const data = await response.json();
                if (data.success) {
                    setInvokeCheckUser(prev => !prev);
                    router.push(`/chapter_view/${chapter.id}`);
                } else {
                    alert(data.message);
                }
            }
        }
    }

    return (
        <>
            <div className="w-full">
                <div className="overflow-y-auto rounded-md">
                    {sortedChapters?.map((chapter, index) => (
                        <button
                            onClick={() => handleChapterClick(chapter)}
                            key={`chapter-${chapter.id}`}
                            className={`w-full block py-2 border-b border-gray-200 dark:border-gray-800 last:border-b-0 
                    ${index >= 10 && !showMoreChapters ? 'hidden' : ''}`}
                        >
                            <div className="flex flex-row justify-between items-center">
                                <div className="flex flex-row gap-3 items-center">
                                    {/* <p className="text-sm self-center">{index + 1}</p> */}
                                    <Image
                                        src={getImageUrl(webnovel?.cover_art)}
                                        alt={webnovel?.title || ''}
                                        width={50}
                                        height={50}
                                        className="rounded-lg"
                                    />
                                    <div className="flex flex-col text-sm">
                                        <div className="flex flex-row">
                                            <OtherTranslateComponent content={chapter.title} elementId={chapter.id.toString()} elementType="chapter" classParams="text-[14px]w-full truncate whitespace-nowrap text-black dark:text-white" />
                                        </div>
                                        <p className="text-[11px] self-start text-gray-500">{moment(new Date(chapter.created_at)).format('YYYY/MM/DD')}</p>
                                        <div className="flex flex-row space-x-2 text-sm">
                                            <div className='flex flex-row gap-1 items-center text-[11px] text-gray-500 dark:text-white '>
                                                <Eye size={11} /> {chapter.views}
                                            </div>
                                            <div className='flex flex-row gap-1 items-center text-[11px] text-gray-500 dark:text-white '>
                                                <Heart size={11} /> {chapter.upvotes}
                                            </div>
                                            <div className='flex flex-row gap-1 items-center text-[11px] text-gray-500 dark:text-white '>
                                                <MessageCircle size={11} /> {chapter.comments.length}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-row gap-2 items-center">
                                    <div className="text-gray-600 text-[10px] bg-gray-200 rounded-md px-1">
                                        {chapter.free ? phrase(dictionary, "readingForFree", language)
                                            : purchased_webnovel_chapters?.includes(chapter.id) ? <BadgeCheck size={11} />
                                                : <div className="flex flex-row gap-1 items-center"> <MdStars className="text-sm text-[#D92979]" />{chapterPrice(language)}</div>}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
                {webnovel?.chapters && webnovel?.chapters.length > 10 && (
                    <button
                        className="mt-4 w-full text-black dark:text-white rounded-xl p-2 text-sm flex flex-row gap-2 items-center justify-center"
                        onClick={() => setShowMoreChapters(!showMoreChapters)}
                    >
                        {phrase(dictionary, showMoreChapters ? "less" : "more", language)}
                        <ChevronDownIcon size={16} />
                    </button>
                )}
            </div>
            <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
                <Box sx={useModalStyle}>
                    <div className="flex flex-col space-y-4 items-center justify-center">
                        <p className="text-lg font-bold">
                            {phrase(dictionary, "deleteChapterConfirm", language)}
                        </p>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={() => handleChapterDelete(deleteChapterId!)}
                        >
                            {phrase(dictionary, "yes", language)}
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => setShowDeleteModal(false)}
                        >
                            {phrase(dictionary, "no", language)}
                        </Button>
                    </div>
                </Box>
            </Modal>
            <Modal open={showPurchaseModal} onClose={() => setShowPurchaseModal(false)}>
                <Box sx={useModalStyle}>
                    <div className="flex flex-col space-y-4 items-center justify-center">
                        <p className="text-lg font-bold">
                            {phrase(dictionary, "purchaseChapter", language)}
                        </p>
                        <p className="text-sm text-gray-500">
                            {phrase(dictionary, "wouldYouLikeToPurchaseChapter", language)}
                        </p>
                        <Button
                            variant="outlined"
                            color="gray"
                            onClick={() => handleChapterPurchase(chapterToPurchase!)}
                        >
                            {phrase(dictionary, "purchase", language)}
                        </Button>
                    </div>
                </Box>
            </Modal>
        </>
    );
};


export default ListOfChaptersComponent;