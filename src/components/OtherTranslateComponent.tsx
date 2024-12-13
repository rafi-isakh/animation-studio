"use client"
import { useLanguage } from '@/contexts/LanguageContext';
import React, { useState, useEffect, useRef } from 'react';
import { ElementType, ElementSubtype, Language } from '@/components/Types';
import { CircularProgress } from '@mui/material';
import { replaceSmartQuotes } from '@/utils/font';
import { useMediaQuery } from '@mui/material';

const OtherTranslateComponent = React.memo(({ content, elementId, elementType, elementSubtype, defaultLanguage, classParams = "", showLoading = true, incomingText = '', }:
    { content: string, elementId: string, elementType: ElementType, elementSubtype?: ElementSubtype, defaultLanguage?: Language, classParams?: string, showLoading?: boolean, incomingText?: string }) => {
    const [text, setText] = useState(incomingText);
    const { language, isRtl } = useLanguage();
    const initialized = useRef(false);
    const fetchRef = useRef(false);
    const [finished, setFinished] = useState(false)
    const [changeCount, setChangeCount] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        console.log(`Effect running for: ${content}.${elementType}.${elementId}.${language}.${elementSubtype}.${defaultLanguage}.${classParams}.${showLoading}.${incomingText}`);
        return () => {
            console.log(`Cleanup for: ${content}.${elementType}.${elementId}.${language}.${elementSubtype}.${defaultLanguage}.${classParams}.${showLoading}.${incomingText}`);
        };
    }, [content, elementType, elementId, language, elementSubtype, defaultLanguage, classParams, showLoading, incomingText]);

    useEffect(() => {
        setText("");
        setLoading(true);
        const detectLanguage = async () => {
            let originalAndTargetLangSame = false;
            const response = await fetch('/api/detect_language', {
                method: 'POST',
                body: JSON.stringify({ text: content }),
            });
            const data = await response.json();
            const langcode = data.langcode;
            if (langcode == language) {
                setText(content);
                setLoading(false);
                originalAndTargetLangSame = true;
            }
            return originalAndTargetLangSame;
        }

        const handleTranslate = async () => {
            const originalAndTargetLangSame = await detectLanguage();
            if (originalAndTargetLangSame) {
                return;
            }
            // elmeentId is either chapter.id (for chapter title) or webnovel.id (for webnovel title and description) or user_id (for user bio)
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
        if (defaultLanguage != language) {
            if (content) {
                initialized.current = false;
                handleTranslate();
            } else {
                setText("");
                setLoading(false);
            }
        } else {
            setText(content);
            setLoading(false);
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
    }, [changeCount, finished, initialized.current])

    useEffect(() => {
        if (initialized.current && finished) {
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
        const data = {
            "original": content,
            "translation": translation
        }
        try {
            const response = await fetch(`/api/send_content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })

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
        <div style={{ direction: `${isRtl}` as Direction }}>
            {
                loading && showLoading ?
                    (
                        <div role="status" className='w-4 self-center'>
                            {/* genre */}
                            <CircularProgress size="0.8rem" color='secondary' />
                        </div>
                    ) : <div className={`${classParams}`} dangerouslySetInnerHTML={{ __html: replaceSmartQuotes(text).replaceAll("\n", "<br/>") }} />

            }
        </div>
    );
});

export default OtherTranslateComponent;