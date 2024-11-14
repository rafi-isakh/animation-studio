import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Brush } from 'lucide-react';

interface FloatingMenuProps {
  children: React.ReactNode;
}

interface Position {
  top: number;
  left: number;
}

export const FloatingMenu: React.FC<FloatingMenuProps> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      
      if (!selection || selection.isCollapsed) {
        setIsVisible(false);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const menuWidth = menuRef.current?.offsetWidth || 0;

      // Calculate position at the bottom-right corner of selection
      const top = rect.bottom + window.scrollY; // 5px spacing from bottom
      const left = rect.right + window.scrollX - (menuWidth / 2); 

      setPosition({ top, left });
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
      className="fixed "
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {children}
    </div>,
    document.body
  );
};

const TextWithFloatingMenu = () => {
  const handleBold = () => {
    document.execCommand('bold', false);
  };

  const handleItalic = () => {
    document.execCommand('italic', false);
  };

  const handleCopy = () => {
    const selection = window.getSelection();
    if (selection) {
      navigator.clipboard.writeText(selection.toString());
    }
  };

  return (
    
      <FloatingMenu>
        <>
        <div className="flex gap-2">
          <button className="rounded-full px-1 py-1 fixed z-50 bg-white shadow-lg p-2 border-2">
              <Brush size={18} className="text-pink-600" />
          </button>
        </div>

        <div className='mt-10 bg-black text-white rounded-xl px-20 py-20'>
            
            text 
        </div>
        </>
      </FloatingMenu>
  );
};

export { TextWithFloatingMenu };