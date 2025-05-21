import { useState } from 'react';
import { CircularProgress, FormControlLabel, Checkbox } from '@mui/material';
import { Dialog, DialogFooter, DialogHeader, DialogContent, DialogTitle, DialogDescription } from '@/components/shadcnUI/Dialog';
import { Button } from '@/components/shadcnUI/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';
import { replaceSmartQuotes } from '@/utils/font';
import { WebnovelTerms, WebnovelTerms_en } from '@/utils/terms';
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { MoveLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
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
    const [isFieldValidationModalOpen, setIsFieldValidationModalOpen] = useState(false);
    const { dictionary, language } = useLanguage();

    const handleSubmit = async () => {
        if (!agreementOne || !agreementTwo) {
            setIsFieldValidationModalOpen(true);
            // alert(phrase(dictionary, "pleaseAgreeToTerms", language));
            return;
        }
        await onSubmit();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="z-[2500] !gap-0 !p-0 overflow-hidden bg-white dark:bg-[#211F21] border-none shadow-none md:h-auto h-screen" showCloseButton={true}>
                <DialogHeader className='flex flex-row justify-start items-center w-full p-4'>
                    <DialogTitle className='text-lg font-bold text-black dark:text-white text-start'>
                        <p className=''>{phrase(dictionary, "guideToRegisteringYourWork", language)}</p>
                    </DialogTitle>
                </DialogHeader>
                <div className='flex flex-col space-y-4 text-xs justify-between'>
                    <div className="flex flex-col">
                        <div className="max-h-[400px] overflow-y-auto p-4 bg-gray-50 rounded-lg text-sm">
                            <p className="whitespace-pre-line leading-6 text-gray-700">
                                {/* Terms content */}
                                {language === "en" ? replaceSmartQuotes(WebnovelTerms_en) : replaceSmartQuotes(WebnovelTerms)}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col dark:text-black text-black p-4">
                        <FormControlLabel
                            required
                            sx={{ '& .MuiFormControlLabel-label': { fontSize: '12px' } }}
                            className='text-black dark:text-white'
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
                            sx={{ '& .MuiFormControlLabel-label': { fontSize: '12px' } }}
                            className='text-black dark:text-white'
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
                    <DialogFooter className='flex flex-row !space-x-0 !p-0 !flex-grow-0 !flex-shrink-0 w-full self-end'>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className={cn("!rounded-none flex-1 w-full py-6 text-lg font-medium bg-[#DE2B74] hover:bg-[#DE2B74] text-white")}
                        >
                            {isSubmitting ?
                                <CircularProgress size="1rem" color='secondary' />
                                : phrase(dictionary, "confirm", language)}
                        </Button>
                        <Button
                            onClick={onClose}
                            className={cn("!rounded-none flex-1 w-full py-6 text-lg font-medium bg-[#b8c1d1] hover:bg-[#a9b2c2] text-white")}
                        >
                            {phrase(dictionary, "cancel", language)}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
            {/* modal for warning : input all info */}
            <Dialog open={isFieldValidationModalOpen} onOpenChange={setIsFieldValidationModalOpen}>
                <DialogContent className='z-[2600] !gap-0 !p-0 overflow-hidden  bg-white dark:bg-[#211F21] border-none shadow-none md:h-auto h-screen' showCloseButton={true}>
                    <div className="flex flex-col justify-center items-center p-4">
                        <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
                        <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400 text-center ">
                            {phrase(dictionary, "pleaseAgreeToTerms", language)}
                        </h3>
                    </div>
                    <DialogFooter className='flex flex-row !space-x-0 !p-0 !flex-grow-0 !flex-shrink-0 w-full self-end'>
                        <Button
                            onClick={() => setIsFieldValidationModalOpen(false)}
                            className={cn("!rounded-none flex-1 w-full py-6 text-lg font-medium bg-[#b8c1d1] hover:bg-[#a9b2c2] text-white")}
                        >
                            {phrase(dictionary, "ok", language)}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
};

export default TermsOfServiceModal;