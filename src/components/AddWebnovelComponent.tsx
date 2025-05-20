"use client"

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import styles from "@/styles/KoreanText.module.css"
import '@/styles/globals.css'
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';
import Link from 'next/link';
import {
    CircularProgress,
    styled,
} from '@mui/material';
import { Button } from '@/components/shadcnUI/Button';
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { Info, CloudUpload } from 'lucide-react';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import '@/styles/AddWebnovelComponent.css';
import TermsOfServiceModal from '@/components/TermsOfServiceModal';
import CoverArtModal from '@/components/CoverArtModal';
import CoverArtPreview from './CoverArtPreview';
import { useWebnovels } from '@/contexts/WebnovelsContext';
import { Dialog, DialogFooter, DialogHeader, DialogContent, DialogTitle, DialogDescription } from '@/components/shadcnUI/Dialog';
import { Label } from "@/components/shadcnUI/Label"
import { RadioGroup, RadioGroupItem } from "@/components/shadcnUI/RadioGroup"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Language } from '@/components/Types';


export const WarningModal = ({ mode, open, onOpenChange, dictionary, language }: { mode: 'addWebnovel' | 'agreeToTerms', open: boolean, onOpenChange: (open: boolean) => void, dictionary: any, language: Language }) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="z-[2700] !gap-0 !p-0 overflow-hidden bg-white dark:bg-[#211F21] border-none shadow-none" showCloseButton={true}>
                <DialogHeader className='p-4'>
                    <DialogTitle>
                        <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200 text-center" />
                        {mode === 'addWebnovel' ? <p className='text-2xl font-bold text-center'>{phrase(dictionary, "inputAllInfo", language)}</p> :
                         mode === 'agreeToTerms' ? <p className='text-2xl font-bold text-center'>{phrase(dictionary, "pleaseAgreeToTerms", language)}</p>
                                : <></>
                        }
                    </DialogTitle>
                    <DialogDescription>
                        <p className='text-base text-center'>{phrase(dictionary, "inputAllInfo", language)}</p>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className='flex flex-row !space-x-0 !p-0 !flex-grow-0 !flex-shrink-0 self-end'>
                    <Button
                        className={cn("!rounded-none w-full py-6 text-lg font-medium bg-[#b8c1d1] hover:bg-[#a9b2c2] text-white")}
                        onClick={() => onOpenChange(false)}>
                        {phrase(dictionary, "ok", language)}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


