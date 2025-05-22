import { Chapter } from "@/components/Types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/shadcnUI/Dialog";
import { Button } from "@/components/shadcnUI/Button";
import { MdStars } from "react-icons/md";
import { phrase } from "@/utils/phrases";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const ChapterPurchaseDialog = ({
    showPurchaseModal,
    setShowPurchaseModal,
    handleChapterPurchase,
    content,
    stars,
    chapter
}: {
    showPurchaseModal: boolean,
    setShowPurchaseModal: (showPurchaseModal: boolean) => void,
    handleChapterPurchase: (chapter: Chapter) => void,
    content: any,
    stars: number,
    chapter: Chapter
}) => {
    const { dictionary, language } = useLanguage();

    return (
        <Dialog open={showPurchaseModal} onOpenChange={setShowPurchaseModal}>
            <DialogContent className='z-[2500] !gap-0 !p-0 overflow-hidden bg-white dark:bg-[#211F21] border-none shadow-none md:h-auto h-auto text-md' showCloseButton={true}>
                <DialogHeader className='text-md p-4'>
                    <DialogTitle className="text-md font-bold text-center">
                        <p>{phrase(dictionary, "purchaseChapter", language)}</p>
                    </DialogTitle>
                    <DialogDescription className="flex flex-col justify-center items-center p-4 text-md">
                        <p className='text-md text-gray-500 py-2'> {phrase(dictionary, "wouldYouLikeToPurchaseChapter", language)}</p>
                        <p>{language === "ko" 
                                ? <span className="text-black dark:text-white inline-flex gap-1">보유한 별 <MdStars className="text-xl text-[#D92979]" /> {stars} </span> 
                                : <span className="text-black dark:text-white inline-flex gap-1">You have <MdStars className="text-xl text-[#D92979]" /> {stars} </span>}
                        </p>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className='flex flex-row !space-x-0 !p-0 !flex-grow-0 !flex-shrink-0 w-full self-end text-md'>
                    <Button
                        onClick={() => handleChapterPurchase(chapter)}
                        className={cn("!rounded-none flex-1 w-full py-6 text-md font-medium bg-[#DE2B74] hover:bg-[#DE2B74] text-white")}
                    >
                        <MdStars className="text-xl text-white" />
                        {language === "ko" ? <span className="text-white dark:text-white inline-flex gap-1"> {content.price_korean} </span> 
                                           : <span className="text-white dark:text-white inline-flex gap-1"> {content.price_english} </span>}
                        {phrase(dictionary, "purchase", language)}
                    </Button>
                    <Button
                        onClick={() => setShowPurchaseModal(false)}
                        className={cn("!rounded-none flex-1 w-full py-6 text-md font-medium bg-[#b8c1d1] hover:bg-[#a9b2c2] text-white")}
                    >
                        {phrase(dictionary, "cancel", language)}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default ChapterPurchaseDialog