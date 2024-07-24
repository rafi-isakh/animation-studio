"use client"

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation'
import { Webnovel } from '@/components//Types';
import { useUser } from '@/contexts/UserContext';
import AuthorAndWebnovelsAsideComponent from '@/components/AuthorAndWebnovelsAsideComponent';
import styles from "@/styles/KoreanText.module.css"
import '@/styles/globals.css'
import { useLanguage } from '@/contexts/LanguageContext';
import {phrase} from '@/utils/phrases';


const AddWebnovelComponent = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [coverArt, setCoverArt] = useState<File | null>(null);
    const [coverArtPreview, setCoverArtPreview] = useState<string | null>(null);
    const [genre, setGenre] = useState('');
    const [webnovels, setWebnovels] = useState<Webnovel[]>([]);
    const [novelLanguage, setNovelLanguage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const buttonRef = useRef(null);
    const {email, nickname} = useUser();
    const {language, dictionary} = useLanguage();
    const router = useRouter();
    const [buttonSize, setButtonSize] = useState({ width: 'auto', height: 'auto' })

    useEffect(() => {
        if (buttonRef.current) {
            const { offsetWidth, offsetHeight } = buttonRef.current;
            setButtonSize({ width: offsetWidth, height: offsetHeight })
        }
    }, [])

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovels_byemail?email=${email}`)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    setWebnovels(data)
                }
            })
    }, [email]);

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
            return;
        }
        setIsSubmitting(true);

        const res = await fetch('/api/add-webnovel', {
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
            setCoverArtPreview(URL.createObjectURL(file)); // Add this line
        }
    };

    const handleChangeGenre = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setGenre(e.target.value);
    }

    const handleChangeLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setNovelLanguage(e.target.value);
    }

    return (
        <div className='max-w-screen-md w-full flex md:flex-row flex-col justify-center mx-auto'>
            <div className='w-full md:w-1/4'>
                <AuthorAndWebnovelsAsideComponent webnovels={webnovels} nickname={nickname ?? ''} />
                <hr className='block md:hidden mt-4 mb-4 bg-[#333333] h-1' />
            </div>
            <div className='md:w-3/4 w-full'>
                <form onSubmit={handleAddWebnovel}>
                    <div className="flex flex-col md:flex-row md:space-x-4 items-center md:items-start">
                        <div className="mr-4 w-full md:w-2/3">
                            <p className={`text-2xl ${styles.korean}`}>{phrase(dictionary, "uploadNewWebnovel", language)}</p>
                            <br />
                            <div className="flex flex-row space-x-4">
                                <p className={`text-md w-24 ${styles.korean}`}>{phrase(dictionary, "webnovelTitle", language)}</p>
                                <input
                                    type="text"
                                    value={title}
                                    className='input border-none rounded focus:ring-pink-600 w-full bg-gray-200'
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>
                            <br />
                            <div className="flex flex-row space-x-4">
                                <label htmlFor="genre" className="text-md w-24">{phrase(dictionary, "genre", language)}</label>
                                <select id="genre" className='border-none rounded focus:ring-pink-600 bg-gray-200 w-full' onChange={handleChangeGenre}>
                                    <option value=""></option>
                                    <option value="Romance Fantasy">{phrase(dictionary, "romanceFantasy", language)}</option>
                                    <option value="Romance">{phrase(dictionary, "romance", language)}</option>
                                    <option value="BL">{phrase(dictionary, "bl", language)}</option>
                                    <option value="Fantasy">{phrase(dictionary, "fantasy", language)}</option>
                                    <option value="SF">{phrase(dictionary, "sf", language)}</option>
                                </select>
                            </div>
                            <br />
                            <div className="flex flex-row space-x-4">
                                <label htmlFor="language" className="text-md w-24">{phrase(dictionary, "language", language)}</label>
                                <select id="language" className="border-none rounded focus:ring-pink-600 bg-gray-200 w-full" onChange={handleChangeLanguage}>
                                    <option value=""></option>
                                    <option value="ko">{phrase(dictionary, "korean", language)}</option>
                                    <option value="en">{phrase(dictionary, "english", language)}</option>
                                    <option value="ja">{phrase(dictionary, "japanese", language)}</option>
                                    <option value="zh-CN">{phrase(dictionary, "chineseSimplified", language)}</option>
                                    <option value="zh-TW">{phrase(dictionary, "chineseTraditional", language)}</option>
                                    <option value="id">{phrase(dictionary, "indonesian", language)}</option>
                                    <option value="vi">{phrase(dictionary, "vietnamese", language)}</option>
                                    <option value="ar">{phrase(dictionary, "arabic", language)}</option>
                                </select>
                            </div>
                            <br />
                            <div className="flex flex-row space-x-4">
                                <p className={`text-md w-24 ${styles.korean}`}>{phrase(dictionary, "description", language)}</p>
                                <textarea
                                    value={description}
                                    rows={4}
                                    className='textarea border-none rounded focus:ring-pink-600 w-full textarea-lg bg-gray-200 textarea-bordered w-full'
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                            <br />
                            <div className='flex flex-nowrap justify-end'>
                                <button ref={buttonRef} type="submit" disabled={isSubmitting} style={{ width: buttonSize.width, height: buttonSize.height }} 
                                className="whitespace-nowrap button-style dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">
                                    {/*Spinny wheel when submitting*/}
                                    {isSubmitting ?
                                        <div role="status" className='mx-auto -translate-y-0.5'>
                                            <svg aria-hidden="true" className="text-gray-200 animate-spin dark:text-gray-600 fill-pink-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                                            </svg>
                                            <span className="sr-only">Loading...</span>
                                        </div>
                                        :
                                        phrase(dictionary, "save", language)}
                                        </button>
                            </div>
                        </div>
                        <div className="md:w-1/4">
                            {coverArtPreview ?
                                <div className="mt-4">
                                    <img src={coverArtPreview} alt="Cover Art Preview" className="max-w-xs rounded" />
                                </div> :
                                <div className='mt-4 md:mt-14'>
                                    <svg className="w-64 text-gray-200 dark:text-gray-600" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 18">
                                        <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z" />
                                    </svg>
                                </div>
                            }
                            <input
                                type="file"
                                className="mt-4"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AddWebnovelComponent;