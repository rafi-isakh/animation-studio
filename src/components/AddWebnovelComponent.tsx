"use client"

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation'
import { Webnovel } from '@/components//Types';
import { useUser } from '@/contexts/UserContext';
import AuthorAndWebnovelsAsideComponent from '@/components/AuthorAndWebnovelsAsideComponent';
import styles from "@/styles/KoreanText.module.css"
import '@/styles/globals.css'
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';
import Image from 'next/image'
import Link from 'next/link';
import { useModalStyle, useCoverArtModalStyle, useWebnovelSubmitModalStyle } from '@/styles/ModalStyles';
import { Button, 
         Modal, 
         Box, 
         Typography, 
         ThemeProvider, 
         CircularProgress, 
         styled, 
         FormControlLabel, 
         Checkbox 
        } from '@mui/material';
import { HiOutlineExclamationCircle } from "react-icons/hi";
import AIEditorCharactersComponent from './AIEditorCharactersComponent';
import { grayTheme, NoCapsButton } from '@/styles/BlackWhiteButtonStyle';
import { Info } from 'lucide-react';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import '@/styles/AddWebnovelComponent.css';
import TermsOfServiceModal from '@/components/TermsOfServiceModal';
import CoverArtModal from '@/components/CoverArtModal';
import CoverArtPreview from './CoverArtPreview';

