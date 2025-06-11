import { phrase } from "@/utils/phrases";
import { Button } from "@/components/shadcnUI/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/shadcnUI/Dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/shadcnUI/Tooltip";
import { SetStateAction, Dispatch, useState } from "react";
import { UserStripped } from "../Types";
import { useLanguage } from "@/contexts/LanguageContext";
import { Ban } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BlockButton({ user, setRefreshBlockedUsers }: { user: UserStripped, setRefreshBlockedUsers: Dispatch<SetStateAction<boolean>> }) {
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [showBlockSuccessModal, setShowBlockSuccessModal] = useState(false);
    const { language, dictionary } = useLanguage();

    const handleBlock = async () => {
        const response = await fetch('/api/block_user?id=' + user.id);
        if (response.ok) {
            setShowBlockModal(false);
            setShowBlockSuccessModal(true);
            setRefreshBlockedUsers(prev => !prev);
        }
    }

    return (
        <>
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="!no-underline rounded-full" onClick={() => setShowBlockModal(true)}>
                            <Ban className='cursor-pointer' size={20} />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {phrase(dictionary, "block", language)}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <Dialog open={showBlockModal} onOpenChange={setShowBlockModal}>
                <DialogContent className='z-[2500] !gap-0 !p-0 overflow-hidden bg-white dark:bg-[#211F21] border-none shadow-none md:h-auto h-auto text-md' showCloseButton={true} >
                    <DialogHeader className='text-md p-4'>
                        <DialogTitle className='text-md text-center'>{phrase(dictionary, "block", language)}</DialogTitle>
                    </DialogHeader>
                    <DialogDescription className='text-md pb-4 text-center'>
                        {phrase(dictionary, "wouldYouLikeToBlock", language)}
                    </DialogDescription>
                    <DialogFooter className='flex flex-row !space-x-0 !p-0 !flex-grow-0 !flex-shrink-0 w-full self-end text-md'>
                        <Button
                            onClick={handleBlock}
                            className={cn("!rounded-none flex-1 w-full py-6 text-md font-medium bg-[#DE2B74] hover:bg-[#DE2B74] text-white")}
                        >
                            {phrase(dictionary, "block", language)}</Button>
                        <Button
                            onClick={() => setShowBlockModal(false)}
                            className={cn("!rounded-none flex-1 w-full py-6 text-md font-medium bg-[#b8c1d1] hover:bg-[#a9b2c2] text-white")}
                        >
                            {phrase(dictionary, "cancel", language)}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={showBlockSuccessModal} onOpenChange={setShowBlockSuccessModal}>
                <DialogContent className='z-[2500] !gap-0 !p-0 overflow-hidden bg-white dark:bg-[#211F21] border-none shadow-none md:h-auto h-auto text-md' showCloseButton={true} >
                    <div className='flex flex-col space-y-4 items-center justify-center'>
                        <p className='text-lg font-bold'>{phrase(dictionary, "blockSuccess", language)}</p>
                    </div>
                    <DialogFooter className='flex flex-row !space-x-0 !p-0 !flex-grow-0 !flex-shrink-0 w-full self-end text-md'>
                        <Button
                            onClick={() => setShowBlockSuccessModal(false)}
                            className={cn("!rounded-none flex-1 w-full py-6 text-md font-medium bg-[#DE2B74] hover:bg-[#DE2B74] text-white")}
                        >
                            {phrase(dictionary, "close", language)}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}