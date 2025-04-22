'use client'
import React from 'react'
import { useEffect, useRef } from 'react';
import styles from './style.module.css';
import gsap from 'gsap';

interface RoundedButtonProps {
    children: React.ReactNode;
    backgroundColor?: string;
    className?: string;
    [key: string]: any;
}
export default function RoundedButton({ children, backgroundColor = "#DE2B74", className, ...attributes }: RoundedButtonProps) {

    const circle = useRef(null);
    let timeline = useRef<gsap.core.Timeline | null>(null);
    let timeoutId: NodeJS.Timeout | null = null;
    useEffect(() => {
        timeline.current = gsap.timeline({ paused: true })
        timeline.current
            .to(circle.current, { top: "-25%", width: "150%", duration: 0.4, ease: "power3.in" }, "enter")
            .to(circle.current, { top: "-150%", width: "125%", duration: 0.25 }, "exit")
    }, [])

    const manageMouseEnter = () => {
        if (timeoutId) clearTimeout(timeoutId)
        if (timeline.current) {
            timeline.current.tweenFromTo('enter', 'exit');
        }
    }

    const manageMouseLeave = () => {
        timeoutId = setTimeout(() => {
            if (timeline.current) {
                timeline.current.play();
            }
        }, 300)
    }

    return (
        <>
            <div
                className={`${styles.roundedButton} ${className}`}
                style={{ overflow: "hidden" }}
                onMouseEnter={() => { manageMouseEnter() }}
                onMouseLeave={() => { manageMouseLeave() }} {...attributes}>
                {
                    children
                }
                <div ref={circle} style={{ backgroundColor }} className={styles.circle}></div>
            </div>
        </>
    )
}