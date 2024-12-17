import { Modal, Box, Button, CircularProgress, FormControlLabel, Checkbox } from '@mui/material';
import { useWebnovelSubmitModalStyle } from '@/styles/ModalStyles';
import { phrase } from '@/utils/phrases';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

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

    const { dictionary, language } = useLanguage();

    const handleSubmit = async () => {
        if (!agreementOne || !agreementTwo) {
            alert(phrase(dictionary, "pleaseAgreeToTerms", language));
            return;
        }
        await onSubmit();
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={useWebnovelSubmitModalStyle}>
                <div className='flex flex-col space-y-4 text-[12px]'>
                    <h3 className="mb-5 text-lg font-normal text-black dark:text-black">
                        {phrase(dictionary, "guideToRegisteringYourWork", language)}
                    </h3>
                    
                    {/* Terms content */}
                    <div className="flex flex-col space-y-4">
                                        
                    <p className='text-sm text-black font-bold'>
                    {/* 1. Toonyz 커뮤니티 규칙 */}
                    {phrase(dictionary, "toonyzCommunityRules", language)}
                   </p>

                     <p>{phrase(dictionary, "anySerializedArticles", language)}</p>
                                        <ul className='list-none list-inside flex flex-col gap-1'>
                                            <li>{phrase(dictionary, "contentInfringesUponCopyrights", language)}</li>
                                            <li>{phrase(dictionary, "contentIncludesSensitivePersonalInformation", language)}</li>
                                            <li>{phrase(dictionary, "contentDefamesIndividualsOrGroups", language)}</li>
                                            <li>{phrase(dictionary, "contentIsAntiSocialAndHarmsPublicOrder", language)}</li>
                                            <li>{phrase(dictionary, "contentWrittenOnlyForCommercialGain", language)}</li>
                                            <li>{phrase(dictionary, "contentContainingRepetitivePhrases", language)}</li>
                                            <li>{phrase(dictionary, "contentDirectlyMentionsOrInducesUsersToOtherSites", language)}</li>
                                            <li>{phrase(dictionary, "titlesImplyOrIncludeAnyOfTheAbove", language)}</li>
                                        </ul>
                                    
                                        <p>{phrase(dictionary, "allResponsibilityForSeries", language)}</p>
                                     

                                        <p className='text-sm text-black font-bold'>
                                             {/* 2. Cover Terms and Conditions    */}
                                             {phrase(dictionary, "coverTermsAndConditions", language)}
                                        </p>    

                                        <p>{phrase(dictionary, "followingCoversAreProhibited", language)}</p>
                                        <ul className='list-none list-inside flex flex-col gap-1'>
                                            <li>{phrase(dictionary, "coversThatIncludeAnyOfTheFollowing", language)}:
                                                <ul className='list-none list-inside flex flex-col gap-1 pl-4'>
                                                    <li>{phrase(dictionary, "violence", language)}</li>
                                                    <li>{phrase(dictionary, "sexualContent", language)}</li>
                                                    <li>{phrase(dictionary, "hateSpeech", language)}</li>
                                                    <li>{phrase(dictionary, "anyContentThatIsNotSafeForAllAges", language)}</li>
                                                </ul>
                                            </li>
                                            <li>{phrase(dictionary, "coversWhoseCopyrightBelongsToAnotherPerson", language)}</li>
                                            <li>{phrase(dictionary, "coversThatAreInappropriateForMinorsUnderTheAgeOf18", language)}</li>
                                            <li>{phrase(dictionary, "coversThatDefameIndividualsOrGroups", language)}</li>
                                            <li>{phrase(dictionary, "coversThatDoNotAccuratelyAndClearlyIndicateTheCopyrightOrSource", language)}</li>
                                            <li>{phrase(dictionary, "coversThatInfringeUponThePortraitRightsOfOthers", language)}</li>
                                          
                                        </ul>
                                    
                                        <p>{phrase(dictionary, "coversOrImagesMayBeSubjectToSanctions", language)}</p>
                                     


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
    );
};

export default TermsOfServiceModal;