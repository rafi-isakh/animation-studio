'use Client'
import React, { useEffect, useState, useRef } from 'react';
import { Global } from '@emotion/react';
import { styled } from '@mui/material/styles';
import { Brush, WandSparkles, Paintbrush } from 'lucide-react';

import { Box, Button, Modal, Skeleton, Typography, Drawer, SwipeableDrawer } from '@mui/material';
import { grey } from '@mui/material/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import PictureGenerator from '@/components/PictureGeneratorComponent';
import dynamic from 'next/dynamic';
import animationData from '@/assets/shinny.json';

const LottieLoader = dynamic(() => import('@/components/LottieLoader'), {
    ssr: false,
  });



type Position = {
    x: number;
    y: number;
    width: number;
    height: number; 
    window?: () => Window;
};

  const drawerBleeding = 24;

  const Puller = styled('div')(({ theme }) => ({
    width: 30,
    height: 6,
    backgroundColor: theme.palette.mode === 'light' ? '#4b5563 ' : '#4b5563 ',
    // gray-600 #4b5563 
    borderRadius: 3,
    position: 'absolute',
    top: 8,
    left: 'calc(50% - 15px)',
    zIndex: 1000,
  }));

const StyledBox = styled('div')(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'light' ? '#fff' : '#ffffff',
    position: 'relative',
    height: '100%',
    overflow: 'auto',
}));


const FloatingMenu: React.FC<{ children: React.ReactNode; window?: () => Window }> = ({ children, window }) => {
    const [selection, setSelection] = useState<string>()
    const [position, setPosition] = useState<Position | undefined>();
    const [selectedText, setSelectedText] = useState<string>('');
    const [showMessage, setShowMessage] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [showIsModal, setShowIsModal] = useState(false);
    const { language, dictionary } = useLanguage();
    const [open, setOpen] = useState(false);
    const drawerBleeding = 56
    const [showPleaseLogin, setShowPleaseLogin] = useState(false);
    const [isGeneratingPictures, setIsGeneratingPictures] = useState(false);
    const [showError, setShowError] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [pictures, setPictures] = useState([]);

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


    const toggleDrawer = (newOpen: boolean) => () => {
      setOpen(newOpen);
      setShowIsModal(true);
    };


    const handlePicturesGenerated = (newPictures: string[]) => {
        setOpen(true); 
    };
        
    // This is used only for the example
    const container = window !== undefined ? () => window().document.body : undefined;


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
                    className="rounded-full bg-[#FFF0EC] -mt-10"
                    onClick={() => setShowMessage(!showMessage)}
                  >
                    <LottieLoader 
                        animationData={animationData} 
                        centered={false} 
                        width="w-[50px]" 
                        className=""
                        />


                  </button>
                    {showMessage && selectedText && (
                        <div className="flex flex-row gap-2 mt-3 rounded-md pl-4 py-3 bg-black text-white shadow-lg max-w-xs duration-300 animate-fade-in"> 
                            <div className="flex flex-col">
                                <p className="text-sm">
                                    {truncateText(selectedText, 100)}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {/* Ceate magic with Toonyz Studio Play? */}
                                    {phrase(dictionary, "toonyzStudioPlay", language)}
                                </p>
                            </div>
                            <button 
                                className="transition-colors shadow-lg self-center"
                            >
                                <Button onClick={toggleDrawer(true)}>
                                    {/* Open */}
                                  {/* <WandSparkles 
                                   size={16} 
                                   className="text-white-600 hover:text-pink-300 duration-300"
                                   onClick={handleOpenModal}
                                /> */} <LottieLoader 
                                            animationData={animationData} 
                                            centered={false} 
                                            width="w-[40px]" 
                                            className=""
                                            />
                                </Button>
                            </button>
                        </div>
                    )}
                </div>
            )}
            {children}
                 <>
                    <Global
                        styles={{
                        '.MuiDrawer-root > .MuiPaper-root': {
                            zIndex: 30,
                            height: `calc(50% - ${drawerBleeding}px)`,
                        },
                        }}
                    />
                      <SwipeableDrawer
                        container={container}
                        anchor="bottom"
                        open={open}
                        onOpen={toggleDrawer(true)}
                        onClose={toggleDrawer(false)}
                        swipeAreaWidth={drawerBleeding}
                        disableSwipeToOpen={false}
                        ModalProps={{
                            keepMounted: true,
                        }}
                        sx={{
                            '& .MuiDrawer-paper': {
                                height: {
                                    xs: '70%',    // Mobile height
                                    sm: '70%',    // Tablet height
                                    md: '50%'     // Desktop height
                                },
                                overflow: 'visible',
                                borderTopLeftRadius: 16,
                                borderTopRightRadius: 16,
                            },
                        }}
                        >
                       {/* Puller */}
                        <Puller />

                       {/* Content */}
                       <StyledBox>
                        <div className='md:max-w-screen-lg w-full mx-auto text-center z-50 md:mt-10 mt-5'>
                        <PictureGenerator
                            prompt={selectedText}
                            onComplete={handlePicturesGenerated}
                        />
                         </div>
                        </StyledBox>
                    </SwipeableDrawer>
                    </>
        </div>
    );
};

export { FloatingMenu }