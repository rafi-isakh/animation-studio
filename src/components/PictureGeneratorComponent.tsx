import React, { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import { Alert } from '@mui/material';
import { Loader2 } from 'lucide-react';
import GeneratedPicture from '@/components/GeneratedPicture';

interface PictureGeneratorProps {
    prompt: string;
    onComplete: (pictures: string[]) => void;
  }
  
  const PictureGenerator: React.FC<PictureGeneratorProps> = ({ prompt: initialPrompt, onComplete }) => {
    const [pictures, setPictures] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedPrompt, setSavedPrompt] = useState<string>(initialPrompt);
  
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
  
    return (
      <div className="p-4 z-50">
        {error && (
          <Alert severity="error" className="mb-4">
            <p>{error}</p>
          </Alert>
        )}
        
        <div className="space-y-4">
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Selected text: {savedPrompt}
            </p>
          </div>
  
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Generating pictures from your text...
              </p>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <Button
                onClick={generatePictures}
                disabled={!savedPrompt || isLoading}
                className="w-full"
              >
                Generate Pictures
              </Button>
            </div>
          )}
          
          {pictures.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mt-6">
              {pictures.map((picture, index) => (
                <div key={index} className="relative group">
                  <GeneratedPicture index={index} image={picture} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  export default PictureGenerator;