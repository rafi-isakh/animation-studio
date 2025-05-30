import { Chapter, Webnovel } from "@/components/Types";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from '@/utils/phrases';
import { useEffect, useState } from "react";
import moment from 'moment';
import { ChevronDownIcon, Eye, MessageCircle, BadgeCheck, ChevronUpIcon, Lock, Unlock, BarChart3 } from "lucide-react";
import { Button } from "@/components/shadcnUI/Button";
import { Card, CardContent } from "@/components/shadcnUI/Card";
import { Modal, Box } from "@mui/material";
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
import Link from "next/link";

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

    const RANGE_SIZE = 50; // Number of chapters per pagination tab

    const paginationRanges = (totalChapters: number) => {
        if (totalChapters <= 0) {
            const noChaptersLabel = language === 'ko' ? "챕터 없음" : "No Chapters";
            return [{ label: noChaptersLabel, start: 0, end: 0, isActive: true }];
        }

        const ranges = [];
        const numRanges = Math.ceil(totalChapters / RANGE_SIZE);

        for (let i = 0; i < numRanges; i++) {
            const startChapter = i * RANGE_SIZE + 1;
            const endChapter = Math.min((i + 1) * RANGE_SIZE, totalChapters);

            let label = `${startChapter}-${endChapter}`;
            if (endChapter === totalChapters) {
                label += language === 'ko' ? "(완결)" : "(End)";
            }

            ranges.push({
                label: label,
                start: startChapter,
                end: endChapter,
                isActive: i === 0 // First range is active by default
            });
        }
        return ranges;
    }

    const [selectedRange, setSelectedRange] = useState(paginationRanges(webnovel?.chapters.length || 0)[0]);

    const generateEpisodes = (start: number, end: number) => {
        const episodes = [];
        for (let i = start; i <= end; i++) {
            episodes.push(webnovel?.chapters[i - 1]);
        }
        return episodes;
    }

    const episodes = generateEpisodes(selectedRange.start, selectedRange.end)

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
            <div className="flex flex-nowrap gap-4 overflow-x-auto no-scrollbar">
                {paginationRanges(webnovel?.chapters.length || 0).map((range) => (
                    <Button
                        key={range.label}
                        variant="ghost"
                        onClick={() => setSelectedRange(range)}
                        className={`px-0 py-2 text-lg font-medium border-b-2 rounded-none hover:bg-transparent 
                            ${selectedRange.label === range.label
                                ? "text-pink-500 border-pink-500"
                                : "text-gray-500 border-transparent hover:text-gray-300"
                            }`}
                    >
                        {range.label}
                    </Button>
                ))}
            </div>
            <div className="w-full">
                {/* Episode Grid */}
                <div className="grid md:grid-cols-5 grid-cols-4 gap-3">
                    {episodes.map((episode, index) => (
                        <Card
                            key={episode?.id}
                            className={`group cursor-pointer transition-all duration-200 hover:scale-105 border-0 
                               
                            `}
                        >
                            <CardContent className="p-0 group">
                                <Button
                                    variant='ghost'
                                    onClick={() => handleChapterClick(episode!)}
                                    className="relative aspect-square flex flex-col items-center justify-center w-full h-full">
                                    <span className="text-lg font-bold text-black dark:text-white group-hover:hidden">
                                        {selectedRange.start + index}
                                    </span>
                                    {
                                        episode?.free ? (
                                            <>
                                                <div className="absolute top-1 right-1 bg-pink-500 text-white text-xs px-1 py-0.5 rounded font-medium">
                                                    {phrase(dictionary, "readingForFree", language)}
                                                </div>
                                                <span className="hidden text-lg font-bold text-black dark:text-white group-hover:block">
                                                    {selectedRange.start + index}
                                                </span>
                                            </>
                                        ) : (
                                            isPurchasedChapter(purchased_webnovel_chapters, episode?.id!, language) ? <>
                                                <BadgeCheck size={11} className="text-green-500 absolute top-1 right-1" />
                                                <span className="hidden text-lg font-bold text-black dark:text-white group-hover:block">
                                                    {selectedRange.start + index}
                                                </span>
                                            </>
                                                :
                                                <>
                                                    {!episode?.free ? <Lock className="w-2 h-2 absolute top-1 right-1 text-gray-300" /> : <></>}
                                                    <div className="hidden group-hover:flex flex-row gap-1 items-center text-lg font-bold">
                                                        <MdStars className="text-lg text-[#D92979]" />
                                                        <span className="text-black dark:text-white">
                                                            {language === "ko" ? webnovel?.price_korean : webnovel?.price_english}
                                                        </span>
                                                    </div>
                                                </>
                                        )
                                    }
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                {/* Show message if no episodes in range */}
                {episodes.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-400 text-lg">이 범위에는 에피소드가 없습니다.</p>
                    </div>
                )}
            </div>
            {/* </div > */}
            <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
                <Box sx={useModalStyle}>
                    <div className="flex flex-col space-y-4 items-center justify-center">
                        <p className="text-lg font-bold">
                            {phrase(dictionary, "deleteChapterConfirm", language)}
                        </p>
                        <Button
                            variant="outline"
                            color="error"
                            onClick={() => handleChapterDelete(deleteChapterId!)}
                        >
                            {phrase(dictionary, "yes", language)}
                        </Button>
                        <Button
                            variant="outline"
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