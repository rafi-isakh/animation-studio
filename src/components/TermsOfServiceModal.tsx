import { useState } from 'react';
import { CircularProgress, FormControlLabel, Checkbox, Typography } from '@mui/material';
import { Dialog, DialogFooter, DialogHeader, DialogContent, DialogTitle, DialogDescription } from '@/components/shadcnUI/Dialog';
import { ScrollArea } from '@/components/shadcnUI/ScrollArea';
import { Button } from '@/components/shadcnUI/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';
import { replaceSmartQuotes } from '@/utils/font';
import { WebnovelTerms, WebnovelTerms_en } from '@/utils/terms';
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { MoveLeft } from 'lucide-react';

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
            <DialogContent className='bg-white dark:bg-black flex flex-col justify-center items-center w-full md:h-auto h-screen'>
                <DialogHeader className='flex flex-row justify-start items-center my-2 w-full'>
                    <Button
                        variant='link'
                        onClick={() => onClose()}
                        className={`!no-underline justify-center items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors flex md:hidden !m-0 !p-0`}>
                        <MoveLeft size={20} className='dark:text-white text-gray-500' />
                    </Button>
                    <DialogTitle className='text-lg font-bold text-black dark:text-white text-start'>
                        <p className='md:ml-0 ml-5'>{phrase(dictionary, "guideToRegisteringYourWork", language)}</p>
                    </DialogTitle>
                </DialogHeader>
                <div className='flex flex-col space-y-4 text-[12px]'>
                    {/* Terms content */}
                    <div className="flex flex-col">
                        <div className="max-h-[400px] overflow-y-auto p-4 bg-gray-50 rounded-lg text-sm">
                            <p className="whitespace-pre-line leading-6 text-gray-700">
                                {language === "en" ? replaceSmartQuotes(WebnovelTerms_en) : replaceSmartQuotes(WebnovelTerms)}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col dark:text-black text-black">
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
                    <DialogFooter className="flex flex-row justify-center items-center gap-4">
                        <Button
                            variant='outline'
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ?
                                <CircularProgress size="1rem" color='secondary' />
                                : phrase(dictionary, "confirm", language)}
                        </Button>
                        <Button
                            variant='outline'
                            onClick={onClose}
                        >
                            {phrase(dictionary, "cancel", language)}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
            {/* modal for input all info */}
            <Dialog open={isFieldValidationModalOpen} onOpenChange={setIsFieldValidationModalOpen}>
                <DialogContent className='bg-white dark:bg-black flex flex-col justify-center items-center'>
                    <Typography className="text-center">
                        <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
                        <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                            {phrase(dictionary, "pleaseAgreeToTerms", language)}
                        </h3>
                        <div className="flex justify-center gap-4">
                            <Button color='gray' variant='outline' onClick={() => setIsFieldValidationModalOpen(false)}>
                                {phrase(dictionary, "ok", language)}
                            </Button>
                        </div>
                    </Typography>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
};

export default TermsOfServiceModal;