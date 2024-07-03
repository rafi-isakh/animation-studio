"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'
import { Webnovel } from '@/components//Types';
import { useAuth } from '@/components/AuthContext';
import AuthorAndWebnovelsAsideComponent from '@/components/AuthorAndWebnovelsAsideComponent';

const AddWebnovelComponent = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [coverArt, setCoverArt] = useState<File | null>(null);
    const [coverArtPreview, setCoverArtPreview] = useState<string | null>(null);
    const [webnovels, setWebnovels] = useState<Webnovel[]>([]);
    const { email, username } = useAuth();
    const router = useRouter();

    useEffect(() => {
        fetch(`http://localhost:5000/api/get_webnovel_byuser?user_email=${email}`)
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

        const res = await fetch('/api/add-webnovel', {
            method: 'POST',
            body: formData,
        });
        router.push("/")
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setCoverArt(file);
            setCoverArtPreview(URL.createObjectURL(file)); // Add this line
        }
    };

    return (
        <div className='max-w-screen-md w-full flex flex-row justify-center mx-auto'>
            <AuthorAndWebnovelsAsideComponent webnovels={webnovels} username={username}/>
            <form className="w-3/4" onSubmit={handleAddWebnovel}>
                <div className="flex flex-row space-x-4">
                    <div className="mr-4 w-2/3">
                        <p className="text-2xl">새 작품 쓰기</p>
                        <br />
                        <p className="text-lg">작품 제목</p>
                        <input
                            type="text"
                            value={title}
                            className='input input-bordered w-full'
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        <br /><br />
                        <p className="text-lg">작품 소개</p>
                        <textarea
                            value={description}
                            rows={4}
                            className='textarea textarea-lg textarea-bordered w-full'
                            onChange={(e) => setDescription(e.target.value)}
                        />
                        <br /><br />
                        <button type="submit" className="text-white bg-black hover:text-pink-600 font-medium text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">저장</button>
                    </div>
                    <div className="w-1/4">
                        {coverArtPreview ?
                            <div className="mt-4">
                                <img src={coverArtPreview} alt="Cover Art Preview" className="max-w-xs" />
                            </div> :
                            <svg className="w-64 text-gray-200 dark:text-gray-600" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 18">
                                <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z" />
                            </svg>
                        }
                        <input
                            type="file"
                            className="mt-4 file-input file-input-bordered"
                            onChange={handleFileChange}
                        />
                    </div>
                </div>
            </form>
        </div>
    )
}

export default AddWebnovelComponent;