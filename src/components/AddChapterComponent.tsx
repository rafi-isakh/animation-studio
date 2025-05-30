"use client"

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext';
import { Webnovel } from '@/components/Types';
import '@/styles/globals.css'
import { Button } from '@/components/shadcnUI/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';
import AIEditorComponent from '@/components/AIEditorComponent';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.bubble.css';
import 'react-quill/dist/quill.snow.css';
import '@/styles/quill-custom.css'; // Add this import
import Link from 'next/link';
import { useWebnovels } from '@/contexts/WebnovelsContext';
import { ArrowLeftIcon, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/shadcnUI/Dialog';
import { ScrollArea } from '@/components/shadcnUI/ScrollArea';
import { cn } from '@/lib/utils';
const AddChapterComponent = ({ webnovelId }: { webnovelId: string }) => {
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
    const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
    const { getWebnovelById } = useWebnovels();
    const [webnovel, setWebnovel] = useState<Webnovel | undefined>(undefined);
    const clicked = useRef(false);
    const [plainTitleText, setPlainTitleText] = useState('');
    const [plainContentText, setPlainContentText] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const fetchWebnovel = async () => {
            const webnovel = await getWebnovelById(webnovelId);
            setWebnovel(webnovel);
        }
        fetchWebnovel();
    }, [webnovelId])

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
                quillEditor.root.dataset.placeholder = phrase(dictionary, "contentDescription", language);
            }
        }
    }, [dictionary, language, titleRef.current, contentRef.current])

    const handleAddChapter = async (event: React.FormEvent) => {
        event.preventDefault();
        if (maxExceeded) {
            return;
        }
        if (clicked.current) {
            return;
        }
        clicked.current = true;
        const formData = new FormData();

        // Get plain text from title editor
        const titleEditor = titleRef.current?.getEditor();
        const titleText = titleEditor?.getText().trim() || "";

        // Get plain text from content editor
        const contentEditor = contentRef.current?.getEditor();
        const contentText = contentEditor?.getText().trim() || "";

        formData.append('title', titleText);
        formData.append('content', contentText);
        formData.append('webnovel_id', webnovelId);

        if (!titleText || !contentText) {
            return;
        }

        try {
            setUploading(true)
            const response = await fetch('/api/add_chapter', {
                method: 'POST',
                body: formData,
            });
            if (response.ok) {
                router.push(`/view_webnovels/${webnovelId}`)
            } else {
                console.error(response.statusText);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handleClickAIEditor = (event: React.FormEvent) => {
        event.preventDefault();
        setOpenAIEditor(true);
    };

    const replaceSmartQuotes = (str: string) => {
        return str.replace(/[""]/g, '"').replace(/['']/g, "'");
    };

    const handleClickPreview = (event: React.FormEvent) => {
        event.preventDefault();
        // Extract plain text from the content editor when opening preview
        const plainTitleText = titleRef.current?.getEditor()?.getText() || "";
        const plainContentText = contentRef.current?.getEditor()?.getText() || "";
        setPlainContentText(plainContentText);
        setPlainTitleText(plainTitleText);
        setOpenPreviewDialog(true);
    };

    return (
        <div className='md:max-w-screen-md w-full p-6 mb-10 flex flex-col justify-center mx-auto border-none rounded-xl'>
            <form onSubmit={handleAddChapter}>
                <div className='flex flex-row justify-between mb-10'>
                    <div className='flex flex-row items-center gap-2'>
                        <Link href={`/view_webnovels/${webnovelId}`}>
                            <ArrowLeftIcon size={24} />
                        </Link>
                        <h1 className='text-2xl font-bold'>{phrase(dictionary, "addChapter", language)}</h1>
                    </div>
                    {/* <div>
                        <Button color="gray" className='text-sm text-gray-400 px-0 py-0' onClick={() => setOpenModal(true)}>
                        
                            {phrase(dictionary, "draft", language)}
                        </Button>
                    </div> */}
                </div>
                <div className="mr-4 flex flex-col space-y-4 w-full">
                    <div className='flex flex-col space-y-4 items-start'>
                        <p className='text-2xl font-bold'> {webnovel?.title} </p>
                        <p className='text-sm'>
                            {/* 총 .. 화 : total */}
                            {phrase(dictionary, "total", language)}
                            {' '}{webnovel?.chapters_length}
                            {language == 'ko' ? <>{' '}화</> : <>{' '}chapter(s)</>}
                        </p>
                    </div>
                    <hr />
                    <div className="flex flex-col space-y-4 border border-gray-300 rounded-xl">
                        <ReactQuill ref={titleRef} theme="bubble" value={title} onChange={setTitle} className="title-editor" />
                    </div>
                    <div className="flex flex-col space-y-4">
                        <div className="flex flex-row justify-between">
                            <h1 className='text-sm font-bold'>{phrase(dictionary, "content", language)}</h1>
                            <p className='text-sm'>
                                <span className='text-[#DB2777]'>{currText}</span> / {maxText}
                            </p>
                        </div>
                        <div className='w-full max-w-full rounded-xl border border-gray-300'>
                            <ReactQuill ref={contentRef} theme="bubble" value={content} onChange={setContent} className="content-editor" />
                        </div>

                        <div className='flex flex-row justify-end gap-4 items-end mb-10'>
                            <Button
                                type="submit"
                                variant="outline"
                                color="gray"
                                disabled={uploading}
                                className='whitespace-nowrap hover:border-[#DB2777] hover:bg-[#DB2777] hover:text-white'
                            >{uploading ? <Loader2 className='animate-spin' /> : phrase(dictionary, "publish", language)}</Button>
                            {/* <Button variant="contained" color="bw" onClick={handleClickAIEditor}>{phrase(dictionary, "aieditor", language)}</Button> */}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClickPreview}
                                className='whitespace-nowrap bg-black text-white hover:border-[#DB2777] hover:bg-[#DB2777] hover:text-white'
                            >{phrase(dictionary, "preview", language)}</Button>
                        </div>
                    </div>
                </div>
            </form>
            {/* <AIEditorComponent openModal={openAIEditor} setOpenModal={setOpenAIEditor} text={content} novelLanguage={novelLanguage}/> */}
            <Dialog open={openPreviewDialog} onOpenChange={setOpenPreviewDialog}>
                <DialogContent className='z-[2500] !gap-0 !p-0 overflow-hidden bg-white dark:bg-[#211F21] md:h-[60vh] h-full border-none shadow-none text-md' showCloseButton={true}>
                    {/* z-[2500] for mobile screen which is the bottom navigation bar disturbing the dialog */}
                    <DialogHeader className='text-md p-4'>
                        <DialogTitle>
                            {phrase(dictionary, "preview", language)}
                        </DialogTitle>
                        <p className='text-md text-gray-500'>
                            {phrase(dictionary, "previewWarning", language)}
                        </p>
                    </DialogHeader>
                    <ScrollArea className='h-full p-4'>
                        <DialogDescription className='text-md !p-0'>
                            <div className='flex flex-col space-y-4 min-h-[50vh]'>
                                <div className='inline-flex flex-col gap-2 text-md '>
                                    <h1 className='text-md font-bold'> {phrase(dictionary, "chapterTitle", language)} </h1>
                                    {titleRef.current?.getEditor()?.getText().trim() ?
                                        <p className="w-full text-md font-bold"> {plainTitleText} </p> :
                                        <p className="w-full text-md font-bold"> {phrase(dictionary, "new_chapter_preview_noTitle", language)} </p>
                                    }
                                </div>
                                <div className='inline-flex flex-col gap-2 text-md'>
                                    <h1 className='text-md font-bold'>{phrase(dictionary, "content", language)}</h1>
                                    {contentRef.current?.getEditor()?.getText().trim() ?
                                        <p className="w-full prose dark:prose-invert text-md"> {plainContentText} </p> :
                                        <p className="w-full prose dark:prose-invert text-"> {phrase(dictionary, "new_chapter_preview_noContent", language)} </p>
                                    }
                                </div>
                            </div>
                        </DialogDescription>
                    </ScrollArea>
                    <DialogFooter className="flex flex-row !space-x-0 !p-0 !flex-grow-0 !flex-shrink-0 self-end text-md">
                        <Button
                            onClick={() => setOpenPreviewDialog(false)}
                            className={cn("!rounded-none w-full py-6 text-md font-medium bg-[#DE2B74] hover:bg-[#DE2B74] text-white")}
                        >
                            {phrase(dictionary, "confirm", language)}
                        </Button>
                        <Button
                            onClick={() => setOpenPreviewDialog(false)}
                            className={cn("!rounded-none w-full py-6 text-md font-medium bg-[#b8c1d1] hover:bg-[#a9b2c2] text-white")}
                        >
                            {phrase(dictionary, "close", language)}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default AddChapterComponent;
