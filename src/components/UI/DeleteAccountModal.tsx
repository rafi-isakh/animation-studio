'use client'
import React from 'react';
import { Button } from "@/components/shadcnUI/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/shadcnUI/Dialog";
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/shadcnUI/Textarea';
import { RadioGroup, RadioGroupItem } from '@/components/shadcnUI/RadioGroup';
import { Label } from '@/components/shadcnUI/Label';
import { Loader2 } from 'lucide-react';

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    deleteAccountReason: string;
    setDeleteAccountReason: (deleteAccountReason: string) => void;
    deleteAccountReasonType: string;
    setDeleteAccountReasonType: (deleteAccountReasonType: string) => void;
    isLoading: boolean;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    deleteAccountReason,
    setDeleteAccountReason,
    deleteAccountReasonType,
    setDeleteAccountReasonType,
    isLoading
}) => {
    const { language, dictionary } = useLanguage();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className='z-[2500] !gap-0 !p-0 overflow-hidden bg-white dark:bg-[#211F21] border-none shadow-none md:h-auto h-auto text-md' showCloseButton={true}>
                <DialogHeader className='text-md p-4'>
                    <DialogTitle className='text-md text-center'>
                        <p>{phrase(dictionary, "deleteAccountConfirm", language)}</p>
                    </DialogTitle>
                </DialogHeader>
                <DialogDescription className='flex flex-col items-center justify-center gap-4 p-4 text-md'>
                    <p className='text-md text-gray-500'>{phrase(dictionary, "deleteAccountReason", language)}</p>
                    <div className="flex flex-col gap-2 mt-2 w-full">
                        <RadioGroup
                            onValueChange={async (value: string) => {
                                try {
                                    setDeleteAccountReasonType(value);
                                } catch (error) {
                                    console.error("Error setting delete account reason type:", error);
                                }
                            }}
                            defaultValue={deleteAccountReasonType}
                            className="text-[#DB2777]"
                        >
                            <div className="flex items-center gap-2">
                                <RadioGroupItem
                                    value={phrase(dictionary, "deleteAccountReasonType_1", language)}
                                    id="forDeleteAccountReasonType_1"
                                    className="border-gray-300 data-[state=checked]:bg-[#DB2777] data-[state=checked]:text-white"
                                />
                                <Label htmlFor="forDeleteAccountReasonType_1" className="text-md text-gray-500">
                                    {phrase(dictionary, "deleteAccountReasonType_1", language)}
                                </Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <RadioGroupItem
                                    value={phrase(dictionary, "deleteAccountReasonType_2", language)}
                                    id="forDeleteAccountReasonType_2"
                                    className="border-gray-300 data-[state=checked]:bg-[#DB2777] data-[state=checked]:text-white"
                                />
                                <Label htmlFor="forDeleteAccountReasonType_2" className="text-md text-gray-500">
                                    {phrase(dictionary, "deleteAccountReasonType_2", language)}
                                </Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <RadioGroupItem
                                    value={phrase(dictionary, "deleteAccountReasonType_3", language)}
                                    id="forDeleteAccountReasonType_3"
                                    className="border-gray-300 data-[state=checked]:bg-[#DB2777] data-[state=checked]:text-white"
                                />
                                <Label htmlFor="forDeleteAccountReasonType_3" className="text-md text-gray-500">
                                    {phrase(dictionary, "deleteAccountReasonType_3", language)}
                                </Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <RadioGroupItem
                                    value={phrase(dictionary, "deleteAccountReasonType_4", language)}
                                    id="forDeleteAccountReasonType_4"
                                    className="border-gray-300 data-[state=checked]:bg-[#DB2777] data-[state=checked]:text-white"
                                />
                                <Label htmlFor="forDeleteAccountReasonType_4" className="text-md text-gray-500">
                                    {phrase(dictionary, "deleteAccountReasonType_4", language)}
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <Textarea
                        rows={4}
                        className='w-full p-4'
                        value={deleteAccountReason}
                        onChange={(e) => setDeleteAccountReason(e.target.value)}
                        placeholder={phrase(dictionary, "deleteAccountReason_subtitle", language)}
                    />
                </DialogDescription>
                <DialogFooter className='flex flex-row !space-x-0 !p-0 !flex-grow-0 !flex-shrink-0 w-full self-end text-md'>
                    <Button
                        onClick={onConfirm}
                        className={cn("!rounded-none flex-1 w-full py-6 text-md font-medium bg-[#DE2B74] hover:bg-[#DE2B74] text-white")}
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : phrase(dictionary, "yes", language)}
                    </Button>
                    <Button
                        onClick={onClose}
                        className={cn("!rounded-none flex-1 w-full py-6 text-md font-medium bg-[#b8c1d1] hover:bg-[#a9b2c2] text-white")}
                    >
                        {phrase(dictionary, "no", language)}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DeleteAccountModal;