// src/components/QuoteToggle.tsx
import React, { useState, useRef, useCallback } from 'react';
import OtherTranslateComponent from "@/components/OtherTranslateComponent";
import { ScrollArea } from '@/components/shadcnUI/ScrollArea';

interface QuoteToggleProps {
    quote: string;
    postId: string;
    defaultExpanded?: boolean;
}

const ToonyzPostQuoteToggle: React.FC<QuoteToggleProps> = ({ quote, postId, defaultExpanded = true }) => {
    const [quoteExpanded, setQuoteExpanded] = useState<boolean>(defaultExpanded);
    const quoteRef = useRef<HTMLParagraphElement>(null);
    const arrowRef = useRef<HTMLSpanElement>(null);

    React.useEffect(() => {
        if (quoteRef.current && arrowRef.current) {
            if (!defaultExpanded) {
                quoteRef.current.classList.remove('max-h-[300px]', 'opacity-100');
                quoteRef.current.classList.add('max-h-0', 'opacity-0', 'overflow-hidden');
                arrowRef.current.style.transform = 'rotate(0deg)';
            } else {
                quoteRef.current.classList.remove('max-h-0', 'opacity-0', 'overflow-hidden');
                quoteRef.current.classList.add('max-h-[300px]', 'opacity-100');
                arrowRef.current.style.transform = 'rotate(90deg)';
            }
        }
    }, [defaultExpanded]);

    const toggleQuote = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setQuoteExpanded(prev => !prev);
        if (quoteRef.current && arrowRef.current) {
            if (quoteRef.current.classList.contains('max-h-0')) {
                quoteRef.current.classList.remove('max-h-0', 'opacity-0', 'overflow-hidden');
                quoteRef.current.classList.add('max-h-[300px]', 'opacity-100');
                arrowRef.current.style.transform = 'rotate(90deg)';
            } else {
                quoteRef.current.classList.remove('max-h-[300px]', 'opacity-100');
                quoteRef.current.classList.add('max-h-0', 'opacity-0', 'overflow-hidden');
                arrowRef.current.style.transform = 'rotate(0deg)';
            }
        }
    }, []);

    return (
        <div className="flex flex-col self-start">
            <button
                type="button"
                onClick={toggleQuote}
                className="text-sm text-gray-500 flex items-center gap-1 cursor-pointer"
            >
                <span
                    ref={arrowRef}
                    className="transform transition-transform duration-200"
                    style={{
                        display: 'inline-block',
                        transform: quoteExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                    }}
                >
                    ▶
                </span>
                Quote
            </button>

            {quote && (
                <p
                    ref={quoteRef}
                    className={`text-black dark:text-white whitespace-pre-wrap mb-2 text-start self-start transition-opacity duration-300 ${
                        quoteExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                    }`}
                >
                    <ScrollArea className="md:h-[150px] h-[100px]">
                        <OtherTranslateComponent content={quote} elementId={postId} elementType="toonyz_post" elementSubtype="quote" />
                    </ScrollArea>
                </p>
            )}
        </div>
    );
};

export default ToonyzPostQuoteToggle;