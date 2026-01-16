"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// Pricing Constants (Estimated for Gemini API)
const COST_PER_IMAGE = 0.04; // $0.04 per image
const COST_PER_TEXT_CHAR = 0.0000005; // Approx cost for text processing per character

interface CostContextType {
    isClockedIn: boolean;
    isSessionEnded: boolean;
    startTime: number | null;
    endTime: number | null;
    textCost: number;
    textCount: number;
    imageCost: number;
    imageCount: number;
    totalCost: number;
    clockIn: () => void;
    clockOut: () => void;
    restartSession: () => void;
    trackImageGeneration: (count?: number) => void;
    trackTextUsage: (charCount: number) => void;
    downloadInvoice: () => void;
}

const CostContext = createContext<CostContextType | undefined>(undefined);

export const CostProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isClockedIn, setIsClockedIn] = useState(false);
    const [isSessionEnded, setIsSessionEnded] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [endTime, setEndTime] = useState<number | null>(null);

    const [textCost, setTextCost] = useState(0);
    const [textCount, setTextCount] = useState(0);
    const [imageCost, setImageCost] = useState(0);
    const [imageCount, setImageCount] = useState(0);

    const clockIn = useCallback(() => {
        setIsClockedIn(true);
        setIsSessionEnded(false);
        setStartTime(Date.now());
        setEndTime(null);
        // Reset counters on fresh start
        if (!isSessionEnded) {
            setTextCost(0);
            setTextCount(0);
            setImageCost(0);
            setImageCount(0);
        }
    }, [isSessionEnded]);

    const clockOut = useCallback(() => {
        setIsClockedIn(false);
        setIsSessionEnded(true);
        setEndTime(Date.now());
    }, []);

    const restartSession = useCallback(() => {
        // Reset everything and clock in immediately
        setTextCost(0);
        setTextCount(0);
        setImageCost(0);
        setImageCount(0);
        setStartTime(Date.now());
        setEndTime(null);
        setIsSessionEnded(false);
        setIsClockedIn(true);
    }, []);

    const trackImageGeneration = useCallback((count = 1) => {
        if (!isClockedIn) return;
        setImageCount(prev => prev + count);
        setImageCost(prev => prev + (count * COST_PER_IMAGE));
    }, [isClockedIn]);

    const trackTextUsage = useCallback((charCount: number) => {
        if (!isClockedIn) return;
        setTextCost(prev => prev + (charCount * COST_PER_TEXT_CHAR));
        setTextCount(prev => prev + 1);
    }, [isClockedIn]);

    const formatDateTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('en-US', {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const downloadInvoice = useCallback(() => {
        if (!startTime) return;

        const end = endTime || Date.now();
        const durationMs = end - startTime;
        const durationHrs = (durationMs / (1000 * 60 * 60)).toFixed(2);
        const total = textCost + imageCost;

        const invoiceContent = `
==================================================
        MITHRIL API USAGE INVOICE
==================================================

[SESSION DETAILS]
Status:       ${isClockedIn ? 'Active' : 'Ended'}
Start Time:   ${formatDateTime(startTime)}
End Time:     ${endTime ? formatDateTime(endTime) : 'N/A'}
Duration:     ${durationHrs} Hours

[USAGE BREAKDOWN]
--------------------------------------------------
1. Text Planning / Prompts
   - Prompts Generated: ${textCount}
   - Estimated Cost:    $${textCost.toFixed(4)}

2. Image Generation
   - Images Created:    ${imageCount}
   - Rate per Image:    $${COST_PER_IMAGE}
   - Subtotal:          $${imageCost.toFixed(4)}

==================================================
TOTAL ESTIMATED COST: $${total.toFixed(4)}
==================================================
        `.trim();

        const blob = new Blob([invoiceContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice_Mithril_${new Date().toISOString().slice(0,10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [startTime, endTime, isClockedIn, textCost, textCount, imageCost, imageCount]);

    return (
        <CostContext.Provider value={{
            isClockedIn,
            isSessionEnded,
            startTime,
            endTime,
            textCost,
            textCount,
            imageCost,
            imageCount,
            totalCost: textCost + imageCost,
            clockIn,
            clockOut,
            restartSession,
            trackImageGeneration,
            trackTextUsage,
            downloadInvoice
        }}>
            {children}
        </CostContext.Provider>
    );
};

export const useCostTracker = () => {
    const context = useContext(CostContext);
    if (!context) {
        throw new Error("useCostTracker must be used within a CostProvider");
    }
    return context;
};