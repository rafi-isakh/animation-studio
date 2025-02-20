"use client"
import { useLanguage } from '@/contexts/LanguageContext';
import { useReader } from '@/contexts/ReaderContext';
import { textPostProcess } from '@/utils/font';
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Box, Skeleton } from '@mui/material';
import { marked } from 'marked';

interface WordToken {
    word: string;
    trailing: string; // stores the original whitespace that followed this word
}

const WebnovelTranslateComponent = (
    {
        content,
        chapterId,
        webnovelId,
        sourceLanguage
    }: {
        content: string,
        chapterId: string,
        webnovelId: string,
        sourceLanguage: string
    }) => {

    const [text, setText] = useState('');
    const { language, isRtl } = useLanguage();
    const initialized = useRef(false);
    const fetchRef = useRef(false);
    const [finished, setFinished] = useState(false)
    const [changeCount, setChangeCount] = useState(0)
    const [firstPageWords, setFirstPageWords] = useState("")
    const [secondPageWords, setSecondPageWords] = useState("")
    const [pageToFirstPageWords, setPageToFirstPageWords] = useState<{ [key: number]: string }>({ 1: "" })
    const [pageToSecondPageWords, setPageToSecondPageWords] = useState<{ [key: number]: string }>({ 1: "" })
    const { fontSize,
        fontFamily = 'default',
        lineHeight,
        margin,
        padding,
        scrollType,
        page = 1,
        setPage,
        setMaxPage,
    } = useReader();

    useEffect(() => {
        const handleTranslate = async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_translation?chapter_id=${chapterId}&language=${language}`)
            const data = await response.json();
            if (data.text) {
                setText(await marked(data.text))
            }
            if (!data.done) {
                setText("");
                submitContent(data.text);
            }
        }
        if (sourceLanguage == language) {
            setText(content);
            setFinished(true);
        } else {
            handleTranslate();
        }
    }, [language]);

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
                startTranslation(data.text_id);
            } else {
                console.error('Failed to submit words');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const startTranslation = async (textId: string, cvid: string = '', to_continue: number = 0) => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/translate/${textId}?source=${sourceLanguage}&target=${language}&webnovel_id=${webnovelId}&chapter_id=${chapterId}`);
        const data = await response.json();
        setText(await marked(data.translation));
    };

    type Direction = 'ltr' | 'rtl';

    const paragraphStyle: React.CSSProperties =  {
        margin: `${margin}px`,
        padding: `${padding}px`,
        height: scrollType === 'horizontal' ? '100vh' : 'auto',
        overflowY: scrollType === 'horizontal' ? 'hidden' : 'auto',
        overflowX: scrollType === 'horizontal' ? 'auto' : 'hidden',
        touchAction: scrollType === 'horizontal' ? 'pan-x' : 'auto',
    };

    useEffect(() => {
        if (text && scrollType == 'horizontal') {
            setTimeout(() => {
                // const _firstPageWords = pageWords(text.slice(firstWordIndex), 'pageview-hidden-parent-1');
                // setFirstPageWords(_firstPageWords);
                // const _secondPageWords = pageWords(text.slice(firstWordIndex + _firstPageWords.length), 'pageview-hidden-parent-2');
                // setSecondPageWords(_secondPageWords);
                const [pageToFirstPageWords, pageToSecondPageWords] = calculateAllPages(text);
                setFirstPageWords(pageToFirstPageWords[page])
                setSecondPageWords(pageToSecondPageWords[page])
                setMaxPage(Object.keys(pageToFirstPageWords).length)
            }, 100);
        }
    }, [fontSize, fontFamily, lineHeight, margin, padding, text, scrollType])

    useEffect(() => {
        setFirstPageWords(pageToFirstPageWords[page])
        setSecondPageWords(pageToSecondPageWords[page])
    }, [page])

    const calculateAllPages = (text: string) => {
        let textLeft = text;
        let page = 1;
        let index = 0;
        const _pageToFirstPageWords: { [key: number]: string } = {};
        const _pageToSecondPageWords: { [key: number]: string } = {};
        while (textLeft.length > 0) {
            const _firstPageWords = pageWords(textLeft, `pageview-hidden-parent-1`);
            const _secondPageWords = pageWords(textLeft.slice(_firstPageWords.length), `pageview-hidden-parent-2`);
            index = _firstPageWords.length + _secondPageWords.length;
            textLeft = textLeft.slice(index);
            _pageToFirstPageWords[page] = _firstPageWords;
            _pageToSecondPageWords[page] = _secondPageWords;
            page++;
        }
        setPageToFirstPageWords(_pageToFirstPageWords);
        setPageToSecondPageWords(_pageToSecondPageWords);
        return [_pageToFirstPageWords, _pageToSecondPageWords];
    }

    const pageWords = (text: string, parentId: string) => {
        if (!text) return "";

        // Split text while preserving whitespace
        const tokens: WordToken[] = text.match(/[^\s]+[\s]*/g)?.map(match => ({
            word: match.replace(/\s+$/, ''),
            trailing: match.match(/\s+$/)?.[0] || ''
        })) || [];

        const hiddenDiv = document.createElement('div');
        const parent = document.getElementById(parentId);
        parent?.appendChild(hiddenDiv);
        hiddenDiv.style.color = 'red';
        hiddenDiv.style.whiteSpace = 'pre-wrap';
        hiddenDiv.style.width = '100%';
        const viewHeight = window.innerHeight * 0.7;

        let wordsInDiv = "";
        let neverBroke = true;
        let _wordsCount = 0;

        for (let i = 0; i < tokens.length; i++) {
            wordsInDiv += tokens[i].word + tokens[i].trailing;
            _wordsCount = i;
            hiddenDiv.textContent = wordsInDiv;
            if (hiddenDiv.scrollHeight >= viewHeight!) {
                neverBroke = false;
                break;
            }
        }

        // Reconstruct text with original whitespace
        let _words = tokens.slice(0, _wordsCount)
            .map(token => token.word + token.trailing)
            .join('');

        if (neverBroke) {
            _words = tokens.slice(0, _wordsCount + 1)
                .map(token => token.word + token.trailing)
                .join('');
        }
        hiddenDiv.remove();
        return _words;
    }

    const nextPage = () => { // each page has two half-pages
        if (page < Object.keys(pageToFirstPageWords).length) {
            setPage(prev => prev + 1)
        }
    }

    const prevPage = () => {
        if (page > 1) {
            // setFirstWordIndex(pageToFirstWordIndex[page - 1])
            setPage(prev => prev - 1)
        }
    }

    return (
        <div
            style={paragraphStyle}
            className={`relative mb-16
                       ${scrollType === 'horizontal' ? 'overflow-y-hidden' : ''}`}>
                    {text &&
                     <>
                    {scrollType === 'vertical' &&
                        <div
                            dangerouslySetInnerHTML={{ __html: textPostProcess(text) }}
                            style={{ whiteSpace: 'pre-wrap', direction: `${isRtl}` as Direction }}
                            onContextMenu={(e) => e.preventDefault()}>
                        </div>
                    }
                    {scrollType === 'horizontal' &&
                        <div className='relative flex flex-col'>
                            {/* Navigation buttons - positioned absolutely on the sides */}
                            <div className="fixed top-1/2 left-5 transform -translate-y-1/2 ">
                                <button
                                    onClick={prevPage}
                                    className="p-2 rounded-full bg-white/80 hover:bg-white/90  transition-colors opacity-[0.4] hover:opacity-[1]"
                                    aria-label="Previous page"
                                >
                                    <ChevronLeft size={68} />
                                    {/* Left */}
                                </button>
                            </div>

                            <div className="fixed top-1/2 right-5 transform -translate-y-1/2 ">
                                <button
                                    onClick={nextPage}
                                    className="p-2 rounded-full bg-white/80 hover:bg-white/90 transition-colors opacity-[0.4] hover:opacity-[1]"
                                    aria-label="Next page"
                                >
                                    <ChevronRight size={68} />
                                    {/* Right */}
                                </button>
                            </div>

                            {/* Content */}
                            <div className='flex flex-row'>
                                <div className='flex flex-col w-[calc(50%-1rem)]' id='pageview-hidden-parent-1'>
                                    <div
                                        id='first-half'
                                        className='w-full'
                                        style={{ direction: `${isRtl}` as Direction, whiteSpace: 'pre-wrap' }}
                                        dangerouslySetInnerHTML={{ __html: textPostProcess(firstPageWords) }}
                                        onContextMenu={(e) => e.preventDefault()}>
                                    </div>
                                </div>
                                <div className='w-[4rem]'>
                                </div>
                                <div className='flex flex-col w-[calc(50%-1rem)]' id='pageview-hidden-parent-2'>
                                    <div
                                        id='second-half'
                                        className='w-full'
                                        style={{ direction: `${isRtl}` as Direction, whiteSpace: 'pre-wrap' }}
                                        dangerouslySetInnerHTML={{ __html: textPostProcess(secondPageWords) }}
                                        onContextMenu={(e) => e.preventDefault()}>
                                    </div>
                                </div>
                            </div>
                        </div>
                        }
                     </>
            }
            {!text &&
                <Box sx={{ width: '100%' }}>
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                </Box>
            }
        </div >
    );
};

export default WebnovelTranslateComponent;