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
import { style } from '@/styles/ModalStyles';
import { Button, Modal, Box, Typography, ThemeProvider, CircularProgress } from '@mui/material';
import { HiOutlineExclamationCircle } from "react-icons/hi";
import AIEditorCharactersComponent from './AIEditorCharactersComponent';
import { grayTheme, NoCapsButton } from '@/styles/BlackWhiteButtonStyle';


const AddWebnovelComponent = ({ webnovels }: { webnovels: Webnovel[] }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [coverArt, setCoverArt] = useState<File | null>(null);
    const [coverArtPreview, setCoverArtPreview] = useState<string | null>(null);
    const [genre, setGenre] = useState('');
    const [novelLanguage, setNovelLanguage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const buttonRef = useRef(null);
    const { email, nickname } = useUser();
    const { language, dictionary } = useLanguage();
    const router = useRouter();
    const [buttonSize, setButtonSize] = useState({ width: 'auto', height: 'auto' })
    const [currText, setCurrText] = useState(0);
    const [openModal, setOpenModal] = useState(false);

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
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        if (coverArt) {
            formData.append('coverArt', coverArt)
        }
        formData.append('genre', genre);
        formData.append('language', novelLanguage);
        if (!title || !description || !coverArt || !genre || !novelLanguage) {
            setOpenModal(true);
            return;
        }
        setIsSubmitting(true);

        const res = await fetch('/api/add_webnovel', {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) {
            throw new Error("Add webnovel failed");
        }
        const data = await res.json();
        setIsSubmitting(true);

        router.push(`/view_webnovels?id=${data["id"]}`)
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setCoverArt(file);
            setCoverArtPreview(URL.createObjectURL(file));
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



    return (
        <div className='md:w-[720px] p-6 w-full flex md:flex-row flex-col justify-center mx-auto'>
            <div>
                <form onSubmit={handleAddWebnovel}>
                    <div className="flex flex-col md:flex-row md:space-x-4 items-center md:items-start">
                        <div className="mr-4 w-full md:w-2/3">
                            <p className={`text-4xl font-bold ${styles.korean}`}>{phrase(dictionary, "uploadNewWebnovel", language)}</p>
                            <div className="flex flex-row space-x-4 mt-16">
                                <input
                                    type="text"
                                    value={title}
                                    className='input rounded-xl focus:ring-pink-600 w-full border border-gray-300'
                                    placeholder={phrase(dictionary, "webnovelTitle", language)}
                                    onChange={(e) => setTitle(trim(e.target.value, 50))}
                                />
                            </div>
                            <br />
                            <div className="flex flex-row space-x-4">
                                <select
                                    id="genre"
                                    className='rounded-xl focus:ring-pink-600 bg-gray-200 w-full border border-gray-300 bg-transparent text-gray-500'
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
                            <br />
                            <div className="flex flex-row space-x-4">
                                <select
                                    id="language"
                                    className="rounded-xl focus:ring-pink-600 bg-gray-200 w-full border border-gray-300 bg-transparent text-gray-500"
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
                                    <textarea
                                        value={description}
                                        rows={4}
                                        className='textarea rounded-xl focus:ring-pink-600 w-full border border-gray-300 bg-transparent'
                                        placeholder={phrase(dictionary, "description", language)}
                                        onChange={(e) => setDescription(trim(e.target.value, 500))}
                                    />
                                </div>
                            </div>
                            <br />
                            <div className='flex flex-col space-y-4 items-end'>
                                <NoCapsButton color='gray' variant='outlined' ref={buttonRef} type="submit" disabled={isSubmitting}
                                    className="whitespace-nowrap button-style dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">
                                    {/*Spinny wheel when submitting*/}
                                    {isSubmitting ?
                                        <CircularProgress color='secondary' />
                                        :
                                        phrase(dictionary, "save", language)}
                                </NoCapsButton>
                            </div>
                        </div>
                        <div className="md:w-1/4 md:mt-16">
                            <Link href="#">
                                {coverArtPreview ?
                                    <div className="mt-4">
                                        <a onClick={handleCoverArtUpload} >
                                            <Image src={coverArtPreview} alt="Cover Art Preview" className="max-w-xs rounded" width={200} height={120} />
                                        </a>
                                    </div> :
                                    <div className='mt-4 md:mt-14'>
                                        <svg onClick={handleCoverArtUpload} className="w-64 text-gray-200 dark:text-gray-600" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 18">
                                            <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z" />
                                        </svg>
                                    </div>
                                }
                            </Link>
                            <input
                                type="file"
                                className="hidden"
                                id='coverArtFile'
                                onChange={handleFileChange}
                            />
                        </div>

                        <Modal open={openModal} onClose={() => setOpenModal(false)}>
                            <Box sx={style}>
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
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AddWebnovelComponent;