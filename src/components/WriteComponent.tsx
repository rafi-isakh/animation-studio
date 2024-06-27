"use client"

import {useState} from 'react';
import { useRouter } from 'next/navigation'

const WriteComponent = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [coverArt, setCoverArt] = useState<File | null>(null);
    const router = useRouter(); 

    const handleAddWebnovel = async (event: React.FormEvent) => {
        event.preventDefault();
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        if (coverArt) {
            formData.append('coverArt', coverArt)
        }

        const res = await fetch('/api/add-webnovel', {
            method: 'POST',
            body: formData,
        });
        router.push("/")
  };

    return (
    <div className="m-4 flex space-y-4 items-center justify-center">
        <form onSubmit={handleAddWebnovel}>
            <input
                type="text"
                placeholder="Title"
                value={title}
                className='input input-bordered'
                onChange={(e) => setTitle(e.target.value)}
            />
            <br/><br/>
            <textarea
                placeholder="Content"
                value={content}
                className='textarea textarea-lg textarea-bordered'
                onChange={(e) => setContent(e.target.value)}
            />
            <br/><br/>
            <input
                type="file"
                className="file-input file-input-bordered"
                onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                    setCoverArt(e.target.files[0])}
                }
                }
            />
            <br/><br/>
            <button className='btn' type="submit">Submit</button>
            </form>
        </div>
    )
}

export default WriteComponent;