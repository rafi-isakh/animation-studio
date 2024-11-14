import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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

      // Calculate position above the selection
      const menuHeight = menuRef.current?.offsetHeight || 0;
      const top = rect.top + window.scrollY - menuHeight - 10; // 10px spacing
      const left = rect.left + window.scrollX + (rect.width / 2);

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
      className="fixed z-50 bg-white shadow-lg rounded-lg p-2 transform -translate-x-1/2"
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
      <div>
        <div className="max-w-2xl mx-auto p-4">
          <FloatingMenu>
            <div className="flex gap-2">
              <button 
                onClick={handleCopy}
                className="p-2 hover:bg-gray-100 rounded"
              >
                Copy
              </button>
            </div>
          </FloatingMenu>
        </div>
      </div>
    );
  };
  
  export { TextWithFloatingMenu };