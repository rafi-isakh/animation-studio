'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/shadcnUI/Dialog";
import { Button } from "@/components/shadcnUI/Button";
import { MdStars } from "react-icons/md";
import { useRouter } from "next/navigation";
import { phrase } from "@/utils/phrases";
import { useLanguage } from "@/contexts/LanguageContext";
import { Webnovel } from "@/components/Types";
{/* Not Enough Stars Modal */ }
const NotEnoughStarsDialog = ({ showNotEnoughStarsModal, setShowNotEnoughStarsModal, stars, content, createMediaPrice }: { showNotEnoughStarsModal: boolean, setShowNotEnoughStarsModal: (showNotEnoughStarsModal: boolean) => void, stars: number, content?: Webnovel, createMediaPrice?: number }) => {
    const router = useRouter();
    const { dictionary, language } = useLanguage();

    const price = language === "ko" 
        ? content?.price_korean 
        : (content?.price_english ?? "Price not available"); // Fallback for undefined price_english

    return (
        <Dialog open={showNotEnoughStarsModal} onOpenChange={setShowNotEnoughStarsModal}>
            <DialogContent className="sm:max-w-md bg-gradient-to-r dark:from-black dark:to-blue-900/10 from-purple-100/50 to-blue-100/50 backdrop-blur-md select-none">
                <DialogHeader>
                    <DialogTitle>
                        <p className="text-lg font-bold text-center">
                            {phrase(dictionary, "notEnoughStars", language)}
                        </p>
                    </DialogTitle>
                    <DialogDescription className="flex flex-col justify-center items-center">
                        <p className='text-sm text-gray-500 py-2'>{phrase(dictionary, "notEnoughStarsDescription", language)}</p>
                        <div className="flex flex-col items-center gap-2 mt-2">
                            <p>{language === "ko" ? <span className="text-black dark:text-white inline-flex gap-1">보유한 별 <MdStars className="text-xl text-[#D92979]" /> {stars} </span>
                                : <span className="text-black dark:text-white inline-flex gap-1">You have owned <MdStars className="text-xl text-[#D92979]" /> {stars} </span>}</p>
                            {(() => {
                                if (createMediaPrice) {
                                    return (
                                        <p>
                                            {language === "ko" ? 
                                                <span className="text-black dark:text-white inline-flex gap-1">
                                                    필요한 별 <MdStars className="text-xl text-[#D92979]" /> {createMediaPrice} 
                                                </span>
                                            : 
                                            <span className="text-black dark:text-white inline-flex gap-1">
                                                Required stars <MdStars className="text-xl text-[#D92979]" /> {createMediaPrice} 
                                            </span>
                                        }
                                    </p>
                                    )
                                 }
                                return (
                                    <p>
                                        {language === "ko" ? 
                                            <span className="text-black dark:text-white inline-flex gap-1">
                                                필요한 별 <MdStars className="text-xl text-[#D92979]" /> {price} 
                                            </span>
                                            : 
                                            <span className="text-black dark:text-white inline-flex gap-1">
                                                Required stars <MdStars className="text-xl text-[#D92979]" /> {price} 
                                            </span>
                                        }
                                    </p>
                                );
                            })()}
                        </div>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex !justify-center">
                    <div className="flex flex-row justify-center items-center gap-2 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowNotEnoughStarsModal(false);
                                router.push('/stars');
                            }}
                            className="bg-black hover:bg-[#D92979]/50 text-white border"
                        >
                            <MdStars className="text-xl text-[#D92979]" />
                            {phrase(dictionary, "buyStars", language)}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setShowNotEnoughStarsModal(false)}
                        >
                            {phrase(dictionary, "cancel", language)}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default NotEnoughStarsDialog;