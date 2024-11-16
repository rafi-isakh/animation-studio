import React, { useState } from 'react';
import { Button } from '@mui/material';
import { Alert } from '@mui/material';
import { Loader2 } from 'lucide-react';

const PictureGenerator = ({ selectedText, onComplete }: { selectedText: string, onComplete: (pictures: string[]) => void }) => {
  const [pictures, setPictures] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const generatePictures = async (text: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Replace this with your actual API endpoint
      const response = await fetch('/api/generate-pictures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: text }),
      });

      if (!response.ok) {
        // Check if it's an authentication error
        if (response.status === 401) {
          throw new Error('Please login to generate pictures');
        }
        throw new Error('Failed to generate pictures');
      }

      const data = await response.json();
      setPictures(data.pictures);
      onComplete?.(data.pictures);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 z-50">
      {error && (
        <Alert  variant="filled"  className="mb-4">
          <p>{error}</p>
        </Alert>
      )}
      
      {isLoading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Generating pictures...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Button
              onClick={() => generatePictures(selectedText)}
              disabled={!selectedText || isLoading}
            >
              Generate Pictures
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{selectedText}</p>
          
          {pictures.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {pictures.map((picture, index) => (
                <img
                  key={index}
                  src={picture}
                  alt={`Generated ${index + 1}`}
                  className="w-full rounded-lg shadow-md"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { PictureGenerator }