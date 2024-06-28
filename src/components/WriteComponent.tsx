"use client"

import {useState} from 'react';
import { useRouter } from 'next/navigation'
import React from 'react';
import {WebnovelIdProps} from "@/components/Types"

const WriteComponent : React.FC<WebnovelIdProps> = ({webnovelId}) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const router = useRouter(); 

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
        const res_json = await res.json();
        router.push("/search")
  };

    return (
    <div className="m-4 flex space-y-4 items-center justify-center">
        <form onSubmit={handleAddChapter}>
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
            <button className='btn' type="submit">Submit</button>
            </form>
        </div>
    )
}

export default WriteComponent;