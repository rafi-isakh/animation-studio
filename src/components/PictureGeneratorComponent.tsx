'use client'
import React, { useState, useEffect } from 'react';
import Snackbar from '@mui/material/Snackbar';
import { Button, Alert, styled, Box } from '@mui/material';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import GeneratedPicture from '@/components/GeneratedPicture';
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronRight, CircleHelp, Settings, Loader2 } from 'lucide-react';

interface PictureGeneratorProps {
    prompt: string;
    onComplete: (pictures: string[]) => void;
    webnovel_id: string;
    chapter_id: string;
  }
  
  const PictureGenerator: React.FC<PictureGeneratorProps> = ({ prompt: initialPrompt, onComplete, webnovel_id, chapter_id }) => {
    const [pictures, setPictures] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedPrompt, setSavedPrompt] = useState<string>(initialPrompt);
    const { dictionary, language } = useLanguage();
    const [showAlert, setShowAlert] = useState(false);

    useEffect(() => {
      if (initialPrompt) {
        setSavedPrompt(initialPrompt);
      }
    }, [initialPrompt]);
  
    const generatePictures = async () => {
      if (!savedPrompt) {
        setError('Please provide a prompt');
        return;
      }
  
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/generate_pictures?text=${savedPrompt}&n=4`)
  
        if (!response.ok) {
          switch (response.status) {
            case 401:
              throw new Error('Please login to generate pictures');
            case 429:
              throw new Error('Too many requests. Please try again later.');
            default:
              throw new Error('Failed to generate pictures');
          }
        }
  
        const data = await response.json();
        
        if (!data.images || !Array.isArray(data.images)) {
          throw new Error('Invalid response format from server');
        }
  
        setPictures(data.images);
        onComplete(data.images);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };
  
    useEffect(() => {
      if (error) {
          setShowAlert(true);
          // Set timer to hide alert
          const timer = setTimeout(() => {
              setShowAlert(false);
          }, 5000);
          // Cleanup timer
          return () => clearTimeout(timer);
      }
  }, [error]);


  const BorderLinearProgress = styled(LinearProgress)(() => ({
    height: 10,
    borderRadius: 5,
    [`&.${linearProgressClasses.colorPrimary}`]: {
      backgroundColor: '#eee',
    },
    [`& .${linearProgressClasses.bar}`]: {
      borderRadius: 5,
      backgroundColor: '#1a90ff',
    },
  }));

  const InfoTooltip = styled(({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} classes={{ popper: className }} />
  ))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: '#f5f5f9',
      color: 'rgba(0, 0, 0, 0.87)',
      maxWidth: 320,
      padding: '5px',
      border: '1px solid #dadde9',
    },
  }));

    return (
      <div className="z-50 select-none">

            {/* picture generator */}
  
         <div className="flex md:flex-row flex-col items-center gap-4 space-y-4">
          <div className="flex-1 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg flex flex-col min-h-[100px]">
          {/* Text content with scrolling if needed */}
          <div className="flex-1 overflow-y-auto">
              <p className="text-sm text-gray-600 dark:text-gray-300  p-4">
                  {savedPrompt}
              </p>
          </div>

          <div className='flex-shrink-0 flex flex-row justify-between text-gray-500'>
            <div className='flex flex-row gap-4 p-4 items-center '>
            {savedPrompt.length}/{savedPrompt.length}
            <InfoTooltip title={
                  <div className='flex flex-row justify-center rounded-md w-full'>
                    {phrase(dictionary, "preparing", language)}
                  </div>
              }
            placement="bottom">
              <CircleHelp size={16} />
            </InfoTooltip>

            <InfoTooltip title={
                  <div className='flex flex-row justify-center border border-black rounded-md w-full'>
                    <div className='flex-1 p-4 text-left self-center'>
                    
                      <p>{phrase(dictionary, "freeTrial", language)}</p>
                      <BorderLinearProgress value={30} variant="determinate" />
                      <p>1000 credits</p>
                  
                    </div>
                    <div className='flex-1 relative py-8 px-2'>
                        <div className='absolute left-0 top-4 bottom-4 w-[1px] bg-black'></div>
                      <div className="flex flex-row">
                        <div className='px-2'>
                            <p>{phrase(dictionary, "haveYouEnjoyed", language)}</p>
                            <p>{phrase(dictionary, "youCanUnlock", language)}</p>
                        </div>
                        <div className='self-center'>
                          <ChevronRight size={16} />
                        </div>
                        </div>
                    </div>
                  </div>
              } placement="bottom">
              <Settings size={16} />
            </InfoTooltip>
            </div>
              <Button
                    variant="text"
                    sx={{
                      color: 'gray',
                      backgroundColor: 'white',
                      borderRadius: '10px',
                      padding: '10px',
                      fontWeight: 'bold',
                      minWidth: '100px',
                      alignSelf: 'flex-end',
                    }}
                    onClick={generatePictures}
                    disabled={isLoading}
                    className='px-4 py-2 font-bold ml-4 bg-white dark:text-pink-600 dark:bg-white 
                        inline-flex items-center justify-center gap-2 min-w-[100px] self-end'
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin text-pink-600" />
                            <span className="text-[16px]">
                                {phrase(dictionary, "generatingPrompt", language)}
                            </span>
                        </>
                    ) : (
                        <>
                            <span className="text-[16px]">
                                {phrase(dictionary, "generatePrompt", language)}
                            </span>
                            {/* Palette icon */}
                            <svg 
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-palette text-pink-600"
                            >
                                <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                                <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                                <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
                                <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
                            </svg>
                        </>
                    )}
                </Button>
              </div>
            </div>
              
          </div>
           {error && showAlert && (
                <Snackbar
                    open={showAlert}
                    autoHideDuration={5000}
                    onClose={() => setShowAlert(false)}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                    <Alert 
                        severity="error" 
                        onClose={() => setShowAlert(false)}
                        className="w-full"
                    >
                        <p>{phrase(dictionary, "error", language)}</p>
                    </Alert>
                </Snackbar>
            )}
        

          {pictures.length > 0 && (
            <div className="flex md:flex-row flex-col gap-4 mt-6 select-none">
              {pictures.map((picture, index) => (
                <div key={index} className="flex-shrink flex-wrap">
                  <GeneratedPicture index={index} image={picture} webnovel_id={webnovel_id} chapter_id={chapter_id} quote={savedPrompt}/>
                </div>
              ))}
            </div>
          )}
          
      </div>
    );
  };
  
  export default PictureGenerator;