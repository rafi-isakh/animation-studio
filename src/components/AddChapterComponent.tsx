"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext';
import { Webnovel } from '@/components/Types';
import AuthorAndWebnovelsAsideComponent from '@/components/AuthorAndWebnovelsAsideComponent';

const AddChapterComponent = ({webnovelId} : {webnovelId: string}) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
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

    const handleAddChapter = async (event: React.FormEvent) => {
        event.preventDefault();
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('webnovel_id', webnovelId);
        const res = await fetch('/api/add-chapter', {
            method: 'POST',
            body: formData,
        });
        router.push(`/view_webnovels?id=${webnovelId}`)
    };

    return (
        <div className='max-w-screen-md w-full flex flex-row justify-center mx-auto'>
            <AuthorAndWebnovelsAsideComponent webnovels={webnovels} username={username}/>
            <form className="w-3/4" onSubmit={handleAddChapter}>
                <div className="flex flex-row space-x-4">
                    <div className="mr-4 w-full">
                        <p className="text-2xl">새 글 쓰기</p>
                        <br />
                        <p className="text-lg">글 제목</p>
                        <input
                            type="text"
                            value={title}
                            className='input input-bordered w-full'
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        <br /><br />
                        <p className="text-lg">내용</p>
                        <textarea
                            value={content}
                            rows={8}
                            className='textarea textarea-lg textarea-bordered w-full'
                            onChange={(e) => setContent(e.target.value)}
                        />
                        <br /><br />
                        <button type="submit" className="text-white bg-black hover:text-pink-600 font-medium text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">저장</button>
                    </div>
                </div>
            </form>
        </div>
    )
}

export default AddChapterComponent;