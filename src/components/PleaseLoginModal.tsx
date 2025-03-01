"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/shadcnUI/Dialog";
import { Button } from "@/components/shadcnUI/Button";
import { DialogProps } from "@mui/material";
import { phrase } from "@/utils/phrases";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";


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
                className="md:max-w-md select-none no-scrollbar bg-white dark:bg-[#211F21]"
                onClick={(e) => e.stopPropagation()}
                showCloseButton={true}
            >
                <DialogHeader>
                    <DialogTitle>
                        {phrase(dictionary, "pleaseLogin", language)}
                    </DialogTitle>
                </DialogHeader>
                <DialogFooter className="flex flex-row space-x-4 justify-end">
                    <Button variant="outline" className="text-white bg-[#DE2B74]" onClick={() => router.push('/signin')}>
                        {phrase(dictionary, "ok", language)}
                    </Button>
                    <Button variant="outline" color="gray" onClick={() => setOpen(false)}>
                        {phrase(dictionary, "cancel", language)}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}