'use client'
import { useState, useEffect } from 'react';
import LinearProgress from '@mui/material/LinearProgress';

interface ProgressBarProps {
    page?: number;
    maxPage?: number;
    scrollType: 'horizontal' | 'vertical';
}
const ProgressBar: React.FC<ProgressBarProps> = ({ page, maxPage, scrollType }) => {
    const [scrollPercent, setScrollPercent] = useState(0);

    useEffect(() => {
        if (scrollType === 'horizontal') {
            // Handle horizontal pagination
            console.log(page, maxPage);
            if (page && maxPage) {
                setScrollPercent(Math.floor((page / maxPage) * 100));
            }
        } else {
            // Handle vertical scrolling
            const handleScroll = () => {
                const windowHeight = window.innerHeight;
                const documentHeight = document.documentElement.scrollHeight - windowHeight;
                const scrolled = window.scrollY;
                const percent = Math.floor((scrolled / documentHeight) * 100);
                setScrollPercent(percent);
            };

            // Add scroll event listener
            window.addEventListener('scroll', handleScroll);
            // Initial calculation
            handleScroll();

            return () => window.removeEventListener('scroll', handleScroll);
        }
    }, [page, maxPage, scrollType]);


    return (
        <div className="w-full fixed md:top-14 top-[4.9rem] z-50">
            <LinearProgress variant="determinate" value={scrollPercent} color="inherit" />
        </div>
    );
}

export default ProgressBar;