const AddWebnovelComponent = ({ webnovels }: { webnovels: Webnovel[] }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [coverArt, setCoverArt] = useState<File | null>(null);
    const [coverArtPreview, setCoverArtPreview] = useState<string | null>(null);
    const [genre, setGenre] = useState('');
    const [novelLanguage, setNovelLanguage] = useState('');
    const buttonRef = useRef(null);
    const { email, nickname } = useUser();
    const { language, dictionary } = useLanguage();
    const router = useRouter();
    const [buttonSize, setButtonSize] = useState({ width: 'auto', height: 'auto' })
    const [currText, setCurrText] = useState(0);
    const [openModal, setOpenModal] = useState(false);
    const [showCoverArtModal, setShowCoverArtModal] = useState(false);
    const [showTermsOfServiceModal, setShowTermsOfServiceModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    

    useEffect(() => {
        setCurrText(description.length);
    }, [description])

    const trim = (text: string, max: number) => {
        text = text.substring(0, max)
        return text
    }

    useEffect(() => {
        if (buttonRef.current) {
            const { offsetWidth, offsetHeight } = buttonRef.current;
            setButtonSize({ width: offsetWidth, height: offsetHeight })
        }
    }, [language])

    const handleAddWebnovel = async (event: React.FormEvent) => {
        event.preventDefault();
        
        // Check if all required fields are filled
        if (!title || !description || !coverArt || !genre || !novelLanguage) {
            setOpenModal(true);
            return;
        }
    
        // Show terms of service modal for final confirmation
        setShowTermsOfServiceModal(true);
    };

    const handleFinalSubmit = async () => {

        setIsSubmitting(true);
        
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        if (coverArt) {
            formData.append('coverArt', coverArt)
        }
        formData.append('genre', genre);
        formData.append('language', novelLanguage);
    
        try {
            const res = await fetch('/api/add_webnovel', {
                method: 'POST',
                body: formData,
            });
    
            if (!res.ok) {
                throw new Error("Add webnovel failed");
            }
            const data = await res.json();
            router.push(`/view_webnovels?id=${data["id"]}`);
        } catch (error) {
            // Handle error
            setIsSubmitting(false);
            // Optionally show error message
        }
    };

    const setCoverArtFile = (file: File) => {
        setCoverArt(file);
        setCoverArtPreview(URL.createObjectURL(file));
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setCoverArtFile(file);
        }
    };

    const handleChangeGenre = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setGenre(e.target.value);
    }

    const handleChangeLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setNovelLanguage(e.target.value);
    }

    const handleCoverArtUpload = () => {
        document.getElementById('coverArtFile')?.click();
    }

    const handleCoverArtUploadModal = (e: React.MouseEvent) => {
        e.preventDefault();
        setShowCoverArtModal(true);
    }

    const InfoTooltip = styled(({ className, ...props }: TooltipProps) => (
        <Tooltip {...props} classes={{ popper: className }} />
      ))(({ theme }) => ({
        [`& .${tooltipClasses.tooltip}`]: {
          backgroundColor: '#f5f5f9',
          color: 'rgba(0, 0, 0, 0.87)',
          maxWidth: 320,
          padding: '5px',
          fontSize: theme.typography.pxToRem(12),
          border: '1px solid #dadde9',
        },
      }));

    

    return (
        <div className='md:w-[720px] md:p-6 p-1 w-full flex md:flex-row flex-col justify-center mx-auto'>
            <div className='flex flex-col border border-gray-300 rounded-xl p-2 md:p-4 md:px-10 md:w-[1200px]'>
                <form onSubmit={handleAddWebnovel}>
                  <p className={`text-2xl mt-2 mb-4 font-bold ${styles.korean}`}>{phrase(dictionary, "uploadNewWebnovel", language)}</p>

                      <div className="mt-10 md:w-[500px] w-full">
                         <>
                            <label htmlFor="author" className='text-sm ml-2'>
                             <div className='flex flex-row gap-1 items-center'>
                                {/* 커버등록 */}
                                {phrase(dictionary, "uploadCoverArt", language)}
                                <span className='text-red-500'>*</span>
                                <span className='text-gray-500 text-[12px]'>
                                    {/* 작품의 표지를 등록해 주세요. */}
                                    {language == 'ko' ? <> {phrase(dictionary, "uploadCoverArtDescription", language)}</> : ''}
                                </span>
                                <InfoTooltip
                                    title={
                                    <div className='flex flex-col gap-2 space-y-2'>
                                        <p className='text-sm font-bold'>
                                            {phrase(dictionary, "coverArtMustBeInA53AspectRatio", language)}
                                        </p>
                                        <p className='text-sm'>
                                            {phrase(dictionary, "coverArtSize", language)}
                                        </p>
                                    </div>
                                    }
                                    >
                                    <Link href="" className='p-0'><Info size={12}/></Link> 
                                </InfoTooltip>
                             </div>
                            </label>
                            <div className='flex flex-col gap-2 mt-2'>
                                <CoverArtPreview coverArt={coverArt} handleCoverArtUploadModal={handleCoverArtUploadModal}/>
                                <Button 
                                    sx={{
                                        backgroundColor: '#DB2777',
                                        color: 'white',
                                        width: '200px',
                                        borderStyle: 'solid',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        fontSize: '12px',
                                    }}
                                    onClick={handleCoverArtUploadModal}
                                    variant='outlined' 
                                    color='gray' 
                                    className='bg-[#DB2777] dark:bg-white dark:text-black md:self-start self-center'>
                                {/* Upload Cover Art */}
                                {phrase(dictionary, "uploadCoverArt", language)}
                                </Button>
                            </div>
                            </>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id='coverArtFile'
                                onChange={handleFileChange}
                            />
                        </div>

                    <div className="flex flex-col md:flex-row md:space-x-4 items-center md:items-start">
                        <div className="md:mr-4 md:mt-4 w-full">
                            
                            <div className="flex flex-col mt-4">
                            <label htmlFor="title" className='text-sm ml-2'>
                                {/* 작품명 */}
                                {phrase(dictionary, "webnovelTitle", language)}
                                <span className='text-red-500'>* </span>
                                <span className='text-gray-500 text-[12px]'>
                                    {/* 작품명은 30자 이상 입력하실 수 없습니다. */}
                                    {language == 'ko' ? <> {phrase(dictionary, "webnovelTitleDescription", language)}</> : <></>}
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    id="title"
                                    className='input rounded-md focus:ring-[#DB2777] w-full border border-gray-300 dark:bg-black dark:text-white text-black'
                                    placeholder={phrase(dictionary, "webnovelTitle", language)}
                                    onChange={(e) => setTitle(trim(e.target.value, 50))}
                                />
                             
                            </div>
                             <div className='mt-4'>
                              <label htmlFor="author" className='text-sm ml-2'>
                                {/* 작가명 */}
                                {phrase(dictionary, "webnovelAuthor", language)}
                                <span className='text-red-500'>* </span>
                                <span className='text-gray-500 text-[12px]'>
                                    {/* 작가명은 가입하셨을 때 닉네임과 동일합니다. */}
                                    {language == 'ko' ? <> {phrase(dictionary, "webnovelAuthorDescription", language)}</> : <></>}
                                    </span>
                             </label>
                              <input
                                    type="text"
                                    value={nickname}
                                    disabled
                                    id="author"
                                    className='input rounded-md focus:ring-[#DB2777] w-full border border-gray-300 bg-gray-300 dark:text-black'
                                    placeholder={nickname}
                                />
                             </div>
                            <div className="mt-4">
                                 <label htmlFor="genre" className='text-sm ml-2'>
                                        {/* 장르 */}
                                        {phrase(dictionary, "genre", language)}
                                        <span className='text-red-500'>* </span>
                                        <span className='text-gray-500 text-[12px]'>
                                        {/* 장르를 선택해 주세요. */}
                                        {language == 'ko' ? <> {phrase(dictionary, "genreDescription", language)}</> : <></>}
                                         </span>
                                    </label>
                                <select
                                    id="genre"
                                    className='rounded-md focus:ring-[#DB2777] bg-gray-200 w-full border border-gray-300 bg-transparent text-gray-500'
                                    onChange={handleChangeGenre}
                                >
                                    <option disabled selected value="">{phrase(dictionary, "genre", language)}</option>
                                    <option value="romanceFantasy">{phrase(dictionary, "romanceFantasy", language)}</option>
                                    <option value="romance">{phrase(dictionary, "romance", language)}</option>
                                    <option value="bl">{phrase(dictionary, "bl", language)}</option>
                                    <option value="fantasy">{phrase(dictionary, "fantasy", language)}</option>
                                    <option value="sf">{phrase(dictionary, "sf", language)}</option>
                                </select>
                            </div>
                            
                               <div className="mt-4">
                                  <label htmlFor="language" className='text-sm ml-2'>
                                        {/* 언어선택 */}
                                        {phrase(dictionary, "language", language)}
                                        <span className='text-red-500'>* </span>
                                        <span className='text-gray-500 text-[12px]'>
                                        {/* 집필 언어를 선택해 주세요. */}
                                        {language == 'ko' ? <> {phrase(dictionary, "languageDescription", language)}</> : <></>}
                                        </span>
                                    </label>
                                <select
                                    id="language"
                                    className="rounded-md focus:ring-[#DB2777] bg-gray-200 w-full border border-gray-300 bg-transparent text-gray-500"
                                    onChange={handleChangeLanguage}>
                                    <option disabled selected value="">{phrase(dictionary, "language", language)}</option>
                                    <option value="ko">{phrase(dictionary, "korean", language)}</option>
                                    <option value="en">{phrase(dictionary, "english", language)}</option>
                                    <option value="ja">{phrase(dictionary, "japanese", language)}</option>
                                    <option value="zh-CN">{phrase(dictionary, "chineseSimplified", language)}</option>
                                    <option value="zh-TW">{phrase(dictionary, "chineseTraditional", language)}</option>
                                    <option value="th">{phrase(dictionary, "thai", language)}</option>
                                    <option value="id">{phrase(dictionary, "indonesian", language)}</option>
                                    <option value="vi">{phrase(dictionary, "vietnamese", language)}</option>
                                    <option value="ar">{phrase(dictionary, "arabic", language)}</option>
                                </select>
                            </div>
                            <br />
                            <div className="flex flex-row space-x-4">
                                <div className='flex flex-col w-full'>
                                    <label htmlFor="description" className='text-sm ml-2'>
                                        {/* 작품소개 */}
                                        {phrase(dictionary, "description", language)}
                                        <span className='text-red-500'>* </span>
                                        <span className='text-gray-500 text-[12px]'>
                                            {/* 작품소개는 500자 이상 입력하실 수 없습니다. */}
                                            {language == 'ko' ? <> {phrase(dictionary, "descriptionDescription", language)}</> : <></>}
                                            </span>
                                    </label>
                                    <textarea
                                        value={description}
                                        rows={5}
                                        id="description"
                                        className='textarea rounded-md focus:ring-[#DB2777] w-full border border-gray-300 bg-transparent'
                                        placeholder={phrase(dictionary, "description", language)}
                                        onChange={(e) => setDescription(trim(e.target.value, 500))}
                                    />
                                </div>
                            </div>
                            <br />
                            {/* submit button */}
                            <div className='flex flex-col space-y-4 items-center mb-8'>
                                <NoCapsButton color='gray' variant='outlined' ref={buttonRef} type="submit" disabled={isSubmitting}
                                    className="whitespace-nowrap button-style dark:bg-gray-800 dark:hover:bg-gray-700 hover:border-[#DB2777] dark:focus:ring-gray-700 dark:border-gray-700">
                                    {/*Spinny wheel when submitting*/}
                                    {isSubmitting ?
                                        <CircularProgress size="1rem" color='secondary' />
                                        :
                                        phrase(dictionary, "save", language)}
                                </NoCapsButton>
                            </div>
                        </div>
                        {/* modal for input all info */}
                        <Modal open={openModal} onClose={() => setOpenModal(false)}>
                            <Box sx={useModalStyle}>
                                <Typography className="text-center">
                                    <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
                                    <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                                        {phrase(dictionary, "inputAllInfo", language)}
                                    </h3>
                                    <div className="flex justify-center gap-4">
                                        <ThemeProvider theme={grayTheme}>
                                        <Button color='gray' variant='outlined' onClick={() => setOpenModal(false)}>
                                            {phrase(dictionary, "ok", language)}
                                        </Button>
                                        </ThemeProvider>
                                    </div>
                                </Typography>
                            </Box>
                        </Modal>
                        {/* modal for cover art upload */}
                        <CoverArtModal 
                            coverArt={coverArt}
                            setCoverArtFile={setCoverArtFile}
                            handleCoverArtUploadModal={handleCoverArtUploadModal}
                            handleUploadFile={handleCoverArtUpload}
                            handleFileChange={handleFileChange}
                            showCoverArtModal={showCoverArtModal}
                            setShowCoverArtModal={setShowCoverArtModal}
                        />
                        {/* modal for consent to terms of service */}
                        <TermsOfServiceModal 
                            open={showTermsOfServiceModal}
                            onClose={() => setShowTermsOfServiceModal(false)}
                            onSubmit={handleFinalSubmit}
                            isSubmitting={isSubmitting}
                        />
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AddWebnovelComponent;
