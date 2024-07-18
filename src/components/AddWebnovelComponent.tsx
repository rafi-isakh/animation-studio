"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'
import { Webnovel } from '@/components//Types';
import { useUser } from '@/contexts/UserContext';
import AuthorAndWebnovelsAsideComponent from '@/components/AuthorAndWebnovelsAsideComponent';
import Image from 'next/image'

const AddWebnovelComponent = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [coverArt, setCoverArt] = useState<File | null>(null);
    const [coverArtPreview, setCoverArtPreview] = useState<string | null>(null);
    const [genre, setGenre] = useState('');
    const [webnovels, setWebnovels] = useState<Webnovel[]>([]);
    const [language, setLanguage] = useState('');
    const { email, nickname } = useUser();
    const router = useRouter();

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovel_byuser?email=${email}`)
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
        formData.append('language', language);
        if (!title || !description || !coverArt || !genre || !language) {
            return;
        }

        const res = await fetch('/api/add-webnovel', {
            method: 'POST',
            body: formData,
        });
        const data = await res.json();
        console.log("data:", data);
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
        setLanguage(e.target.value);
    }

    return (
        <div className='max-w-screen-md w-full flex flex-row justify-center mx-auto'>
            <AuthorAndWebnovelsAsideComponent webnovels={webnovels} nickname={nickname ?? ''} />
            <form className="w-3/4" onSubmit={handleAddWebnovel}>
                <div className="flex flex-col md:flex-row space-x-4">
                    <div className="mr-4 w-2/3">
                        <p className="text-2xl">새 작품 쓰기</p>
                        <br />
                        <div className="flex flex-row space-x-4">
                            <p className="text-md w-20">작품 제목</p>
                            <input
                                type="text"
                                value={title}
                                className='input border-none rounded focus:ring-pink-600 w-full bg-gray-200'
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        <br />
                        <div className="flex flex-row space-x-4">
                            <label htmlFor="genre" className="text-md w-20">장르</label>
                            <select id="genre" className='border-none rounded focus:ring-pink-600 bg-gray-200 w-full' onChange={handleChangeGenre}>
                                <option value=""></option>
                                <option value="Romance Fantasy">로판</option>
                                <option value="Romance">로맨스</option>
                                <option value="BL">BL</option>
                                <option value="Fantasy">판타지</option>
                            </select>
                        </div>
                        <br />
                        <div className="flex flex-row space-x-4">
                            <label htmlFor="language" className="text-md w-20">언어</label>
                            <select id="language" className="border-none rounded focus:ring-pink-600 bg-gray-200 w-full" onChange={handleChangeLanguage}>
                                <option value=""></option>
                                <option value="ko">한국어</option>
                                <option value="en">영어</option>
                                <option value="ja">일본어</option>
                                <option value="ar">아랍어</option>
                            </select>
                        </div>
                        <br />
                        <div className="flex flex-row space-x-4">
                            <p className="text-md w-20">작품 소개</p>
                            <textarea
                                value={description}
                                rows={4}
                                className='textarea border-none rounded focus:ring-pink-600 w-full textarea-lg bg-gray-200 textarea-bordered w-full'
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                        <br />
                        <div className='flex justify-end'>
                            <button type="submit" className="self-end rounded text-white bg-black hover:text-pink-600 font-medium text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">저장</button>
                        </div>
                    </div>
                    <div className="w-1/4">
                        {coverArtPreview ?
                            <div className="mt-4">
                                <img src={coverArtPreview} alt="Cover Art Preview" className="max-w-xs" />
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
    )
}

export default AddWebnovelComponent;