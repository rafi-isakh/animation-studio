"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation'
import SidebarComponent from '@/components/SidebarComponent';

const AddWebnovelComponent = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [coverArt, setCoverArt] = useState<File | null>(null);
    const [coverArtPreview, setCoverArtPreview] = useState<string | null>(null);
    const router = useRouter();

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
         <div className="flex space-y-4 items-center justify-center max-h-screen max-w-4-xl mx-auto">
            <form className="max-w-4xl w-full" onSubmit={handleAddWebnovel}>
                <div className="flex flex-row space-x-4">
                    <div className="mr-4 w-3/4">
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
                            className='textarea textarea-lg textarea-bordered w-full h-full'
                            onChange={(e) => setDescription(e.target.value)}
                        />
                        <br /><br />
                        <button type="submit" className="text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">저장</button>
                    </div>
                    <div>
                        <input
                            type="file"
                            className="file-input file-input-bordered"
                            onChange={handleFileChange}
                        />
                        {coverArtPreview && ( // Add this block
                            <div className="mt-4">
                                <img src={coverArtPreview} alt="Cover Art Preview" className="max-h-64" />
                            </div>
                        )}
                        <br /><br />
                    </div>
                </div>
            </form>
        </div>
    )
}

export default AddWebnovelComponent;