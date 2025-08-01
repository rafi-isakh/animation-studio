'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/shadcnUI/Dialog";
import { Button } from "@/components/shadcnUI/Button";
import { BsFillTicketPerforatedFill } from "react-icons/bs";
import { useRouter } from "next/navigation";
import { phrase } from "@/utils/phrases";
import { useLanguage } from "@/contexts/LanguageContext";
import { Webnovel } from "@/components/Types";
import { cn } from "@/lib/utils";

{/* Not Enough Tickets Modal */ }
const NotEnoughTicketsDialog = ({ showNotEnoughTicketsModal, setShowNotEnoughTicketsModal, tickets, content, createMediaPrice }: { showNotEnoughTicketsModal: boolean, setShowNotEnoughTicketsModal: (showNotEnoughTicketsModal: boolean) => void, tickets: number, content?: Webnovel, createMediaPrice?: number }) => {
    const router = useRouter();
    const { dictionary, language } = useLanguage();

    const price = language === "ko"
        ? content?.price_korean
        : (content?.price_english ?? "Price not available"); // Fallback for undefined price_english

    return (
        <Dialog open={showNotEnoughTicketsModal} onOpenChange={setShowNotEnoughTicketsModal}>
            <DialogContent className='z-[2500] !gap-0 !p-0 overflow-hidden bg-white dark:bg-[#211F21] border-none shadow-none md:h-auto h-auto text-md' showCloseButton={true}>
                <DialogHeader className='text-md p-4'>
                    <DialogTitle className="text-md font-bold text-center">
                        <p>{phrase(dictionary, "notEnoughTickets", language)}</p>
                    </DialogTitle>
                    <DialogDescription className="flex flex-col justify-center items-center text-md">
                        <p className='text-md text-gray-500 py-2 break-keep'>{phrase(dictionary, "notEnoughTicketsDescription", language)}</p>
                        <div className="flex flex-col items-center gap-2 mt-2">
                            <p>{language === "ko"
                             ? <span className="text-black dark:text-white inline-flex gap-1">보유한 티켓 <BsFillTicketPerforatedFill className="text-xl text-[#D92979]" /> {tickets} </span>
                             : <span className="text-black dark:text-white inline-flex gap-1">You have <BsFillTicketPerforatedFill className="text-xl text-[#D92979]" /> {tickets} </span>}</p>
                            {(() => {
                                if (createMediaPrice) {
                                    return (
                                        <p>
                                            {language === "ko" ?
                                                <span className="text-md text-black dark:text-white inline-flex gap-1">
                                                    필요한 티켓 <BsFillTicketPerforatedFill className="text-xl text-[#D92979]" /> {createMediaPrice}
                                                </span>
                                                :
                                                <span className="text-md text-black dark:text-white inline-flex gap-1">
                                                    Required Tickets <BsFillTicketPerforatedFill className="text-xl text-[#D92979]" /> {createMediaPrice}
                                                </span>
                                            }
                                        </p>
                                    )
                                }
                                return (
                                    <p>
                                        {language === "ko" ?
                                            <span className="text-md text-black dark:text-white inline-flex gap-1">
                                                필요한 티켓 <BsFillTicketPerforatedFill className="text-xl text-[#D92979]" /> {price}
                                            </span>
                                            :
                                            <span className="text-md text-black dark:text-white inline-flex gap-1">
                                                Required Tickets <BsFillTicketPerforatedFill className="text-xl text-[#D92979]" /> {price}
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
                        onClick={() => {setShowNotEnoughTicketsModal(false); router.push('/Tickets');}}
                        className={cn("!rounded-none flex-1 w-full py-6 text-md font-medium bg-[#DE2B74] hover:bg-[#DE2B74] text-white")}
                    >
                        <BsFillTicketPerforatedFill className="text-xl text-white" />
                        {phrase(dictionary, "buyTickets", language)}
                    </Button>
                    <Button
                        onClick={() => setShowNotEnoughTicketsModal(false)}
                        className={cn("!rounded-none flex-1 w-full py-6 text-md font-medium bg-[#b8c1d1] hover:bg-[#a9b2c2] text-white")}
                    >
                        {phrase(dictionary, "cancel", language)}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default NotEnoughTicketsDialog;