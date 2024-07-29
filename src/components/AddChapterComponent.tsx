"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext';
import { Webnovel } from '@/components/Types';
import AuthorAndWebnovelsAsideComponent from '@/components/AuthorAndWebnovelsAsideComponent';
import '@/styles/globals.css'
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';
import { Button, Modal, Select } from "flowbite-react";
import AIEditorComponent from '@/components/AIEditorComponent';


const AddChapterComponent = ({ webnovelId, webnovels }: { webnovelId: string, webnovels: Webnovel[] }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const { email, nickname } = useUser();
    const { language, dictionary } = useLanguage();
    const router = useRouter();
    const maxText = 20000;
    const [maxExceeded, setMaxExceeded] = useState(false);
    const [currText, setCurrText] = useState(0);
    const [openModal, setOpenModal] = useState(true);
    const [modalPlacement, setModalPlacement] = useState('center')
    
    useEffect(() => {
        setCurrText(content.length);
        if (content.length > maxText) {
            setMaxExceeded(true);
        } else {
            setMaxExceeded(false);
        }
    }, [content])

    const handleAddChapter = async (event: React.FormEvent) => {
        event.preventDefault();
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        if (!title || !content) {
            return;
        }
        formData.append('webnovel_id', webnovelId);
        if (!maxExceeded) {
            const res = await fetch('/api/add-chapter', {
                method: 'POST',
                body: formData,
            });
            router.push(`/view_webnovels?id=${webnovelId}`)
        }
    };

    return (
        <div className='max-w-screen-md w-full flex flex-col md:flex-row justify-center mx-auto'>
            <div className='w-full md:w-1/4'>
                <AuthorAndWebnovelsAsideComponent webnovels={webnovels} nickname={nickname} />
                <hr className='block md:hidden mt-4 mb-4 bg-[#142448] h-1' />
            </div>
            <form className="md:w-3/4 w-full" onSubmit={handleAddChapter}>
                <div className="mr-4 w-full">
                    <p className="text-2xl">{phrase(dictionary, "newChapter", language)}</p>
                    <br />
                    <div className="flex flex-row space-x-4">
                        <p className="text-md w-24">{phrase(dictionary, "chapterTitle", language)}</p>
                        <input
                            type="text"
                            value={title}
                            className='input border-none rounded focus:ring-pink-600 w-full bg-gray-200'
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <br />
                    <div className="flex flex-row space-x-4">
                        <p className="text-md w-24">{phrase(dictionary, "content", language)}</p>
                        <textarea
                            value={content}
                            rows={16}
                            className='textarea border-none rounded focus:ring-pink-600 w-full bg-gray-200 textarea-lg'
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>
                    <div className='flex justify-end'>
                        <p className={`text-sm ${maxExceeded && "text-pink-600"}`}>
                            {`${currText}/${(maxText).toLocaleString()} ${phrase(dictionary, "chars", language)}`}</p>
                    </div>
                    <br />
                    <div className='flex justify-end'>

                        <button type="submit" className="button-style px-5 py-2.5 me-2 mb-2">{phrase(dictionary, "save", language)}</button>
                    </div>
                </div>
            </form>
            <Modal
                show={openModal}
                position={modalPlacement}
                onClose={() => setOpenModal(false)}
            >
                <Modal.Header>Characters</Modal.Header>
                <Modal.Body>
                    <AIEditorComponent />
                </Modal.Body>
                <Modal.Footer>
                    <button className='button-style' onClick={() => setOpenModal(false)}>Save</button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}

export default AddChapterComponent;