"use client"
import { useLanguage } from '@/contexts/LanguageContext';
import { useReader } from '@/contexts/ReaderContext';
import { replaceSmartQuotes } from '@/utils/font';
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from "lucide-react"

const WebnovelTranslateComponent = ({ content, chapterId, margin, padding, wordsPerPage }: { content: string, chapterId: string, margin: number, padding: number, wordsPerPage: number }) => {

    const [text, setText] = useState('');
    const { language, isRtl } = useLanguage();
    const initialized = useRef(false);
    const fetchRef = useRef(false);
    const [finished, setFinished] = useState(false)
    const [changeCount, setChangeCount] = useState(0)
    const { scrollType, page = 1, setPage } = useReader();
    

    useEffect(() => {
        if (fetchRef.current) return;
        fetchRef.current = true;

        const handleTranslate = async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_translation?chapter_id=${chapterId}&language=${language}`)
            const data = await response.json();
            if (data.text) {
                setText(data.text)
            }

            // If there's no translation in the DB
            // initialized.current is bc useEffect runs twice
            // submitContent with ongoing translation
            if (!data.done && !initialized.current) {
                submitContent(data.text);
                initialized.current = true;
            }
        }
        handleTranslate();
    }, []);

    useEffect(() => {
        setChangeCount((prevCount) => prevCount + 1);
    }, [text]);

    useEffect(() => {
        // save every 200 tokens
        if (changeCount > 200) {
            if (!finished && initialized.current) {
                saveTranslationToDB(false);
            }
            setChangeCount(0);
        }
    })

    useEffect(() => {
        if (initialized.current) {
            saveTranslationToDB(true);
        }
    }, [finished])

    const saveTranslationToDB = async (done: boolean) => {
        if (text) {
            const data = {
                "text": text,
                "language": language,
                "chapter_id": chapterId,
                "done": done
            }
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/save_translation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                console.error("Saving translation to DB failed");
            } else {
            }
        }
    }

    const submitContent = async (translation: string) => {
        if (!translation) translation = "";
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/send_content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    'original': content,
                    'translation': translation
                })
            });

            if (response.ok) {
                const data = await response.json();
                startEventSource(data.text_id);
            } else {
                console.error('Failed to submit words');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const startEventSource = (textId: string, cvid: string = '', to_continue: number = 0) => {
        const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_BACKEND}/api/translate/${textId}?target=${language}`);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.ended == 0) {
                setText(text => text + data.token);
            } else if (data.ended == 1) {
                setFinished(true);
            } else if (data.ended == -1) { // continue case
                eventSource.close();
                startEventSource(textId, data.cvid, 1);
            }
        };

        eventSource.onerror = (error) => {
            console.error('EventSource failed:', error);
            eventSource.close();
        };
        return () => {
            eventSource.close();
        };
    };

    type Direction = 'ltr' | 'rtl';

    const getFirstHalf = (text: string) => {
        const words = text.split(' ');  // Split by whitespace but keep the separators
        const totalLength = text.length;
        let currentLength = 0;
        let splitIndex = 0;

        // Find the word boundary closest to the middle
        for (let i = 0; i < words.length; i++) {
            currentLength += words[i].length + 1;
            if (currentLength >= totalLength / 2) {
                splitIndex = i;
                break;
            }
        }
        console.log('firstHalf', splitIndex, words.slice(0, splitIndex).length)
        return words.slice(0, splitIndex).join(' ');
    }

    const getSecondHalf = (text: string) => {
        const words = text.split(' ');  // Split by whitespace but keep the separators
        const totalLength = text.length;
        let currentLength = 0;
        let splitIndex = 0;

        // Find the word boundary closest to the middle
        for (let i = 0; i < words.length; i++) {
            currentLength += words[i].length + 1;
            if (currentLength >= totalLength / 2) {
                splitIndex = i;
                break;
            }
        }
        console.log('secondHalf', splitIndex, words.slice(splitIndex).length)
        return words.slice(splitIndex).join(' ');
    }

    const getPage = (text: string, page: number) => {
        const words = text.split(' ');  // Split on whitespace
        const startIndex = (page - 1) * wordsPerPage;
        const endIndex = page * wordsPerPage;
        const wordsInPage = words.slice(startIndex, endIndex);
        return wordsInPage.join(' ');
    }

    const paragraphStyle = {
        margin: `${margin}px`,
        padding: `${padding}px`,
    };

    return (
        <div className="relative min-h-screen mb-16" style={paragraphStyle}>
            {scrollType === 'vertical' &&
                <div dangerouslySetInnerHTML={{ __html: replaceSmartQuotes(text) }} style={{ whiteSpace: 'pre-wrap', direction: `${isRtl}` as Direction }}>
                </div>
            }
            {scrollType === 'horizontal' &&
                <div className='relative flex flex-col'>
                     {/* Navigation buttons - positioned absolutely on the sides */}
                        <div className="fixed top-1/2 left-5 min-[768px]:left-[40rem] max-[500px]:left-[5rem] transform -translate-y-1/2 ">
                            <button 
                            onClick={() => setPage(prev => prev - 1)}
                            className="p-2 rounded-full bg-white/80 hover:bg-white/90  transition-colors opacity-[0.4] hover:opacity-[1]"
                            aria-label="Previous page"
                            >
                            <ChevronLeft size={68} />
                            {/* Left */}
                            </button>
                        </div>

                        <div className="fixed top-1/2 right-5 min-[768px]:right-[40rem] max-[500px]:right-[5rem] transform -translate-y-1/2 ">
                            <button 
                            onClick={() => setPage(prev => prev + 1)}
                            className="p-2 rounded-full bg-white/80 hover:bg-white/90 transition-colors opacity-[0.4] hover:opacity-[1]"
                            aria-label="Next page"
                            >
                            <ChevronRight size={68} />
                            {/* Right */}
                            </button>
                        </div>

                    {/* Content */}
                    <div className='flex flex-row space-x-16 flex-nowrap'>
                        <div
                            id='first-half'
                            className='w-96'
                            style={{ direction: `${isRtl}` as Direction }}>
                                {getFirstHalf(getPage(replaceSmartQuotes(text), page))}
                        </div>
                        <div
                            id='second-half'
                            className='w-96'
                            style={{ direction: `${isRtl}` as Direction }}>
                                {getSecondHalf(getPage(replaceSmartQuotes(text), page))}
                        </div>
                    </div>
                </div>
            }
        </div>
    );
};

export default WebnovelTranslateComponent;