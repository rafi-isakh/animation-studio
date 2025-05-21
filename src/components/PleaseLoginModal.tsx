"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/shadcnUI/Dialog";
import { Button } from "@/components/shadcnUI/Button";
import { DialogProps } from "@mui/material";
import { phrase } from "@/utils/phrases";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export default function PleaseLoginModal({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
    const { dictionary, language } = useLanguage();
    const router = useRouter();
    const handleClose: DialogProps["onClose"] = (event, reason) => {
        if (reason !== "backdropClick") {
            setOpen(false);
            router.push('/signin');
        }
    }
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
                className='z-[2500] !gap-0 !p-0 overflow-hidden bg-white dark:bg-[#211F21] border-none shadow-none md:h-auto h-auto select-none text-md'
                showCloseButton={true}
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <DialogHeader className='text-md p-4'>
                    <DialogTitle className='text-md'>
                        <p>{phrase(dictionary, "pleaseLogin", language)}</p>
                    </DialogTitle>
                    <DialogDescription className='text-md'>
                        <p> {phrase(dictionary, "pleaseLoginDescription", language)}</p>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className='flex flex-row !space-x-0 !p-0 !flex-grow-0 !flex-shrink-0 w-full self-end text-md'>
                    <Button
                        onClick={() => router.push('/signin')}
                        className={cn("!rounded-none flex-1 w-full py-6 text-md font-medium bg-[#DE2B74] hover:bg-[#DE2B74] text-white")}
                    >
                        {phrase(dictionary, "ok", language)}
                    </Button>
                    <Button
                        onClick={() => setOpen(false)}
                        className={cn("!rounded-none flex-1 w-full py-6 text-md font-medium bg-[#b8c1d1] hover:bg-[#a9b2c2] text-white")}
                    >
                        {phrase(dictionary, "cancel", language)}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}