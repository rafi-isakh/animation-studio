import { Chapter } from "@/components/Types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/shadcnUI/Dialog";
import { Button } from "@/components/shadcnUI/Button";
import { MdStars } from "react-icons/md";
import { phrase } from "@/utils/phrases";
import { useLanguage } from "@/contexts/LanguageContext";

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
            <DialogContent className="sm:max-w-md bg-gradient-to-r dark:from-black dark:to-blue-900/10 from-purple-100/50 to-blue-100/50 backdrop-blur-md select-none">
                <DialogHeader>
                    <DialogTitle>
                        <p className="text-lg font-bold text-center">
                            {phrase(dictionary, "purchaseChapter", language)}
                        </p>
                    </DialogTitle>
                    <DialogDescription className="flex flex-col justify-center items-center">
                        <p className='text-sm text-gray-500 py-2'> {phrase(dictionary, "wouldYouLikeToPurchaseChapter", language)}</p>
                        <p>{language === "ko" ? <span className="text-black dark:text-white inline-flex gap-1">보유한 별 <MdStars className="text-xl text-[#D92979]" /> {stars} </span> : <span className="text-black dark:text-white inline-flex gap-1">You have <MdStars className="text-xl text-[#D92979]" /> {stars} </span>}</p>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex !justify-center">
                    <div className="flex flex-row justify-center items-center gap-2 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => handleChapterPurchase(chapter)}
                            className="bg-black hover:bg-[#D92979]/50 text-white border"
                        >
                            <MdStars className="text-xl text-[#D92979]" />
                            {language === "ko" ? content.price_korean : content.price_english} {phrase(dictionary, "purchase", language)}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setShowPurchaseModal(false)}
                        >
                            {phrase(dictionary, "cancel", language)}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default ChapterPurchaseDialog