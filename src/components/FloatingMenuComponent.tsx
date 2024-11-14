import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Brush } from 'lucide-react';

const FloatingMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();

      if (!selection || selection.isCollapsed) {
        setIsVisible(false);
        return;
      }

      const selectedText = selection.toString().trim();
      
      // Only show the menu if there's actual text selected (not just whitespace)
      if (!selectedText) {
        setIsVisible(false);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Position the menu slightly above and to the right of the selection
      setPosition({
        x: rect.left + (rect.width / 2) - 20,  // Center horizontally
        y: rect.top - 40  // Position above the selection
      });
      
      setIsVisible(true);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!isVisible) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-50"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {children}
    </div>,
    document.body
  );
};

const TextWithFloatingMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedText, setSelectedText] = useState<string>('');
    const [showMessage, setShowMessage] = useState(false);
  
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection) {
        const text = selection.toString().trim();
         // Only update selectedText if there's actual text (not just whitespace)
        if (text) {
            setSelectedText(text);
        } else {
            setSelectedText('');
        }
      }
    };
  
    useEffect(() => {
      document.addEventListener('mouseup', handleSelection);
      return () => {
        document.removeEventListener('mouseup', handleSelection);
      };
    }, []);
  
    const handleCopy = () => {
      if (selectedText) {
        navigator.clipboard.writeText(selectedText);
      }
    };
  

  return (
    <div className="relative">
      {children}
      <FloatingMenu>
        <div className='flex flex-row transition-all'>
          <button 
            className="rounded-full h-8 p-3.5 border-2 border-black hover:bg-gray-100 transition-colors shadow-lg duration-300 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-400 inline-block text-transparent "
            // bg-clip-text
            onClick={() => setShowMessage(!showMessage)}
                 >
            {/* <Brush size={16} className="text-pink-600" /> */}
          </button>
      


          {showMessage && selectedText && (
            <div className="flex flex-row gap-2 mt-3 rounded-md px-4 py-3 bg-black text-white shadow-lg max-w-xs duration-300 animate-fade-in"> 
              <div className="flex flex-col">
                <p className="text-sm truncate">
                  {selectedText}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Would you like to make it with Toonyz studio ?
                </p>
              </div>
              <button 
                className="transition-colors shadow-lg self-center"
                onClick={handleCopy}
              >
                <Brush size={16} className="text-pink-600 hover:text-gray-300 duration-300" />
              </button>
            </div>
          )}

        </div>
      </FloatingMenu>
    </div>
  );
};


export { FloatingMenu, TextWithFloatingMenu }