'use Client'
import React, { useEffect, useState, useRef } from 'react';
import { Brush, WandSparkles } from 'lucide-react';
import { Box, Button, Modal } from '@mui/material';
import { useModalStyle } from '@/styles/ModalStyles';
import { ModalBody } from 'flowbite-react';

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
    const [showIsModal, setShowIsModal] = useState(false);

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
                }, 8000);
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

    const truncateText = (text: string, maxLength: number): string => {
      if (text.length <= maxLength) return text;
      return text.slice(0, maxLength) + '...';
    };


    const handleOpenModal = () => {
      setShowIsModal(true);
  }

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
                    className="rounded-full px-1 py-1 border-2 border-black bg-black"
                    onClick={() => setShowMessage(!showMessage)}
                  >
                    {/* <Brush 
                      size={16} 
                      className="transition-colors duration-300 " // Changed this line
                    /> */}
                   <WandSparkles className='text-pink-300' />
                   {/* <i className="fas fa-magic text-[1.2rem]" ></i> */}

                  </button>
                    {showMessage && selectedText && (
                        <div className="flex flex-row gap-2 mt-3 rounded-md px-4 py-3 bg-black text-white shadow-lg max-w-xs duration-300 animate-fade-in"> 
                            <div className="flex flex-col">
                                <p className="text-sm">
                                    {truncateText(selectedText, 100)}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Ceate magic with Toonyz Studio Play?
                                </p>
                            </div>
                            <button 
                                className="transition-colors shadow-lg self-center"
                            >
                                <WandSparkles size={16} className="text-white-600 hover:text-pink-300 duration-300"
                                onClick={handleOpenModal}
                                />
                            </button>
                        </div>
                    )}
                </div>
            )}
            {children}

                {/* <Box sx={useModalStyle}  open={showIsModal} onClose={() => setShowIsModal(false)}>
                    <div className='flex flex-col space-y-4 text-black dark:text-black'>

                      Hi 

                    </div>
                </Box> */}
        </div>
    );
};

export { FloatingMenu }