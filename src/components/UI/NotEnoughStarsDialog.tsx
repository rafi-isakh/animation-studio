'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/shadcnUI/Dialog";
import { Button } from "@/components/shadcnUI/Button";
import { MdStars } from "react-icons/md";
import { useRouter } from "next/navigation";
import { phrase } from "@/utils/phrases";
import { useLanguage } from "@/contexts/LanguageContext";
import { Webnovel } from "@/components/Types";
import { cn } from "@/lib/utils";

{/* Not Enough Stars Modal */ }
const NotEnoughStarsDialog = ({ showNotEnoughStarsModal, setShowNotEnoughStarsModal, stars, content, createMediaPrice }: { showNotEnoughStarsModal: boolean, setShowNotEnoughStarsModal: (showNotEnoughStarsModal: boolean) => void, stars: number, content?: Webnovel, createMediaPrice?: number }) => {
    const router = useRouter();
    const { dictionary, language } = useLanguage();

    const price = language === "ko"
        ? content?.price_korean
        : (content?.price_english ?? "Price not available"); // Fallback for undefined price_english

    return (
        <Dialog open={showNotEnoughStarsModal} onOpenChange={setShowNotEnoughStarsModal}>
            <DialogContent className='z-[2500] !gap-0 !p-0 overflow-hidden bg-white dark:bg-[#211F21] border-none shadow-none md:h-auto h-auto text-md' showCloseButton={true}>
                <DialogHeader className='text-md p-4'>
                    <DialogTitle className="text-md font-bold text-center">
                        <p>{phrase(dictionary, "notEnoughStars", language)}</p>
                    </DialogTitle>
                    <DialogDescription className="flex flex-col justify-center items-center text-md">
                        <p className='text-md text-gray-500 py-2 break-keep'>{phrase(dictionary, "notEnoughStarsDescription", language)}</p>
                        <div className="flex flex-col items-center gap-2 mt-2">
                            <p>{language === "ko"
                             ? <span className="text-black dark:text-white inline-flex gap-1">보유한 별 <MdStars className="text-xl text-[#D92979]" /> {stars} </span>
                             : <span className="text-black dark:text-white inline-flex gap-1">You have owned <MdStars className="text-xl text-[#D92979]" /> {stars} </span>}</p>
                            {(() => {
                                if (createMediaPrice) {
                                    return (
                                        <p>
                                            {language === "ko" ?
                                                <span className="text-md text-black dark:text-white inline-flex gap-1">
                                                    필요한 별 <MdStars className="text-xl text-[#D92979]" /> {createMediaPrice}
                                                </span>
                                                :
                                                <span className="text-md text-black dark:text-white inline-flex gap-1">
                                                    Required stars <MdStars className="text-xl text-[#D92979]" /> {createMediaPrice}
                                                </span>
                                            }
                                        </p>
                                    )
                                }
                                return (
                                    <p>
                                        {language === "ko" ?
                                            <span className="text-md text-black dark:text-white inline-flex gap-1">
                                                필요한 별 <MdStars className="text-xl text-[#D92979]" /> {price}
                                            </span>
                                            :
                                            <span className="text-md text-black dark:text-white inline-flex gap-1">
                                                Required stars <MdStars className="text-xl text-[#D92979]" /> {price}
                                            </span>
                                        }
                                    </p>
                                );
                            })()}
                        </div>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className='flex flex-row !space-x-0 !p-0 !flex-grow-0 !flex-shrink-0 w-full self-end text-md'>
                    <Button
                        onClick={() => {setShowNotEnoughStarsModal(false); router.push('/stars');}}
                        className={cn("!rounded-none flex-1 w-full py-6 text-md font-medium bg-[#DE2B74] hover:bg-[#DE2B74] text-white")}
                    >
                        <MdStars className="text-xl text-white" />
                        {phrase(dictionary, "buyStars", language)}
                    </Button>
                    <Button
                        onClick={() => setShowNotEnoughStarsModal(false)}
                        className={cn("!rounded-none flex-1 w-full py-6 text-md font-medium bg-[#b8c1d1] hover:bg-[#a9b2c2] text-white")}
                    >
                        {phrase(dictionary, "cancel", language)}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default NotEnoughStarsDialog;