import { Modal, Box, Button, CircularProgress, FormControlLabel, Checkbox, ThemeProvider, Typography } from '@mui/material';
import { useModalStyle, useWebnovelSubmitModalStyle } from '@/styles/ModalStyles';
import { phrase } from '@/utils/phrases';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { replaceSmartQuotes } from '@/utils/font';
import { WebnovelTerms, WebnovelTerms_en } from '@/utils/terms';
import { HiOutlineExclamationCircle } from "react-icons/hi";

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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { dictionary, language } = useLanguage();

    const handleSubmit = async () => {
        if (!agreementOne || !agreementTwo) {
            setIsModalOpen(true);
            // alert(phrase(dictionary, "pleaseAgreeToTerms", language));
            return;
        }
        await onSubmit();
    };

    return (
        <>
        <Modal open={open} onClose={onClose}>
            <Box sx={useWebnovelSubmitModalStyle}>
                <div className='flex flex-col space-y-4 text-[12px]'>
                    <h3 className="text-lg font-normal text-black dark:text-black">
                        {phrase(dictionary, "guideToRegisteringYourWork", language)}
                    </h3>
                    
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

                    <div className="flex flex-row justify-center gap-4">
                        <Button 
                            color='gray' 
                            variant='outlined' 
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 
                                <CircularProgress size="1rem" color='secondary' /> 
                                : phrase(dictionary, "confirm", language)}
                        </Button>
                        <Button 
                            color='gray' 
                            variant='outlined' 
                            onClick={onClose}
                        >
                            {phrase(dictionary, "cancel", language)}
                        </Button>
                    </div>
                </div>
            </Box>
        </Modal>

         {/* modal for input all info */}
         <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <Box sx={useModalStyle}>
                <Typography className="text-center">
                    <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
                    <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                          {phrase(dictionary, "pleaseAgreeToTerms", language)}
                    </h3>
                    <div className="flex justify-center gap-4">
            
                        <Button color='gray' variant='outlined' onClick={() => setIsModalOpen(false)}>
                            {phrase(dictionary, "ok", language)}
                        </Button>
                        
                    </div>
                </Typography>
            </Box>
        </Modal>

        </>
    );
};

export default TermsOfServiceModal;