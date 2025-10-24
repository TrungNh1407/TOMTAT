import React, { useState, useEffect, useRef } from 'react';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { DocumentCheckIcon } from './icons/DocumentCheckIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
// Fix: Imported MobileView from the shared types file and removed the local definition.
import type { MobileView } from './types';

interface MobileNavProps {
  activeView: MobileView;
  setActiveView: (view: MobileView) => void;
  resultAvailable: boolean;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeView, setActiveView, resultAvailable }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchStartTime, setTouchStartTime] = useState<number | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const bottomTriggerRef = useRef<HTMLDivElement>(null);
  
  // Auto-hide functionality for better mobile experience
  useEffect(() => {
    let hideTimeout: ReturnType<typeof setTimeout>;

    const showNav = () => {
        setIsVisible(true);
        clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => {
            setIsVisible(false);
        }, 3000);
    };

    const handleUserActivity = () => {
        showNav();
    };

    // General interaction
    document.addEventListener('touchstart', handleUserActivity);

    // Specific scroll logic for the main content area
    const mainContent = document.querySelector('.lg\\:hidden main');
    const handleScroll = () => {
        if (!mainContent) return;
        const { scrollTop, scrollHeight, clientHeight } = mainContent;
        // Show nav if user scrolls within 50px of the bottom
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50;

        if (isNearBottom) {
            // If near the bottom, show the nav and prevent it from hiding
            clearTimeout(hideTimeout);
            setIsVisible(true);
        } else {
            // Otherwise, treat it as a normal activity that shows the nav temporarily
            handleUserActivity();
        }
    };
    
    if (mainContent) {
        mainContent.addEventListener('scroll', handleScroll);
    }
    
    // Initial show
    showNav();

    return () => {
        clearTimeout(hideTimeout);
        document.removeEventListener('touchstart', handleUserActivity);
        if (mainContent) {
            mainContent.removeEventListener('scroll', handleScroll);
        }
    };
  }, []);

  // Bottom edge swipe detection
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const windowHeight = window.innerHeight;
      
      // Check if touch started in bottom 50px of screen
      if (touch.clientY >= windowHeight - 50) {
        setTouchStartY(touch.clientY);
        setTouchStartTime(Date.now());
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY === null || touchStartTime === null) return;
      
      const touch = e.touches[0];
      const deltaY = touchStartY - touch.clientY;
      const deltaTime = Date.now() - touchStartTime;
      
      // If swiping up from bottom edge
      if (deltaY > 30 && deltaTime < 500) {
        setIsVisible(true);
        setTouchStartY(null);
        setTouchStartTime(null);
      }
    };

    const handleTouchEnd = () => {
      setTouchStartY(null);
      setTouchStartTime(null);
    };

    // Add touch event listeners to document
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [touchStartY, touchStartTime]);

  const NavButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    disabled?: boolean;
    children: React.ReactNode;
    label: string;
  }> = ({ isActive, onClick, disabled = false, children, label }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex-1 flex flex-col items-center justify-center py-1 transition-colors duration-200 relative
        ${isActive 
          ? 'text-[--color-accent-600] dark:text-[--color-accent-400]' 
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      `}
      aria-label={label}
    >
      {isActive && (
        <div className="absolute top-[-1px] left-0 right-0 h-[2px] bg-[--color-accent-500]" />
      )}
      {children}
      <span className={`text-xs mt-1 ${isActive ? 'font-bold' : 'font-semibold'}`}>{label}</span>
    </button>
  );

  return (
    <>
      {/* Bottom trigger zone for swipe detection */}
      <div
        ref={bottomTriggerRef}
        className="fixed bottom-0 left-0 right-0 h-2 z-40 pointer-events-none"
        style={{ backgroundColor: 'transparent' }}
      />
      
      {/* Navigation bar */}
      <div
        ref={navRef}
        className={`
          fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm 
          border-t border-slate-200 dark:border-slate-800 z-50
          transform transition-transform duration-300 ease-in-out
          ${isVisible ? 'translate-y-0' : 'translate-y-full pointer-events-none'}
        `}
      >
        <div className="flex justify-around items-center max-w-md mx-auto">
          <NavButton
            isActive={activeView === 'source'}
            onClick={() => setActiveView('source')}
            label="Nguồn"
          >
            <BookOpenIcon className="w-5 h-5" />
          </NavButton>
          
          <NavButton
            isActive={activeView === 'result'}
            onClick={() => setActiveView('result')}
            disabled={!resultAvailable}
            label="Kết quả"
          >
            <DocumentCheckIcon className="w-5 h-5" />
          </NavButton>
          
          <NavButton
            isActive={activeView === 'chat'}
            onClick={() => setActiveView('chat')}
            disabled={!resultAvailable}
            label="Trò chuyện"
          >
            <ChatBubbleIcon className="w-5 h-5" />
          </NavButton>
        </div>
      </div>
    </>
  );
};

export default MobileNav;