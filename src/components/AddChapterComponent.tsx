"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext';
import { Webnovel } from '@/components/Types';
import AuthorAndWebnovelsAsideComponent from '@/components/AuthorAndWebnovelsAsideComponent';
import '@/styles/globals.css'


const AddChapterComponent = ({ webnovelId }: { webnovelId: string }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [webnovels, setWebnovels] = useState<Webnovel[]>([]);
    const { email, nickname } = useUser();
    const router = useRouter();

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovels_byemail?email=${email}`)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    setWebnovels(data)
                }
            })
    }, [email]);

    const handleAddChapter = async (event: React.FormEvent) => {
        event.preventDefault();
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        if (!title || !content) {
            return;
        }
        formData.append('webnovel_id', webnovelId);
        const res = await fetch('/api/add-chapter', {
            method: 'POST',
            body: formData,
        });
        router.push(`/view_webnovels?id=${webnovelId}`)
    };

    return (
        <div className='max-w-screen-md w-full flex flex-col md:flex-row justify-center mx-auto'>
            <div className='w-full md:w-1/4'>
                <AuthorAndWebnovelsAsideComponent webnovels={webnovels} nickname={nickname} />
                <hr className='block md:hidden mt-4 mb-4 bg-black h-1' />
            </div>
            <form className="md:w-3/4 w-full" onSubmit={handleAddChapter}>
                <div className="mr-4 w-full">
                    <p className="text-2xl">새 글 쓰기</p>
                    <br />
                    <div className="flex flex-row space-x-4">
                        <p className="text-md w-24">글 제목</p>
                        <input
                            type="text"
                            value={title}
                            className='input border-none rounded focus:ring-pink-600 w-full bg-gray-200'
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <br />
                    <div className="flex flex-row space-x-4">
                        <p className="text-md w-24">내용</p>
                        <textarea
                            value={content}
                            rows={8}
                            className='textarea border-none rounded focus:ring-pink-600 w-full bg-gray-200 textarea-lg'
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>
                    <br /><br />
                    <button type="submit" className="button-style px-5 py-2.5 me-2 mb-2">저장</button>
                </div>
            </form>
        </div>
    )
}

export default AddChapterComponent;