import { Chapter, Dictionary, Webnovel } from "@/components/Types";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from '@/utils/phrases';
import { useEffect, useMemo, useState } from "react";
import moment from 'moment';
import { ChevronDownIcon, MessageCircle, BadgeCheck, ChevronUpIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/shadcnUI/Dialog";
import { useRouter } from 'next/navigation';
import { useUser } from "@/contexts/UserContext";
import Image from "next/image";
import { getImageUrl } from "@/utils/urls";
import { MdStars } from "react-icons/md";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/shadcnUI/Button";
import NotEnoughStarsDialog from "@/components/UI/NotEnoughStarsDialog";
import ChapterPurchaseDialog from "@/components/UI/ChapterPurchaseDialog";
import { isPurchasedChapter } from "@/utils/webnovelUtils";
import { createEmailHash } from "@/utils/cryptography";
import { Menubar } from "@/components/shadcnUI/Menubar";
import TableOfContents from "@/components/UI/TableOfContents";
import { useMediaQuery } from "@mui/material";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/shadcnUI/Pagination"
import { useWebnovels } from "@/contexts/WebnovelsContext";

const ListOfChaptersComponent = ({
    webnovel,
    onUpdate,
    isAuthor
}: {
    webnovel: Webnovel | undefined,
    onUpdate?: (updatedContent: Webnovel) => void,
    isAuthor?: boolean
}) => {
    const { dictionary, language } = useLanguage();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteChapterId, setDeleteChapterId] = useState<number | null>(null);
    const [showMoreChapters, setShowMoreChapters] = useState(false);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [chapterToPurchase, setChapterToPurchase] = useState<Chapter | null>(null);
    const date = new Date();
    const router = useRouter();
    const { purchased_webnovel_chapters, setInvokeCheckUser, stars, english_stars } = useUser();
    const { isLoggedIn } = useAuth();
    const [visibleChapters, setVisibleChapters] = useState(10); // Initial number of visible chapters
    const CHAPTERS_PER_PAGE = 10; // Number of chapters to show per click
    const [currentPage, setCurrentPage] = useState(1);
    const [showNotEnoughStarsModal, setShowNotEnoughStarsModal] = useState(false);
    const [savedValueOfVisibleChapters, setSavedValueOfVisibleChapters] = useState(10); // for switching back and forth between languages
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [sortToggle, setSortToggle] = useState(false);
    const isMobile = useMediaQuery('(max-width: 768px)');
    const { getChaptersMetadataByWebnovelId } = useWebnovels();
    const [loading, setLoading] = useState(false);


    const sortedChapters = sortToggle
        ? [...(webnovel?.chapters || [])].sort((a, b) => b.id - a.id)
        : [...(webnovel?.chapters || [])].sort((a, b) => a.id - b.id);

    const displayedChapters = useMemo(() => {
        return (webnovel?.chapters || []).sort((a, b) => {
            return sortToggle
            ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
        }, [webnovel?.chapters, sortToggle]);

    const totalPages = Math.ceil((webnovel?.chapters_length || 0) / CHAPTERS_PER_PAGE);

    const handleSortToggle = () => {
        setSortToggle(prev => !prev);
        setCurrentPage(1);
    };


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

    useEffect(() => {
        const fetchChapters = async () => {
            if (!webnovel?.id) return;

            setLoading(true); 
            const offset = (currentPage - 1) * CHAPTERS_PER_PAGE;
            const chapters = await getChaptersMetadataByWebnovelId(
                webnovel.id.toString(),
                CHAPTERS_PER_PAGE,
                offset,
                sortToggle
            );

            if (chapters && onUpdate && webnovel) {
                onUpdate({ ...webnovel, chapters });
            }
            setLoading(false); 
        };

        fetchChapters();
    }, [currentPage, sortToggle]);

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
            if ((language === "ko" && stars < price!) || (language === "en" && english_stars < price!)) {
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

    const getPaginationRange = (current: number, total: number) => {
        if (isMobile) {
            if (total <= 7) {
                return Array.from({ length: total }, (_, i) => i + 1);
            }
            if (current <= 4) {
                return [1, 2, 3, 4, 5, '...', total];
            }
            if (current >= total - 3) {
                return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
            }
            return [1, '...', current - 1, current, current + 1, '...', total];
        } else {
            if (total <= 10) {
                return Array.from({ length: total }, (_, i) => i + 1);
            }
            if (current <= 5) {
                return [1, 2, 3, 4, 5, 6, 7, 8, '...', total];
            }
            if (current >= total - 4) {
                return [1, '...', total - 7, total - 6, total - 5, total - 4, total - 3, total - 2, total - 1, total];
            }
            return [1, '...', current - 2, current - 1, current, current + 1, current + 2, '...', total];
        }
    }

    const handlePageClick = (page: number) => {
        if (typeof page === 'number' && page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <>
            <div className="flex flex-row gap-2 items-center justify-between ">
                <p className="text-sm text-gray-500">
                    {phrase(dictionary, "chapter_list", language)}
                </p>

                <div className="flex flex-row gap-2 items-center">
                    <Menubar>
                        <TableOfContents
                            sortedChapters={sortedChapters || []}
                            purchased_webnovel_chapters={(purchased_webnovel_chapters || [])
                                .filter((purchase) => purchase[1] === language)
                                .map((purchase) => purchase[0])
                            }
                            language={language}
                            chapter_id={displayedChapters[0]?.id.toString() || "0"}
                            setChapterToPurchase={setChapterToPurchase}
                            setShowPurchaseModal={setShowPurchaseModal}
                            webnovel={webnovel!}
                            isPurchasedChapter={(purchasedChapters, chapterId) =>
                                purchasedChapters.includes(chapterId)
                            }
                            sortToggle={sortToggle}
                            phrase={phrase as (dictionary: Dictionary, key: string, language: string) => string}
                            dictionary={dictionary as Dictionary}
                        />
                    </Menubar>
                    <Button variant="outline" onClick={handleSortToggle} className='flex gap-2'>
                        {sortToggle ? phrase(dictionary, "sort_theFirstChapter", language) : phrase(dictionary, "sort_theLastChapter", language)}
                        {sortToggle ? <ChevronUpIcon size={16} className="text-black dark:text-white" /> : <ChevronDownIcon size={16} className="text-black dark:text-white" />}
                    </Button>
                </div>
            </div>
            <div className="w-full">
                <div className="overflow-y-auto rounded-md">
                    {displayedChapters.map((chapter, index) => (
                        <button
                            onClick={() => handleChapterClick(chapter)}
                            key={`chapter-${chapter.id}`}
                            className={`w-full block py-2 border-b border-gray-200 dark:border-gray-800 last:border-b-0 cursor-pointer
                           `}
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
                                        <div className="flex flex-row w-full items-start">
                                            {loading ? (
                                            <span className="inline-block h-4 w-24 rounded bg-gray-300 dark:bg-gray-700 animate-pulse" />
                                            ) : language === 'en' ? (
                                            <p className="text-md text-left truncate whitespace-nowrap text-black dark:text-white">
                                                Episode {sortToggle
                                                ? (webnovel?.chapters_length || 0) - ((currentPage - 1) * CHAPTERS_PER_PAGE + index)
                                                : (currentPage - 1) * CHAPTERS_PER_PAGE + index + 1}
                                            </p>
                                            ) : language === 'ja' ? (
                                            <p className="text-md text-left truncate whitespace-nowrap text-black dark:text-white">
                                                第{sortToggle
                                                ? (webnovel?.chapters_length || 0) - ((currentPage - 1) * CHAPTERS_PER_PAGE + index)
                                                : (currentPage - 1) * CHAPTERS_PER_PAGE + index + 1}話
                                            </p>
                                            ) : (
                                            <p className="text-md text-left truncate whitespace-nowrap text-black dark:text-white">
                                                {sortToggle
                                                ? (webnovel?.chapters_length || 0) - ((currentPage - 1) * CHAPTERS_PER_PAGE + index)
                                                : (currentPage - 1) * CHAPTERS_PER_PAGE + index + 1}화
                                            </p>
                                            )}
                                        </div>

                                        {loading ? (
                                            <span className="inline-block h-3 w-16 mt-1 rounded bg-gray-300 dark:bg-gray-700 animate-pulse" />
                                        ) : (
                                            <p className="text-[11px] self-start text-gray-500">
                                            {moment(new Date(chapter.created_at)).format('YYYY/MM/DD')}
                                            </p>
                                        )}

                                        <div className="flex flex-row space-x-2 text-sm mt-1">
                                            {loading ? (
                                            <div className="flex flex-row gap-2">
                                                <span className="inline-block h-3 w-10 rounded bg-gray-300 dark:bg-gray-700 animate-pulse" />
                                                <span className="inline-block h-3 w-10 rounded bg-gray-300 dark:bg-gray-700 animate-pulse" />
                                            </div>
                                            ) : (
                                            <>
                                                <div className='flex flex-row gap-1 items-center text-[11px] text-gray-500 dark:text-white'>
                                                <svg width="10" height="9" viewBox="0 0 10 9" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#DE2B74] dark:text-[#DE2B74]">
                                                    <path d="M8.48546 5.591C9.18401 4.9092 9.98235 4.03259 9.98235 2.96119C10.0521 2.36601 9.91388 1.76527 9.5901 1.25634C9.26632 0.747404 8.77594 0.360097 8.19844 0.157182C7.62094 -0.0457339 6.99015 -0.0523672 6.40831 0.138357C5.82646 0.32908 5.32765 0.705985 4.99271 1.20799C4.63648 0.744933 4.13753 0.405536 3.56912 0.239623C3.0007 0.0737095 2.39277 0.0900199 1.83455 0.286159C1.27634 0.482299 0.797245 0.847936 0.467611 1.32939C0.137977 1.81085 -0.0248358 2.38277 0.00307225 2.96119C0.00307225 4.12999 0.801414 4.9092 1.49996 5.6884L4.99271 9L8.48546 5.591Z"
                                                    fill="#DE2B74" />
                                                </svg>
                                                {chapter.upvotes}
                                                </div>

                                                <div className='flex flex-row gap-1 items-center text-[11px] text-gray-500 dark:text-white'>
                                                <MessageCircle size={11} /> {chapter.comments.length}
                                                </div>
                                            </>
                                            )}
                                        </div>
                                        </div>

                                </div>
                                <div className="flex flex-row gap-2 items-center">
                                    <div className="text-gray-600 text-[10px] bg-transparent rounded-md px-1">
                                        {chapter.free ? <span className="uppercase">{phrase(dictionary, "readingForFree", language)}</span>
                                            : isPurchasedChapter(purchased_webnovel_chapters, chapter.id, language) ? <BadgeCheck size={11} className="text-green-400 dark:text-green-400" />
                                                : <div className="flex flex-row gap-1 items-center">
                                                    <MdStars className="text-sm text-[#D92979]" />
                                                    {language === "ko" ? webnovel?.price_korean : webnovel?.price_english}
                                                </div>
                                        }
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
                <div className="flex justify-center items-center gap-1 mt-4 text-xs">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handlePageClick(currentPage - 1);
                                    }}
                                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>
                            {getPaginationRange(currentPage, totalPages).map((page, index) => (
                                <PaginationItem key={`${page}-${index}`}>
                                    {page === '...' ? (
                                        <PaginationEllipsis />
                                    ) : (
                                        <PaginationLink
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handlePageClick(page as number);
                                            }}
                                            isActive={currentPage === page}
                                        >
                                            {page}
                                        </PaginationLink>
                                    )}
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handlePageClick(currentPage + 1);
                                    }}
                                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            </div>
            <Dialog open={showDeleteModal} onOpenChange={(open) => setShowDeleteModal(open)}>
                <DialogContent className="p-4">
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
                </DialogContent>
            </Dialog>
            {/* Purchase Modal */}
            <ChapterPurchaseDialog showPurchaseModal={showPurchaseModal} setShowPurchaseModal={setShowPurchaseModal} handleChapterPurchase={handleChapterPurchase} content={webnovel} stars={stars} english_stars={english_stars} chapter={chapterToPurchase!} />
            {/* Not Enough Stars Modal */}
            <NotEnoughStarsDialog showNotEnoughStarsModal={showNotEnoughStarsModal} setShowNotEnoughStarsModal={setShowNotEnoughStarsModal} stars={stars} english_stars={english_stars} content={webnovel} />
        </>
    )
};

export default ListOfChaptersComponent;