'use Client'
import React, { useEffect, useState, useRef } from 'react';
import { Global } from '@emotion/react';
import { styled } from '@mui/material/styles';
import { Box, Button, Modal, Skeleton, Typography, Drawer, SwipeableDrawer, Link, Alert } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import CloseIcon from '@mui/icons-material/Close';
import Tab from '@mui/material/Tab';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import TabContext from '@mui/lab/TabContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import PictureGenerator from '@/components/PictureGeneratorComponent';
import dynamic from 'next/dynamic';
import animationData from '@/assets/shinny.json';
import { X, ArrowRight } from 'lucide-react';
import { Language } from '@/components/Types';
import { useReaderTheme } from '@/contexts/ReaderThemeContext'


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

  const Puller = styled('div')(({ theme }) => ({
    width: 30,
    height: 6,
    backgroundColor: theme.palette.mode === 'light' ? '#4b5563 ' : '#4b5563 ',  // gray-600 #4b5563 
    borderRadius: 3,
    position: 'absolute',
    top: 8,
    left: 'calc(50% - 15px)',
    zIndex: 5,
  }));

const StyledBox = styled('div')(() => ({
    position: 'relative',
    height: '100%',
    overflow: 'auto',
}));


export function TransitionAlerts({ dictionary, language }: { dictionary: any; language: Language }) {
    const [open, setOpen] = useState(true);
  
    return (
      <Box sx={{ width: '100%', mb: 2 }}>
        <Collapse in={true}>
          <Alert
          variant="outlined"
          sx={{ borderColor: '#eeeee4'}}
          severity="info"
          >
             {phrase(dictionary, "toonyzStudioPlay", language)}
          </Alert>
        </Collapse>
      </Box>
    );
  }



const FloatingMenu: React.FC<{ children: React.ReactNode; window?: () => Window; webnovel_id: string; chapter_id: string }> = ({ children, window, webnovel_id, chapter_id }) => {
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
    const [value, setValue] = React.useState('1');
    const drawerRef = useRef<HTMLDivElement>(null);
    const { readerTheme } = useReaderTheme(); 


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
                    width: rect.width,
                    height: rect.height,
                })
                setSelectedText(text)

                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }

                timeoutRef.current = setTimeout(() => {
                    handleClose();
                }, 8000);
            }
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleClose();
                setOpen(false);
            }
        };

        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current && 
                !containerRef.current.contains(event.target as Node) && 
                drawerRef.current &&
                !drawerRef.current.contains(event.target as Node)
            ) {
                // Close floating menu only and clear timeout
                setSelection(undefined);
                setPosition(undefined);
                setSelectedText('');
                setShowMessage(false);
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
            }
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
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

    const handleDrawerClose = () => {
        setOpen(false);
    };

      const handleClose = () => {
        setSelection(undefined);
        setPosition(undefined);
        setSelectedText('');
        setShowMessage(false);
        // setOpen(false);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    }

    // This is used only for the example
    const container = window !== undefined ? () => window().document.body : undefined;

    const handleChange = (event: React.SyntheticEvent, newValue: string) => {
        setValue(newValue);
    };

    return (
        <div className='relative' ref={containerRef} >
            {selection && position && (
                <div
                    className="absolute z-10 w-30"
                    style={{
                        top: `${position.y}px`,
                        left: `${position.x}px`,
                    }}
                >
                <button 
                    className="rounded-full bg-[#FFF0EC] -mt-10"
                    onClick={toggleDrawer(true)} 
                  >
                    <LottieLoader 
                        animationData={animationData} 
                        centered={false} 
                        width="w-[50px]" 
                        className=""
                        />

                  </button>
                  <button 
                    onClick={handleClose}
                    className="absolute -top-8 -right-0" 
                    >
                        <X size={16} className='text-white dark:text-white bg-black rounded-full p-1' />
                    </button>
                </div>
            )}
            {children}
                 <div ref={drawerRef}>
                    <Global
                        styles={{
                            '.MuiDrawer-root > .MuiPaper-root': {
                            zIndex: 1,
                            height: `calc(50% - ${drawerBleeding}px)`,
                        },
                        }}
                    />
                      <SwipeableDrawer
                        container={container}
                        anchor="bottom"
                        open={open}
                        onOpen={toggleDrawer(true)}
                        onClose={handleDrawerClose}
                        swipeAreaWidth={drawerBleeding}
                        disableSwipeToOpen={false}
                        ModalProps={{
                            keepMounted: true,
                        }}
                        sx={{
                            '& .MuiDrawer-paper': {
                                backgroundColor: readerTheme === 'dark' ? 'black' : '#fff',
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
                       <StyledBox
                         sx={{
                            backgroundColor: readerTheme === 'dark' ? 'black' : '#fff',
                            color: readerTheme === 'dark' ? '#ffffff' : '#000000',  // Match the drawer background
                        }}
                       >
                
                        <div className='md:max-w-screen-lg w-full mx-auto text-center z-50 md:mt-10 mt-5'>
                        <TabContext value={value}>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <TabList 
                                onChange={handleChange} 
                                aria-label="Toonyz Studio"
                                sx={{
                                borderColor: '#D62A79',
                                color: '#D62A79',
                                '& .MuiTabs-indicator': {
                                    color: '#D62A79',
                                    backgroundColor: '#D62A79',
                                },
                                '& .Mui-selected': {  // Styles for active tab
                                    color: '#D62A79 !important',
                                },
                                '& .MuiTab-root': {  // Styles for all tabs
                                    color: 'grey',
                                    '&:hover': {
                                        color: '#D62A79',
                                        opacity: 0.7,
                                    }
                                }
                            }}
                            >
                                <Tab label="Image Studio" value="1" />
                                {/* <Tab label="Storyboard" value="2" /> */}
                            </TabList>
                        
                            <TabPanel value="1">
                            <TransitionAlerts dictionary={dictionary} language={language} />
                                <PictureGenerator
                                    prompt={selectedText}
                                    onComplete={handlePicturesGenerated}
                                    webnovel_id={webnovel_id}
                                    chapter_id={chapter_id}
                                />

                            </TabPanel>
                            </Box>
                        </TabContext>

                         </div>

                        </StyledBox>
                       </SwipeableDrawer>
                    </div>
        </div>
    );
};

export { FloatingMenu }