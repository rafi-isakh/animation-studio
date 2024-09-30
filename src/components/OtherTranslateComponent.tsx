"use client"
import { useLanguage } from '@/contexts/LanguageContext';
import React, { useState, useEffect, useRef } from 'react';
import { ElementType, ElementSubtype } from '@/components/Types';

const OtherTranslateComponent = ({ content, elementId, elementType, elementSubtype, classParams = "", showLoading = true, incomingText = '' }:
    { content: string, elementId: string, elementType: ElementType, elementSubtype?: ElementSubtype, classParams?: string, showLoading?: boolean, incomingText?: string }) => {
    const [text, setText] = useState(incomingText);
    const { language, isRtl } = useLanguage();
    const initialized = useRef(false);
    const fetchRef = useRef(false);
    const [finished, setFinished] = useState(false)
    const [changeCount, setChangeCount] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (fetchRef.current) return;
        fetchRef.current = true;

        const handleTranslate = async () => {
            // elmeentId is either chapter_id (for chapter title) or webnovel_id (for webnovel title and description) or user_id (for user bio)
            const sessionKey = `${elementType}.${elementId}.${language}.${elementSubtype}`;
            const subtypeOrNot = elementSubtype ? `&element_subtype=${elementSubtype}` : '';
            const sessionData = localStorage.getItem(sessionKey)
            if (sessionData) {
                setText(sessionData)
                setLoading(false)
            }
            else {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_other_translation?element_type=${elementType}&element_id=${elementId}&language=${language}${subtypeOrNot}`)
                const data = await response.json();
                if (data.text) {
                    setText(data.text);
                    setLoading(false)
                    localStorage.setItem(sessionKey, data.text)
                }

                // If there's no translation in the DB
                // initialized.current is bc useEffect runs twice
                // submitContent with ongoing translation
                if (!data.done && !initialized.current) {
                    submitContent(data.text);
                    initialized.current = true;
                }
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
            setLoading(false)
            saveTranslationToDB(true);
        }
    }, [finished])

    const saveTranslationToDB = async (done: boolean) => {
        if (text) {
            const data = {
                "text": text,
                "language": language,
                "element_id": elementId,
                "element_type": elementType,
                "element_subtype": elementSubtype || null,
                "done": done
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/save_other_translation`, {
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

    const startEventSource = (textId: string) => {
        setLoading(false);
        const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_BACKEND}/api/translate/${textId}?target=${language}`);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.ended == 0) {
                setText(text => text + data.token);
            } else if (data.ended == 1) {
                setFinished(true);
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

    return (
        <div className={`${classParams}`} style={{ direction: `${isRtl}` as Direction }}>
            {
                loading && showLoading ?
                    <div role="status" className='w-4'>
                        {/*Spinny*/}

                        <svg aria-hidden="true" className="text-gray-200 animate-spin dark:text-gray-600 fill-pink-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                        </svg>
                        <span className="sr-only">Loading...</span>
                    </div> :
                    text
            }
        </div>
    );
};

export default OtherTranslateComponent;