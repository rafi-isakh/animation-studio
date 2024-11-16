'use Client'
import React, { useEffect, useState, useRef } from 'react';
import { Global } from '@emotion/react';
import { styled } from '@mui/material/styles';
import { Brush, WandSparkles } from 'lucide-react';
import { Box, Button, Modal, Skeleton, Typography, Drawer } from '@mui/material';
import { grey } from '@mui/material/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import { generatePicturesHandler } from '@/utils/generatePictures'
import { PictureGenerator } from '@/components/PictureGeneratorComponent';
import PleaseLoginModal from "@/components/PleaseLoginModal";

type Position = {
    x: number;
    y: number;
    width: number;
    height: number; 
    window?: () => Window;
};

 const StyledBox = styled('div')(({ theme }) => ({
    backgroundColor: '#fff',
    ...theme.applyStyles('dark', {
      backgroundColor: grey[800],
    }),
  }));
  
  const Puller = styled('div')(({ theme }) => ({
    width: 30,
    height: 6,
    backgroundColor: grey[300],
    borderRadius: 3,
    position: 'absolute',
    top: 8,
    left: 'calc(50% - 15px)',
    ...theme.applyStyles('dark', {
      backgroundColor: grey[900],
    }),
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
    };


    const handlePicturesGenerated = (newPictures: string[]) => {
        generatePicturesHandler(newPictures, setPictures)
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
                                  <WandSparkles 
                                   size={16} 
                                   className="text-white-600 hover:text-pink-300 duration-300"
                                   onClick={handleOpenModal}
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
                            // overflow: 'visible',
                        },
                        }}
                    />
                      <Drawer
                        container={container}
                        anchor="bottom"
                        open={open}
                        onClose={toggleDrawer(false)}
                        // swipeAreaWidth={drawerBleeding}
                        // disableSwipeToOpen={false}
                        ModalProps={{
                        keepMounted: true,
                        }}
                        // sx={{ zIndex: 20 }} 
                        >
                        <StyledBox
                            sx={{
                                position: 'absolute',
                                top: -drawerBleeding,
                                borderTopLeftRadius: 20,
                                borderTopRightRadius: 20,
                                visibility: 'visible',
                                right: 0,
                                left: 0,
                                height: '400px',
                            }}
                            >
                        </StyledBox>

                        <Puller />
                        <StyledBox sx={{ px: 2, pb: 2, height: '2%', }} />

                        <p className='text-center z-50 mt-10'>
                        </p>
                        <PictureGenerator
                            selectedText={selectedText}
                            onComplete={handlePicturesGenerated}
                        />
                        <PleaseLoginModal
                            open={showPleaseLogin}
                            setOpen={setShowPleaseLogin}
                        />
                    </Drawer>
                    </>
        </div>
    );
};

export { FloatingMenu }