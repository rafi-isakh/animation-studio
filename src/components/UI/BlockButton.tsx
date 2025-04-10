import { phrase } from "@/utils/phrases";
import { Button } from "@/components/shadcnUI/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/shadcnUI/Dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/shadcnUI/Tooltip";
import { SetStateAction, Dispatch, useState } from "react";
import { UserStripped } from "../Types";
import { useLanguage } from "@/contexts/LanguageContext";
import { UserRoundX } from "lucide-react";

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
                        <Button color='gray' variant='outline' onClick={() => setShowBlockModal(true)} className='border-2 bg-white border-gray-300 rounded-sm px-4 py-2 w-16 flex flex-row justify-center items-center gap-1'>
                            <UserRoundX size={10} />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {phrase(dictionary, "block", language)}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <Dialog open={showBlockModal} onOpenChange={setShowBlockModal}>
                <DialogContent showCloseButton={true} className="bg-white dark:bg-[#211F21]">
                    <DialogHeader>
                        <DialogTitle>{phrase(dictionary, "block", language)}</DialogTitle>
                    </DialogHeader>
                    <DialogDescription>
                        {phrase(dictionary, "wouldYouLikeToBlock", language)}
                    </DialogDescription>
                    <DialogFooter  className='flex flex-row justify-center items-center gap-4'>
                        <Button variant='outline' className='' onClick={handleBlock}>{phrase(dictionary, "block", language)}</Button>
                        <Button color='destructive' variant='outline' className='bg-[#DE2B74] text-white' onClick={() => setShowBlockModal(false)}>{phrase(dictionary, "cancel", language)}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={showBlockSuccessModal} onOpenChange={setShowBlockSuccessModal}>
                <DialogContent showCloseButton={true} className="bg-white dark:bg-[#211F21]">
                    <div className='flex flex-col space-y-4 items-center justify-center'>
                        <p className='text-lg font-bold'>{phrase(dictionary, "blockSuccess", language)}</p>
                    </div>
                    <DialogFooter className='flex flex-row !justify-center !items-center gap-4'>
                        <Button variant='outline' className='bg-[#DE2B74] text-white' onClick={() => setShowBlockSuccessModal(false)}>{phrase(dictionary, "close", language)}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}