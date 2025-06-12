"use client"

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext';
import { Chapter, Webnovel } from '@/components/Types';
import '@/styles/globals.css'
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';
import { ThemeProvider } from '@mui/material';
import AIEditorComponent from '@/components/AIEditorComponent';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.bubble.css';
import 'react-quill/dist/quill.snow.css';
import '@/styles/quill-custom.css';
import { grayTheme } from '@/styles/BlackWhiteButtonStyle';
import { useWebnovels } from '@/contexts/WebnovelsContext';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/shadcnUI/Button';

const EditChapterComponent = ({ chapterId, novelLanguage }: { 
    chapterId: string, 
    novelLanguage: 'ko' | 'en'  // or whatever your Language type is
}) => {
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
    const [openModal, setOpenModal] = useState(false);
    const { getWebnovelIdWithChapterMetadata } = useWebnovels();
    const [chapter, setChapter] = useState<Chapter | undefined>(undefined);
    const [webnovel, setWebnovel] = useState<Webnovel | undefined>(undefined);
    const clicked = useRef(false);
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [lastEdited, setLastEdited] = useState('');
    const [webnovelId, setWebnovelId] = useState('');

    useEffect(() => {
        const fetchChapter = async () => {
            setIsLoading(true);
            try {
                const chapter = await fetch(`/api/get_chapter_by_id?id=${chapterId}`).then(res => res.json());
                if (chapter) {
                    console.log("chapter", chapter);
                    setChapter(chapter);
                    if (chapter.id) {  // Check for chapter ID instead of title
                        // let chapterIndex = webnovel?.chapters?.findIndex(ch => ch.id === chapter?.id) !== undefined ? webnovel?.chapters.findIndex(ch => ch.id === chapter?.id) + 1 : '';
                        setTitle(`Chapter ${chapter.id}`);
                        setContent(chapter.content);
                        setLastEdited(chapter.last_edited);
                    } else {
                        toast({
                            title: "Error",
                            description: "Chapter not found",
                            variant: "destructive",
                        });
                    }
                    // Fetch webnovel data to get chapters array
                    const webnovel = await getWebnovelIdWithChapterMetadata(chapter.webnovel_id.toString());
                    setWebnovelId(chapter.webnovel_id);
                    setWebnovel(webnovel);
                }
            } catch (error) {
                console.error('Error fetching webnovel:', error);
                toast({
                    title: "Error",
                    description: error instanceof Error ? error.message : "Failed to fetch webnovel data",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchChapter();
    }, [chapterId])

    useEffect(() => {
        setCurrText(content.length);
        if (content.length > maxText) {
            setMaxExceeded(true);
        } else {
            setMaxExceeded(false);
        }
    }, [content])

    useEffect(() => {
        if (contentRef.current) {
            const quillEditor = contentRef.current.getEditor();
            if (quillEditor) {
                quillEditor.root.dataset.placeholder = phrase(dictionary, "contentDescription", language);
            }
        }
    }, [dictionary, language, contentRef.current])


    const handleEditChapter = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            setIsLoading(true);
            const formData = new FormData();
            // Get plain text from title editor
            const titleText =  `Chapter ${webnovel?.chapters?.findIndex(ch => ch.id === chapter?.id) !== undefined ? webnovel.chapters.findIndex(ch => ch.id === chapter?.id) + 1 : ''}`

            // Get plain text from content editor
            const contentEditor = contentRef.current?.getEditor();
            const contentText = contentEditor?.getText().trim() || "";

            formData.append('title', titleText);
            formData.append('content', contentText);
            if (!contentText) {
                return;
            }
            formData.append('id', chapter?.id.toString() || '');  // This is the chapter ID
            formData.append('webnovel_id', webnovelId);
            formData.append('last_edited', lastEdited);
            formData.append('language', novelLanguage);
            if (!maxExceeded) {
                let resPromise;
                if (!clicked.current) {
                    resPromise = fetch('/api/edit_chapter', {
                        method: 'POST',
                        body: formData,
                    });
                    clicked.current = true;
                }
                const data = await Promise.resolve(resPromise);
                const response = await data?.json();
                router.push(`/view_webnovels/${webnovelId}/chapter_view/${chapter?.id}`)
                router.refresh();
            }
        } catch (error) {
            console.error('Error updating chapter:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update chapter",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClickAIEditor = (event: React.FormEvent) => {
        event.preventDefault();
        setOpenAIEditor(true);
    };

    const replaceSmartQuotes = (str: string) => {
        return str.replace(/[""]/g, '"').replace(/['']/g, "'");
    };

    return (
        <div className='md:w-[720px] p-6 mb-10 flex flex-col justify-center mx-auto border-none'>
            <form onSubmit={handleEditChapter}>
                <div className='flex flex-row justify-between'>
                    <h1 className='text-2xl font-bold mb-10'>{phrase(dictionary, "editChapter", language)}</h1>
                </div>
                <ThemeProvider theme={grayTheme}>
                    <div className="mr-4 flex flex-col space-y-4 w-full">
                        <div className='flex flex-col space-y-4 items-start'>
                            <p className='text-sm'>
                                {language == 'ko' ?
                                    <>
                                        {webnovel?.chapters?.findIndex(ch => ch.id === chapter?.id) !== undefined ? webnovel.chapters.findIndex(ch => ch.id === chapter?.id) + 1 : ''}
                                        {' '}화
                                    </>
                                    : <>
                                        Episode{' '}
                                        {webnovel?.chapters?.findIndex(ch => ch.id === chapter?.id) !== undefined ? webnovel.chapters.findIndex(ch => ch.id === chapter?.id) + 1 : ''}
                                    </>
                                }
                            </p>
                        </div>
                        <hr />

                        <div className="flex flex-col space-y-4">
                            <div className="flex flex-row justify-between">
                                <h1 className='text-sm font-bold'>{phrase(dictionary, "content", language)}</h1>
                                <p className='text-sm text-[#DB2777]'>{currText} / {maxText}</p>
                            </div>
                            <div className='w-full max-w-full rounded-xl border border-gray-300'>
                                <ReactQuill
                                    ref={contentRef}
                                    theme="bubble"
                                    value={content.replace(/\n/g, "<br/>")}
                                    onChange={setContent}
                                    className="content-editor" />
                            </div>

                            <div className='flex flex-row justify-end gap-4 items-end'>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className='whitespace-nowrap hover:border-[#DB2777] hover:bg-[#DB2777] hover:text-white mb-10'
                                >{isLoading ? <Loader2 className='animate-spin' size={20} /> : phrase(dictionary, "edit", language)}</Button>
                                {/* <Button variant="contained" color="bw" onClick={handleClickAIEditor}>{phrase(dictionary, "aieditor", language)}</Button> */}
                            </div>
                        </div>

                    </div>
                </ThemeProvider>
            </form>
            {/* <AIEditorComponent openModal={openAIEditor} setOpenModal={setOpenAIEditor} text={content} novelLanguage={novelLanguage}/> */}
        </div>
    )
}

export default EditChapterComponent;
