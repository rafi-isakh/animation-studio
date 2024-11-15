import React, { useEffect, useState, useRef } from 'react';
import { Brush } from 'lucide-react';

type Position = {
    x: number;
    y: number;
    width: number;
    height: number; 
};

const FloatingMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selection, setSelection] = useState<string>()
    const [position, setPosition] = useState<Position | undefined>();
    const [selectedText, setSelectedText] = useState<string>('');
    const [showMessage, setShowMessage] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const handleSelectionChange = () => {
            const activeSelection = document.getSelection()
            if (!activeSelection) return;
            const text = activeSelection.toString().trim()
            if (!text) return;
            const rect = activeSelection.getRangeAt(0).getBoundingClientRect()
            const containerRect = containerRef.current?.getBoundingClientRect();

            if (containerRect) {
                setSelection(text)
                setPosition({
                    x: rect.left - containerRect.left + (rect.width / 2) - (30 / 2),
                    y: rect.top - containerRect.top - 30,
                    // y: rect.top - window.scrollY - 30,
                    width: rect.width,
                    height: rect.height,
                })
                setSelectedText(text)

                // Clear any existing timeout
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }

                // Set a new timeout to clear the selection after 3 seconds
                timeoutRef.current = setTimeout(() => {
                    setSelection(undefined);
                    setPosition(undefined);
                    setSelectedText('');
                    setShowMessage(false);
                }, 2000);
            }
        }

        document.addEventListener('selectionchange', handleSelectionChange)
        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange)
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        }
    }, []);

    return (
        <div className='relative' ref={containerRef}>
            {selection && position && (
                <div
                    className="absolute z-50 w-30"
                    style={{
                        top: `${position.y}px`,
                        left: `${position.x}px`,
                    }}
                >
                    <button 
                        className="rounded-full h-8 p-3.5 border-2 border-black hover:bg-gray-100 transition-colors shadow-lg duration-300 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-400 inline-block text-transparent bg-clip-text"
                        onClick={() => setShowMessage(!showMessage)}
                    >
                        <Brush size={16} className="text-pink-600" />
                    </button>
                    {showMessage && selectedText && (
                        <div className="flex flex-row gap-2 mt-3 rounded-md px-4 py-3 bg-black text-white shadow-lg max-w-xs duration-300 animate-fade-in"> 
                            <div className="flex flex-col">
                                <p className="text-sm !truncate">
                                    {selectedText}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Would you like to make it with Toonyz studio ?
                                </p>
                            </div>
                            <button 
                                className="transition-colors shadow-lg self-center"
                            >
                                <Brush size={16} className="text-pink-600 hover:text-gray-300 duration-300" />
                            </button>
                        </div>
                    )}
                </div>
            )}
            {children}
        </div>
    );
};

export { FloatingMenu }