const AddWebnovelComponent = () => {
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
    const [openWarningModal, setOpenWarningModal] = useState(false);
    const [showCoverArtModal, setShowCoverArtModal] = useState(false);
    const [showTermsOfServiceModal, setShowTermsOfServiceModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { invalidateCache } = useWebnovels();
    const { isLoggedIn } = useAuth();
    const isLoggedInAndRegistered = !!(isLoggedIn && email);
    const [isAdultMaterial, setIsAdultMaterial] = useState(false);
    const { toast } = useToast();
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
            setOpenWarningModal(true);
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
        formData.append('is_adult_material', isAdultMaterial.toString());
        try {
            const res = await fetch('/api/add_webnovel', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                toast({
                    title: phrase(dictionary, "add_new_webnovel_error", language),
                    variant: "destructive",
                    description: "Please try again",
                })
                throw new Error("Add webnovel failed");
            }
            toast({
                title: phrase(dictionary, "add_new_webnovel_success", language),
                variant: "success",
                description: "Please wait for the webnovel to be approved",
            })
            const data = await res.json();
            invalidateCache();
            router.push(`/view_webnovels/${data["id"]}`);
            console.log("webnovel added", data);
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
        <>
            {!isLoggedInAndRegistered ? (
                <div className='flex flex-col items-center justify-center min-h-[50vh] gap-4'>
                    <p className='text-lg'>{phrase(dictionary, "pleaseLoginFirst", language)}</p>
                    <Link
                        href="/signin"
                        className='px-4 py-2 bg-pink-200 hover:bg-[#DB2777] hover:text-white rounded-md transition-all duration-300 dark:bg-gray-800 dark:hover:bg-gray-700'
                    >
                        {phrase(dictionary, "login", language)}
                    </Link>
                </div>
            ) : (
                <div className='md:max-w-screen-md p-6 w-full flex md:flex-row flex-col justify-center mx-auto'>
                    <div className='flex flex-col border-none w-full'>
                        {/* Mui dark theme color code : divider [#2F2F2F] */}
                        <form onSubmit={handleAddWebnovel}>
                            <p className={`text-2xl font-bold ${styles.korean} mb-10`}>
                                {phrase(dictionary, "uploadNewWebnovel", language)}
                            </p>
                            <div className="md:w-[500px] w-full">
                                <>
                                    <label htmlFor="author" className='text-sm'>
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
                                                        <p className={`text-sm font-bold ${language == 'ko' ? 'break-keep' : ''}`}>
                                                            {/* {replaceSmartQuotes(language === 'ko' ? WebnovelTermsInfo : WebnovelTermsInfo_en)} */}
                                                            {phrase(dictionary, "coverArtMustBeInA53AspectRatio", language)}
                                                        </p>
                                                        <p className={`text-sm ${language == 'ko' ? 'break-keep' : ''}`}>
                                                            {phrase(dictionary, "coverArtSize", language)}
                                                        </p>
                                                    </div>
                                                }
                                            >
                                                <Link href="" className='p-0'><Info size={12} /></Link>
                                            </InfoTooltip>
                                        </div>
                                    </label>
                                    <div className='flex flex-col gap-2 mt-2'>
                                        <CoverArtPreview coverArt={coverArt} handleCoverArtUploadModal={handleCoverArtUploadModal} />
                                        <Button
                                            onClick={handleCoverArtUploadModal}
                                            variant='outline'
                                            className='bg-[#DB2777] dark:bg-[#DB2777] hover:opacity-80  text-white  dark:text-white self-start border-0 w-[200px]'>
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
                                            className='input rounded-md focus:ring-[#DB2777] w-full border border-gray-300 dark:border-[#2F2F2F] dark:bg-black dark:text-white text-black'
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
                                            className='input rounded-md focus:ring-[#DB2777] w-full border border-gray-300 dark:border-[#2F2F2F] bg-gray-300 dark:text-black'
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
                                            className='rounded-md focus:ring-[#DB2777] bg-gray-200 w-full border border-gray-300 dark:border-[#2F2F2F] bg-transparent text-gray-500'
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
                                        <p className='text-sm ml-2'>
                                            {/* 성인물 */}
                                            {phrase(dictionary, "matureContent", language)}
                                            <span className='text-red-500'>* </span>
                                            <span className='text-gray-500 text-[12px]'>
                                                {/* 성인물 여부를 선택해 주세요. */}
                                                {language == 'ko' ? <> {phrase(dictionary, "isAdultStory", language)}</> : <></>}
                                            </span>
                                        </p>
                                        <div className="flex flex-col gap-2 mt-2">
                                            <RadioGroup
                                                onValueChange={(value) => {
                                                    setIsAdultMaterial(value === "adultContent");
                                                    console.log("is adult?", value === "adultContent");
                                                }}
                                                defaultValue="allContent"
                                                className="text-[#DB2777]"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <RadioGroupItem
                                                        value="allContent"
                                                        id="forAllContent"
                                                        className="border-gray-300 data-[state=checked]:bg-[#DB2777] data-[state=checked]:text-white"
                                                    />
                                                    <Label htmlFor="forAllContent" className="text-sm text-gray-500">
                                                        {phrase(dictionary, "allContent", language)}
                                                    </Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <RadioGroupItem
                                                        value="adultContent"
                                                        id="forAdultContent"
                                                        className="border-gray-300 data-[state=checked]:bg-[#DB2777] data-[state=checked]:text-white"
                                                    />
                                                    <Label htmlFor="forAdultContent" className="text-sm text-gray-500">
                                                        {phrase(dictionary, "adultContent", language)}
                                                    </Label>
                                                </div>
                                            </RadioGroup>
                                        </div>
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
                                            className="rounded-md focus:ring-[#DB2777] bg-gray-200 w-full border border-gray-300 dark:border-[#2F2F2F] bg-transparent text-gray-500"
                                            onChange={handleChangeLanguage}>
                                            <option disabled selected value="">{phrase(dictionary, "language", language)}</option>
                                            <option value="ko">{phrase(dictionary, "korean", language)}</option>
                                            <option value="en">{phrase(dictionary, "english", language)}</option>
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
                                                className='textarea rounded-md focus:ring-[#DB2777] w-full border border-gray-300 dark:border-[#2F2F2F] bg-transparent'
                                                placeholder={phrase(dictionary, "description", language)}
                                                onChange={(e) => setDescription(trim(e.target.value, 500))}
                                            />
                                        </div>
                                    </div>
                                    <br />
                                    <div className='flex justify-center items-center mb-8'>
                                        <Button
                                            variant='outline'
                                            ref={buttonRef}
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="whitespace-nowrap w-full transition-all duration-300
                                              bg-pink-200 hover:bg-[#DB2777] hover:text-white
                                              dark:bg-gray-800 border-0
                                              dark:hover:bg-gray-700
                                               ">
                                            {/*Spinny wheel when submitting*/}
                                            <CloudUpload size={16} />
                                            {isSubmitting ?
                                                <CircularProgress size="1rem" color='secondary' />
                                                : phrase(dictionary, "save", language)
                                            }
                                        </Button>
                                    </div>
                                </div>
                                {/* modal for input all info */}
                                <WarningModal
                                    mode='addWebnovel'
                                    dictionary={dictionary}
                                    language={language}
                                    open={openWarningModal}
                                    onOpenChange={setOpenWarningModal}
                                />
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
                    </div >
                    <div className='h-[10vh]' />
                </div >
            )}
        </>
    )
}

export default AddWebnovelComponent;
