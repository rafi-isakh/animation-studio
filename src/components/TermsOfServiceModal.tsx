import { useState } from 'react';
import { CircularProgress, FormControlLabel, Checkbox } from '@mui/material';
import { Dialog, DialogFooter, DialogHeader, DialogContent, DialogTitle, DialogDescription } from '@/components/shadcnUI/Dialog';
import { Button } from '@/components/shadcnUI/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';
import { replaceSmartQuotes } from '@/utils/font';
import { WebnovelTerms, WebnovelTerms_en } from '@/utils/terms';
import { cn } from '@/lib/utils';
import { WarningModal } from './AddWebnovelComponent';

interface TermsOfServiceModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: () => Promise<void>;
    isSubmitting: boolean;
}

const TermsOfServiceModal = ({
    open,
    onClose,
    onSubmit,
    isSubmitting,
}: TermsOfServiceModalProps) => {
    const [agreementOne, setAgreementOne] = useState(false);
    const [agreementTwo, setAgreementTwo] = useState(false);
    const [openWarningModal, setOpenWarningModal] = useState(false);
    const { dictionary, language } = useLanguage();

    const handleSubmit = async () => {
        if (!agreementOne || !agreementTwo) {
            setOpenWarningModal(true);
            return;
        }
        await onSubmit();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="z-[2500] !gap-0 !p-0 overflow-hidden bg-white dark:bg-[#211F21] border-none shadow-none md:h-auto h-screen text-md" showCloseButton={true}>
                <DialogHeader className='flex w-full text-md p-4'>
                    <DialogTitle className='text-md font-bold text-black dark:text-white'>
                        <p>{phrase(dictionary, "guideToRegisteringYourWork", language)}</p>
                    </DialogTitle>
                </DialogHeader>
                <div className='flex flex-col space-y-4 text-md p-4'>
                    {/* Terms content */}
                    <div className="flex flex-col">
                        <div className="max-h-[400px] overflow-y-auto p-4 bg-gray-50 rounded-lg text-md">
                            <p className="whitespace-pre-line leading-6 text-gray-700">
                                {/* Terms content */}
                                {language === "en" ? replaceSmartQuotes(WebnovelTerms_en) : replaceSmartQuotes(WebnovelTerms)}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col dark:text-black text-black p-4 text-md">
                        <FormControlLabel
                            required
                            // sx={{ '& .MuiFormControlLabel-label': { fontSize: '16px' } }}
                            className='text-black dark:text-white text-md'
                            control={
                                <Checkbox
                                    required
                                    checked={agreementOne}
                                    onChange={(e) => setAgreementOne(e.target.checked)}
                                    sx={{
                                        color: '#db2777',
                                        '&.Mui-checked': {
                                            color: '#db2777',
                                        }
                                    }}
                                />
                            }
                            label={phrase(dictionary, 'agree_writing_terms', language)}
                        />
                        <FormControlLabel
                            required
                            // sx={{ '& .MuiFormControlLabel-label': { fontSize: '16px' } }}
                            className='text-black dark:text-white text-md'
                            control={
                                <Checkbox
                                    required
                                    checked={agreementTwo}
                                    onChange={(e) => setAgreementTwo(e.target.checked)}
                                    sx={{
                                        color: '#db2777',
                                        '&.Mui-checked': {
                                            color: '#db2777',
                                        }
                                    }}
                                />
                            }
                            label={phrase(dictionary, 'agree_writing_terms_2', language)}
                        />
                    </div>
                </div>
                <DialogFooter className='flex flex-row !space-x-0 !p-0 !flex-grow-0 !flex-shrink-0 w-full self-end text-md'>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={cn("!rounded-none flex-1 w-full py-6 text-md font-medium bg-[#DE2B74] hover:bg-[#DE2B74] text-white")}
                    >
                        {isSubmitting ?
                            <CircularProgress size="1rem" color='secondary' />
                            : phrase(dictionary, "confirm", language)}
                    </Button>
                    <Button
                        onClick={onClose}
                        className={cn("!rounded-none flex-1 w-full py-6 text-md font-medium bg-[#b8c1d1] hover:bg-[#a9b2c2] text-white")}
                    >
                        {phrase(dictionary, "cancel", language)}
                    </Button>
                </DialogFooter>
            </DialogContent>
            {/* modal for input all info */}
            <WarningModal
                mode='agreeToTerms'
                dictionary={dictionary}
                language={language}
                open={openWarningModal}
                onOpenChange={setOpenWarningModal}
            />
        </Dialog>
    );
};

export default TermsOfServiceModal;