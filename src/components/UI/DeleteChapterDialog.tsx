import { Button } from "@/components/shadcnUI/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/shadcnUI/Dialog";
import { Dictionary, Language } from "@/components/Types";
import { phrase } from '@/utils/phrases';
import { cn } from "@/lib/utils";

export const DeleteChapterDialog = ({ 
    language, 
    dictionary, 
    showDeleteModal, 
    setShowDeleteModal, 
    deleteChapterId, 
    handleChapterDelete 
}: { 
    language: Language, 
    dictionary: Dictionary, 
    showDeleteModal: boolean, 
    setShowDeleteModal: (showDeleteModal: boolean) => void, 
    deleteChapterId: number | null, 
    handleChapterDelete: (chapterId: number) => void 
}) => {
    return (
        <Dialog open={showDeleteModal} onOpenChange={() => setShowDeleteModal(false)}>
            <DialogContent className='z-[2500] !gap-0 !p-0 overflow-hidden bg-white dark:bg-[#211F21] border-none shadow-none md:h-auto h-auto' showCloseButton={true}>
                <DialogHeader className='p-4'>
                    <DialogTitle>{phrase(dictionary, "deleteChapterConfirm", language)}</DialogTitle>
                    <DialogDescription className='py-4'>
                        <p>{phrase(dictionary, "deleteChapterConfirmDescription", language)}</p>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className='flex flex-row !space-x-0 !p-0 !flex-grow-0 !flex-shrink-0 w-full self-end'>
                    <Button
                        onClick={() => handleChapterDelete(deleteChapterId as number)}
                        className={cn("!rounded-none flex-1 w-full py-6 text-lg font-medium bg-[#DE2B74] hover:bg-[#DE2B74] text-white")}
                    >
                        {phrase(dictionary, "yes", language)}
                    </Button>
                    <Button
                        onClick={() => setShowDeleteModal(false)}
                        className={cn("!rounded-none flex-1 w-full py-6 text-lg font-medium bg-[#b8c1d1] hover:bg-[#a9b2c2] text-white")}
                    >
                        {phrase(dictionary, "no", language)}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 

export default DeleteChapterDialog;