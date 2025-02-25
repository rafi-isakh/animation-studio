'use Client'
import React, { useEffect, useState, useRef } from 'react';
import { Global } from '@emotion/react';
import { styled } from '@mui/material/styles';
import { Box, Modal, Skeleton, Typography, SwipeableDrawer, Link, Alert } from '@mui/material';
import Collapse from '@mui/material/Collapse';
import Tab from '@mui/material/Tab';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import TabContext from '@mui/lab/TabContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import PictureGenerator from '@/components/PictureGeneratorComponent';
import dynamic from 'next/dynamic';
import { X, ArrowRight, Home, WandSparkles, Compass, Clapperboard, Image, Share2, Sparkles } from 'lucide-react';
import { Language } from '@/components/Types';
import { useTheme } from '@/contexts/providers'
import BlobButton from '@/components/UI/BlobButton';


const LottieLoader = dynamic(() => import('@/components/LottieLoader'), {
    ssr: false,
});
import animationData from '@/assets/shinny.json';

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
                    sx={{ borderColor: '#eeeee4' }}
                    severity="info"
                >
                    {phrase(dictionary, "toonyzStudioPlay", language)}
                </Alert>
            </Collapse>
        </Box>
    );
}

interface FloatingMenuNavItem {
    icon: React.ReactNode;
    label: string;
    href: string;
    color: string;
}

const FloatingMenuNavItems: FloatingMenuNavItem[] = [
    { icon: <LottieLoader animationData={animationData} className='w-30 h-30' />, label: 'Home', href: '#', color: 'bg-black/10 dark:bg-black' },
    { icon: <Image size={30} />, label: 'Explore', href: '#', color: 'bg-gray-200/20 dark:bg-gray-500/10  hover:bg-blue-500/10' },
    { icon: <Clapperboard size={30} />, label: 'Search', href: '#', color: 'bg-gray-200/20 dark:bg-gray-500/10 hover:bg-green-500/10' },
    { icon: <Share2 size={30} />, label: 'Search', href: '#', color: 'bg-gray-200/20 dark:bg-gray-500/10 hover:bg-yellow-500/10' },
];



const FloatingMenuNav: React.FC<{ toggleDrawer: (newOpen: boolean) => () => void }> = ({ toggleDrawer }) => {

    return (

        // <BlobButton text={<div> button</div>} />
        <div className="relative mx-auto z-150">
           
            <div className="rounded-full dark:bg-black/50 backdrop-blur-sm relative">
              
                <div className="flex">
                    {FloatingMenuNavItems.map((item) => (
                        <div key={item.label} className="flex-auto hover:w-full group rounded-full">
                            <Link href="#" onClick={toggleDrawer(true)} className="!no-underline flex items-center justify-center text-center mx-auto p-1 ">
                                <span className={`${item.color} backdrop-blur-md flex flex-row px-5 py-5 rounded-full group-hover:text-[#DE2B74] text-black dark:text-white`}>
                                    {item.icon}
                                
                                </span>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </div>

    );
};


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
    const { theme } = useTheme();

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
        // open drawer 
        setOpen(true);
        setShowIsModal(true);
    }

    const toggleDrawer = (newOpen: boolean) => (event?: React.MouseEvent | React.KeyboardEvent) => {
        if (event) {
            event.preventDefault();
        }
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
                        top: `${position.y + position.height + 30}px`,
                        left: `${position.x - 30}px`,
                    }}
                    onClick={handleClose}
                >
            
                    <style jsx global>{`
                        ::selection {
                             @apply ${theme === 'light' && theme === 'light' ? 'bg-[#FEF0D4]' : 'dark:bg-[rgba(25,118,210,0.1)] bg-[rgba(25,118,210,0.1)]'}
                             @apply ${theme === 'dark' && theme === 'dark' ? 'bg-[rgba(25,118,210,0.1)]' : 'bg-[#FEF0D4]'};
                            text-decoration: underline;
                            text-decoration-color: #DE2B74;
                            text-decoration-thickness: 2px;
                            text-decoration-style: solid;
                        }
                        `}</style>
                    <FloatingMenuNav toggleDrawer={toggleDrawer} />
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
                    onOpen={handleOpenModal}
                    onClose={handleDrawerClose}
                    swipeAreaWidth={drawerBleeding}
                    disableSwipeToOpen={false}
                    ModalProps={{
                        keepMounted: true,
                    }}
                    sx={{
                        '& .MuiDrawer-paper': {
                            backgroundColor: theme === 'dark' && theme === 'dark' ? '#211F21' : '#fff',
                            height: {
                                xs: '70%',    // Mobile height
                                sm: '70%',    // Tablet height
                                md: '50%'     // Desktop height
                            },
                            width: {
                                xs: '100%',   // Full width on mobile
                                sm: '80%',    // 80% width on tablet
                                md: '50%'     // 60% width on desktop
                            },
                            margin: 'auto',   // Center the drawer
                            overflow: 'hidden',
                            border: '0px',
                            borderTopLeftRadius: '15px',
                            borderTopRightRadius: '15px',
                            boxShadow: 'none'
                        },
                    }}
                >
                    {/* Puller */}
                    <Puller />
                    {/* Content */}
                    <StyledBox
                        sx={{
                            backgroundColor: theme === 'dark' && theme === 'dark' ? '#211F21' : '#fff',
                            color: theme === 'dark' ? '#ffffff' : '#000000',  // Match the drawer background
                            borderTopLeftRadius: '5px',
                            borderTopRightRadius: '5px',
                            boxShadow: 'none'
                        }}
                    >
                        <div className='md:max-w-screen-lg w-full mx-auto text-center z-50 md:mt-10 mt-5 select-none'>
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
        </div >
    );
};

export { FloatingMenu }