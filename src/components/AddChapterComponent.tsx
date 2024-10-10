"use client"

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext';
import { Webnovel } from '@/components/Types';
import AuthorAndWebnovelsAsideComponent from '@/components/AuthorAndWebnovelsAsideComponent';
import '@/styles/globals.css'
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';
import { Button, ThemeProvider } from '@mui/material';
import AIEditorComponent from '@/components/AIEditorComponent';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.bubble.css';
import 'react-quill/dist/quill.snow.css';
import '@/styles/quill-custom.css'; // Add this import
import { grayTheme } from '@/styles/BlackWhiteButtonStyle';




const AddChapterComponent = ({ webnovelId, webnovels, novelLanguage }: { webnovelId: string, webnovels: Webnovel[], novelLanguage: string }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const { email, nickname } = useUser();
    const { language, dictionary } = useLanguage();
    const router = useRouter();
    const maxText = 20000;
    const [maxExceeded, setMaxExceeded] = useState(false);
    const [currText, setCurrText] = useState(0);
    const [openAIEditor, setOpenAIEditor] = useState(false);
    const titleRef = useRef<ReactQuill>(null);
    const contentRef = useRef<ReactQuill>(null);

    useEffect(() => {
        setCurrText(content.length);
        if (content.length > maxText) {
            setMaxExceeded(true);
        } else {
            setMaxExceeded(false);
        }
    }, [content])

    useEffect(() => {
        if (titleRef.current) {
            const quillEditor = titleRef.current.getEditor();
            if (quillEditor) {
                quillEditor.root.dataset.placeholder = phrase(dictionary, "chapterTitle", language);
            }
        }
        if (contentRef.current) {
            const quillEditor = contentRef.current.getEditor();
            if (quillEditor) {
                quillEditor.root.dataset.placeholder = phrase(dictionary, "content", language);
            }
        }
    }, [dictionary, language, titleRef.current, contentRef.current])


    const handleAddChapter = async (event: React.FormEvent) => {
        event.preventDefault();
        const formData = new FormData();
        const quillEditor = titleRef.current?.getEditor();
        formData.append('title', quillEditor?.getText() || "");
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
            router.refresh();
        }
    };

    const handleClickAIEditor = (event: React.FormEvent) => {
        event.preventDefault();
        setOpenAIEditor(true);
    };

    const replaceSmartQuotes = (str: string) => {
        return str.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
    };

    return (
        <div className='md:w-[720px] p-6 mb-10 flex flex-col justify-center mx-auto border-gray-300 border rounded-xl'>
            <form onSubmit={handleAddChapter}>
                <ThemeProvider theme={grayTheme}>
                    <div className="mr-4 flex flex-col space-y-4 w-full">
                        <div className='flex flex-col space-y-4 items-start'>
                            <Button type="submit" variant="outlined" color="gray">{phrase(dictionary, "publish", language)}</Button>
                            {/* <Button variant="contained" color="bw" onClick={handleClickAIEditor}>{phrase(dictionary, "aieditor", language)}</Button> */}
                        </div>
                        <div className="flex flex-col space-y-4 border border-gray-300 rounded-xl">
                            <ReactQuill ref={titleRef} theme="bubble" value={title} onChange={setTitle} className="title-editor" />
                        </div>
                        <hr />
                        <div className="flex flex-col space-y-4">
                            <div className='w-full max-w-full rounded-xl border border-gray-300'>
                                <ReactQuill ref={contentRef} theme="bubble" value={content} onChange={setContent} className="content-editor" />
                            </div>
                        </div>
                        <br />
                    </div>
                </ThemeProvider>
            </form>
            {/* <AIEditorComponent openModal={openAIEditor} setOpenModal={setOpenAIEditor} text={content} novelLanguage={novelLanguage}/> */}

        </div>
    )
}

export default AddChapterComponent;