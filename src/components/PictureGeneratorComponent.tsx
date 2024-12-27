'use client'
import React, { useState, useEffect } from 'react';
import Snackbar from '@mui/material/Snackbar';
import { Button, Alert, styled } from '@mui/material';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';
import { Loader2 } from 'lucide-react';
import GeneratedPicture from '@/components/GeneratedPicture';
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronRight } from 'lucide-react';

interface PictureGeneratorProps {
    prompt: string;
    onComplete: (pictures: string[]) => void;
  }
  
  const PictureGenerator: React.FC<PictureGeneratorProps> = ({ prompt: initialPrompt, onComplete }) => {
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
        const response = await fetch('/api/onoma/anima/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: savedPrompt }),
        });
  
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


    return (
      <div className="p-4 z-50">
        <div className="space-y-4">
          <div className="flex md:flex-row flex-col items-center gap-4">
            <div className="flex-1 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">
               {savedPrompt}
              </p>
            </div>
              <Button
                    variant="contained"
                    color="gray"
                    onClick={generatePictures}
                    disabled={isLoading}
                    className='px-4 py-2 font-bold ml-4 bg-white dark:text-pink-600 dark:bg-white 
                        inline-flex items-center justify-center gap-2 min-w-[100px]'
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
            <div className="flex md:flex-row flex-col gap-4 mt-6">
              {pictures.map((picture, index) => (
                <div key={index} className="flex-shrink flex-wrap">
                  <GeneratedPicture index={index} image={picture} />
                </div>
              ))}
            </div>
          )}
          <div className='flex flex-row justify-center border border-black rounded-md w-full'>
            <div className='flex-1 p-4 text-left self-center'>
            
              <p>Free Trial </p>
              <BorderLinearProgress value={30} variant="determinate" />
              <p>1000 credits</p>
           
            </div>
            <div className='flex-1 relative py-8 md:block hidden'>
                <div className='absolute left-0 top-4 bottom-4 w-[1px] bg-black'></div>
               <div className="flex flex-row">
                <div className='pl-6'>
                    <p>Have you enjoyed Toonyz Studio?</p>
                    <p>You can unlock your free trial</p>
                </div>
                <div className='w-8 h-8'>
                  <ChevronRight className='w-8 h-8' />
                </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default PictureGenerator;