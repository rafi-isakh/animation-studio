'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import { Suspense, useEffect, useState } from 'react';

export default function HeaderWrapper() {
    const pathname = usePathname();
    const isChapterView = pathname?.includes('/chapter_view');
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        if (!isChapterView) {
            setIsVisible(true);
            return;
        }

        let timeoutId: NodeJS.Timeout;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Show header when scrolling up, hide when scrolling down
            if (currentScrollY < lastScrollY) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }

            setLastScrollY(currentScrollY);

            // Hide header after 2 seconds of no scrolling
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setIsVisible(false);
            }, 2000);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(timeoutId);
        };
    }, [isChapterView, lastScrollY]);

    // If not in chapter view, always show header
    if (!isChapterView) {
        return (
            <Suspense>
                <Header />
            </Suspense>
        );
    }

    // In chapter view, show/hide based on scroll
    return (
        <div className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
            isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}>
            <Suspense>
                <Header />
            </Suspense>
        </div>
    );
}