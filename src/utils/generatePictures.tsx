
const generatePictures = async (prompt: string, setPictures: (pictures: string[]) => void, setIsGeneratingPictures: (isGeneratingPictures: boolean) => void, setShowPleaseLogin: (showPleaseLogin: boolean) => void, setShowError: (showError: boolean) => void) => {
    setIsGeneratingPictures(true);

    try {
        const response = await fetch('/api/onoma/anima/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
            }),
        });
        if (response.status == 401) {
            setShowPleaseLogin(true);
        }
        if (response.status == 504 || response.status == 500) {
            setShowError(true);
        }
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setPictures(data.images);
        sessionStorage.removeItem('prompt');
    } catch (error) {
        console.error('Error generating pictures:', error);
    } finally {
        setIsGeneratingPictures(false);
    }
};


export async function generatePicturesHandler(req: any, res: any) {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  
    try {
      const { prompt, setPictures, setIsGeneratingPictures, setShowPleaseLogin, setShowError } = req.body;
      
      const pictures = await generatePictures(prompt, setPictures, setIsGeneratingPictures, setShowPleaseLogin, setShowError) 
      
      res.status(200).json({ pictures });
    } catch (error) {
      res.status(500).json({ message: 'Failed to generate pictures' });
    }
  }