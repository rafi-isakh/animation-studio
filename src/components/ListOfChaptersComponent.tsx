import { Chapter, Webnovel } from "@/components/Types";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from '@/utils/phrases';
import { useEffect, useState } from "react";
import moment from 'moment';
import { ChevronDownIcon, Eye, MessageCircle, BadgeCheck, ChevronUpIcon } from "lucide-react";
import { Button, Modal, Box } from "@mui/material";
import { useModalStyle } from '@/styles/ModalStyles';
import { useRouter } from 'next/navigation';
import { useUser } from "@/contexts/UserContext";
import Image from "next/image";
import { getImageUrl } from "@/utils/urls";
import { MdStars } from "react-icons/md";
import { useAuth } from "@/contexts/AuthContext";
import NotEnoughStarsDialog from "@/components/UI/NotEnoughStarsDialog";
import ChapterPurchaseDialog from "@/components/UI/ChapterPurchaseDialog";
import { isPurchasedChapter } from "@/utils/webnovelUtils";

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
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteChapterId, setDeleteChapterId] = useState<number | null>(null);
    const [showMoreChapters, setShowMoreChapters] = useState(false);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [chapterToPurchase, setChapterToPurchase] = useState<Chapter | null>(null);
    const date = new Date();
    const router = useRouter();
    const { purchased_webnovel_chapters, setInvokeCheckUser, stars } = useUser();
    const { isLoggedIn } = useAuth();
    const [visibleChapters, setVisibleChapters] = useState(10); // Initial number of visible chapters
    const CHAPTERS_PER_PAGE = 100; // Number of chapters to show per click

    const sortedChapters = sortToggle ? webnovel?.chapters.sort((a, b) => b.id - a.id) : webnovel?.chapters.sort((a, b) => a.id - b.id);
    const displayedChapters = sortedChapters?.slice(0, visibleChapters) || [];
    const hasMoreChapters = sortedChapters ? sortedChapters.length > visibleChapters : false;
    const [showNotEnoughStarsModal, setShowNotEnoughStarsModal] = useState(false);
    const [savedValueOfVisibleChapters, setSavedValueOfVisibleChapters] = useState(10); // for switching back and forth between languages

    const [imageSrc, setImageSrc] = useState<string | null>(null);

    useEffect(() => {
        setImageSrc(getImageUrl(webnovel?.cover_art));
        if (language == 'en' && webnovel?.en_cover_art) {
            setImageSrc(getImageUrl(webnovel?.en_cover_art));
        } 
    }, [webnovel, language]);


    const loadMoreChapters = () => {
        if (language == 'en') {
            setVisibleChapters(prev => Math.min(webnovel?.en_published_up_to_chapter || Infinity, Math.min(prev + CHAPTERS_PER_PAGE, sortedChapters?.length || 0)));
        } else {
            setVisibleChapters(prev => Math.min(prev + CHAPTERS_PER_PAGE, sortedChapters?.length || 0));
        }
    };

    useEffect(() => {
        if (language == 'en') {
            setSavedValueOfVisibleChapters(visibleChapters);
            setVisibleChapters(prev => Math.min(webnovel?.en_published_up_to_chapter || Infinity, prev));
        } else {
            const tempVisibleChapters = visibleChapters;
            setVisibleChapters(savedValueOfVisibleChapters);
            setSavedValueOfVisibleChapters(tempVisibleChapters);
        }
    }, [language])

    const handleChapterDelete = async (id: number) => {
        try {
            const res = await fetch(`/api/delete_chapter?id=${id}`);
            if (res.ok) {
                setShowDeleteModal(false);
                setTimeout(() => {
                    window.location.href = `/view_webnovels/${webnovel?.id}`;
                }, 100);
            } else {
                console.error('Failed to delete chapter');
            }
        } catch (error) {
            console.error('Error deleting chapter:', error);
        }
    }

    const handleChapterClick = (chapter: Chapter) => {
        if (!webnovel?.available_languages.includes(language)) {
            alert(phrase(dictionary, "languageNotAvailable", language));
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

    return (
        <>
            <div className="w-full">
                <div className="overflow-y-auto rounded-md">
                    {displayedChapters.map((chapter, index) => (
                        <button
                            onClick={() => handleChapterClick(chapter)}
                            key={`chapter-${chapter.id}`}
                            className={`w-full block py-2 border-b border-gray-200 dark:border-gray-800 last:border-b-0 cursor-pointer
                           `}
                           // ${!chapter.free ? 'opacity-50' : ''} 
                        >
                            <div className="flex flex-row justify-between items-center">
                                <div className="flex flex-row gap-3 items-center">
                                    {/* <p className="text-sm self-center">{index + 1}</p> */}
                                    <div className="min-w-[50px] max-w-[50px]">
                                    <Image
                                        src={imageSrc || ""}
                                        alt={webnovel?.title || ""}
                                        width={50}
                                        height={50}
                                        className="rounded-lg object-cover w-full"
                                    />
                                    </div>
                                    <div className="flex flex-col text-sm">
                                        <div className="flex flex-row">
                                            {
                                                language == 'en' ?
                                                    <p className="text-[14px]w-full truncate whitespace-nowrap text-black dark:text-white">Episode {index + 1}</p>
                                                    :
                                                    <p className="text-[14px]w-full truncate whitespace-nowrap text-black dark:text-white">{index + 1}화</p>

                                            }
                                            {/* <OtherTranslateComponent content={chapter.title} elementId={chapter.id.toString()} elementType="chapter" classParams="text-[14px]w-full truncate whitespace-nowrap text-black dark:text-white" /> */}
                                        </div>
                                        <p className="text-[11px] self-start text-gray-500">{moment(new Date(chapter.created_at)).format('YYYY/MM/DD')}</p>
                                        <div className="flex flex-row space-x-2 text-sm">
                                            <div className='flex flex-row gap-1 items-center text-[11px] text-gray-500 dark:text-white '>
                                                <Eye size={11} /> {chapter.views}
                                            </div>
                                            <div className='flex flex-row gap-1 items-center text-[11px] text-gray-500 dark:text-white '>
                                                {/* <Heart size={11} /> */}
                                                {/* heart icon */}
                                                <svg width="10" height="9" viewBox="0 0 10 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M8.48546 5.591C9.18401 4.9092 9.98235 4.03259 9.98235 2.96119C10.0521 2.36601 9.91388 1.76527 9.5901 1.25634C9.26632 0.747404 8.77594 0.360097 8.19844 0.157182C7.62094 -0.0457339 6.99015 -0.0523672 6.40831 0.138357C5.82646 0.32908 5.32765 0.705985 4.99271 1.20799C4.63648 0.744933 4.13753 0.405536 3.56912 0.239623C3.0007 0.0737095 2.39277 0.0900199 1.83455 0.286159C1.27634 0.482299 0.797245 0.847936 0.467611 1.32939C0.137977 1.81085 -0.0248358 2.38277 0.00307225 2.96119C0.00307225 4.12999 0.801414 4.9092 1.49996 5.6884L4.99271 9L8.48546 5.591Z" fill="#6B7280" />
                                                </svg>
                                                {chapter.upvotes}
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
                                            : isPurchasedChapter(purchased_webnovel_chapters, chapter.id, language) ? <BadgeCheck size={11} />
                                                : <div className="flex flex-row gap-1 items-center"> <MdStars className="text-sm text-[#D92979]" />{language === "ko" ? webnovel?.price_korean : webnovel?.price_english}</div>}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
                {hasMoreChapters && (
                    <button
                        className="mt-4 w-full text-black dark:text-white rounded-xl p-2 text-sm flex flex-row gap-2 items-center justify-center"
                        onClick={loadMoreChapters}
                    >
                        {/* 더보기 */}
                        {showMoreChapters ? phrase(dictionary, "less", language) : phrase(dictionary, "more", language)}
                        {showMoreChapters ? <ChevronUpIcon size={16} className="text-black dark:text-white" /> : <ChevronDownIcon size={16} className="text-black dark:text-white" />}
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

            {/* Purchase Modal */}
            <ChapterPurchaseDialog showPurchaseModal={showPurchaseModal} setShowPurchaseModal={setShowPurchaseModal} handleChapterPurchase={handleChapterPurchase} content={webnovel} stars={stars} chapter={chapterToPurchase!} />
            {/* Not Enough Stars Modal */}
            <NotEnoughStarsDialog showNotEnoughStarsModal={showNotEnoughStarsModal} setShowNotEnoughStarsModal={setShowNotEnoughStarsModal} stars={stars} content={webnovel} />
        </>
    )
};

export default ListOfChaptersComponent;