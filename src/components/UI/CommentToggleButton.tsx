'use client'
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/shadcnUI/Button';
import { ScrollArea } from '@/components/shadcnUI/ScrollArea';
import CommentsComponent from '@/components/CommentsComponent';
import { ToonyzPost } from '@/components/Types';
import { MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';

const CommentToggleButton = ({ post, defaultExpanded = false }: { post: ToonyzPost, defaultExpanded?: boolean }) => {
    const [quoteExpanded, setQuoteExpanded] = useState<boolean>(defaultExpanded);
    const { dictionary, language } = useLanguage();
    const buttonRef = useRef<HTMLButtonElement>(null);
    const divRef = useRef<HTMLDivElement>(null);
    const arrowRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (buttonRef.current && arrowRef.current) {
            if (!defaultExpanded) {
                buttonRef.current.classList.remove('max-h-[300px]', 'opacity-100');
                buttonRef.current.classList.add('max-h-0', 'opacity-0', 'overflow-hidden');

            } else {
                buttonRef.current.classList.remove('max-h-0', 'opacity-0', 'overflow-hidden');
                buttonRef.current.classList.add('max-h-[300px]', 'opacity-100');

            }
        }
    }, [defaultExpanded]);

    const toggleQuote = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setQuoteExpanded(prev => !prev);
        if (buttonRef.current && arrowRef.current) {
            if (buttonRef.current.classList.contains('max-h-0')) {
                buttonRef.current.classList.remove('max-h-0', 'opacity-0', 'overflow-hidden');
                buttonRef.current.classList.add('max-h-[300px]', 'opacity-100');
            } else {
                buttonRef.current.classList.remove('max-h-[300px]', 'opacity-100');
                buttonRef.current.classList.add('max-h-0', 'opacity-0', 'overflow-hidden');
            }
        }
    }, []);

    return (
        <div className="relative top-0 left-0 flex flex-col self-start w-full max-w-xl bg-white dark:bg-[#211F21] rounded-lg">
            <Button
                variant="ghost"
                ref={buttonRef}
                onClick={toggleQuote}
                type="button" size="sm" className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                {post.comments.length} {phrase(dictionary, "comments", language)}
            </Button>
            {post && (
                <div
                    ref={divRef}
                    className={`relative w-full top-1 text-black dark:text-white whitespace-pre-wrap mb-2 text-start self-start transition-opacity duration-300 
                                    ${quoteExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                        }`}
                >
                    <ScrollArea className="md:h-[300px] h-[100px]">
                        <CommentsComponent contentToAttachTo={post} webnovelOrPost={true} addCommentEnabled={true} />
                    </ScrollArea>
                </div>
            )}
            
        </div>
    );
};

export default CommentToggleButton;