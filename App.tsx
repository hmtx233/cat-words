
import React, { useState, useEffect, useRef } from 'react';
import { Typewriter } from './components/Typewriter';
import { DraggableCard } from './components/DraggableCard';
import { CardData, Position } from './types';
import { captureCardWithMargins } from './services/imageService';

export default function App() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [maxZIndex, setMaxZIndex] = useState(1);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const modalCardRef = useRef<HTMLDivElement>(null);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedCard(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset copy feedback
  useEffect(() => {
    if (copyFeedback) {
      const timer = setTimeout(() => setCopyFeedback(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copyFeedback]);

  const handlePrint = (text: string) => {
    setIsPrinting(true);

    // Simulate mechanical delay before card appears
    setTimeout(() => {
      const id = Date.now().toString();
      // Add slight randomness to position so they don't stack perfectly
      const randomOffsetX = (Math.random() * 40) - 20;
      const randomOffsetY = (Math.random() * 40) - 20;

      const now = new Date();
      // Format: YYYY/MM/DD MON 14:30
      const dateStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
      const weekDay = now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      const fullTimestamp = `${dateStr} ${weekDay} ${timeStr}`;

      // Calculate initial position ensuring visibility
      // Center horizontally (card width approx 320px, so offset by 160)
      const startX = (windowSize.width / 2) - 160 + randomOffsetX;
      
      // Vertical position:
      // Try to place it in the lower-middle section, but ensure it's not too low (hidden by typewriter)
      // or too high (offscreen).
      // We target roughly 550px from bottom, but ensure at least 100px from top.
      const targetYFromBottom = 550;
      const calculatedY = windowSize.height - targetYFromBottom + randomOffsetY;
      const startY = Math.max(100, Math.min(calculatedY, windowSize.height - 400));

      const newCard: CardData = {
        id,
        text,
        position: { 
          x: startX,
          y: startY
        },
        zIndex: maxZIndex + 1,
        rotation: (Math.random() * 6) - 3, // Random rotation between -3 and 3 degrees
        timestamp: fullTimestamp,
      };

      setCards((prev) => [...prev, newCard]);
      setMaxZIndex((prev) => prev + 1);
      setIsPrinting(false);
    }, 800);
  };

  const updateCardPosition = (id: string, newPos: Position) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === id ? { ...card, position: newPos } : card
      )
    );
  };

  const bringToFront = (id: string) => {
    const newMax = maxZIndex + 1;
    setMaxZIndex(newMax);
    setCards((prev) =>
      prev.map((card) =>
        card.id === id ? { ...card, zIndex: newMax } : card
      )
    );
  };

  const handleRemoveCard = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    if (selectedCard?.id === id) {
      setSelectedCard(null);
    }
  };

  const handleCardDoubleClick = (id: string) => {
    const card = cards.find(c => c.id === id);
    if (card) setSelectedCard(card);
  };

  const handleCopy = () => {
    if (selectedCard) {
      navigator.clipboard.writeText(selectedCard.text);
      setCopyFeedback(true);
    }
  };

  const handleSaveImage = async () => {
    if (!modalCardRef.current || isSaving || !selectedCard) return;
    
    setIsSaving(true);
    try {
      await captureCardWithMargins(
        modalCardRef.current,
        `cat-words-note-${selectedCard.id.slice(-4)}.png`
      );
    } catch (err) {
      console.error("Failed to generate image:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Improved Word Count: Counts CJK characters individually + Space-separated Latin words
  const getWordCount = (text: string) => {
    const cjkCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const nonCjkText = text.replace(/[\u4e00-\u9fa5]/g, ' ');
    const latinCount = nonCjkText.trim().split(/\s+/).filter(Boolean).length;
    return cjkCount + latinCount;
  };

  return (
    <div 
      className={`relative w-screen h-screen overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-[#1c1917]' : 'bg-[#f5f5f4]'}`}
    >
      
      {/* Background Texture / Desk Surface */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none transition-all duration-500"
        style={{
            backgroundImage: `radial-gradient(${isDarkMode ? '#44403c' : '#a8a29e'} 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
        }}
      ></div>
      
      {/* Vignette */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${isDarkMode ? 'bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] opacity-100' : 'bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.1)_100%)] opacity-50'}`}></div>

      {/* Brand Watermark */}
      <div className={`absolute top-8 left-8 font-pixel text-4xl select-none pointer-events-none transition-colors duration-500 ${isDarkMode ? 'text-white/5' : 'text-black/5'}`}>
        CAT WORDS OS v1.0
      </div>

      {/* Theme Toggle Button */}
      <button 
        onClick={toggleTheme}
        className={`
          absolute top-8 right-8 z-50 p-2 rounded-full border shadow-md transition-all
          ${isDarkMode 
            ? 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700' 
            : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
          }
        `}
        title={isDarkMode ? "Switch to Day Mode" : "Switch to Night Mode"}
      >
        {isDarkMode ? (
           // Sun Icon
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
             <circle cx="12" cy="12" r="5"></circle>
             <line x1="12" y1="1" x2="12" y2="3"></line>
             <line x1="12" y1="21" x2="12" y2="23"></line>
             <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
             <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
             <line x1="1" y1="12" x2="3" y2="12"></line>
             <line x1="21" y1="12" x2="23" y2="12"></line>
             <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
             <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
           </svg>
        ) : (
           // Moon Icon
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
             <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
           </svg>
        )}
      </button>

      {/* Cards Layer (The Desk) */}
      <div className="absolute inset-0 z-10 w-full h-full">
        {cards.map((card) => (
          <DraggableCard
            key={card.id}
            data={card}
            onUpdatePosition={updateCardPosition}
            onBringToFront={bringToFront}
            onDoubleClick={handleCardDoubleClick}
            onRemove={handleRemoveCard}
          />
        ))}
      </div>

      {/* Typewriter Interface (Fixed at bottom) */}
      <div className="absolute bottom-0 left-0 w-full z-50 flex justify-center pointer-events-none pb-4">
        <Typewriter onPrint={handlePrint} isPrinting={isPrinting} />
      </div>

      {/* Instructions */}
      {cards.length === 0 && !isPrinting && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 text-stone-500 font-mono text-center select-none pointer-events-none opacity-50 animate-pulse">
           <p>INSERT PAPER TO BEGIN</p>
           <p className="text-xs mt-2 text-stone-600">Type below or use Auto Draft</p>
        </div>
      )}

      {/* Card Details Modal */}
      {selectedCard && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity" 
          onClick={() => setSelectedCard(null)}
        >
          <div 
            ref={modalCardRef}
            className="w-full max-w-lg p-8 pt-12 rounded-[2px] shadow-2xl relative animate-[appear_0.2s_ease-out] bg-[#fbf9f5] border border-[#e5e0d8] overflow-hidden" 
            onClick={e => e.stopPropagation()}
          >
             {/* Paper Texture Overlay for Modal */}
             <div className="absolute inset-0 pointer-events-none opacity-[0.4] mix-blend-multiply" 
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")` }}>
             </div>

             {/* Push Pin Visual for Modal */}
             <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
               {/* Pin Head */}
               <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-600 to-red-800 shadow-[2px_3px_5px_rgba(0,0,0,0.3)] border border-red-900/50 relative">
                 {/* Highlight */}
                 <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-red-300 opacity-60 filter blur-[0.5px]"></div>
               </div>
               {/* Pin Shadow on paper */}
               <div className="absolute top-3 left-2 w-4 h-4 bg-black/30 rounded-full blur-[2px] -z-10 transform skew-x-12"></div>
             </div>

             {/* Header */}
             <div className="flex justify-between items-end border-b border-stone-800/10 pb-4 mb-6 relative z-10">
                <span className="font-pixel text-stone-400 tracking-widest text-lg opacity-70 flex gap-4">
                  <span>ARCHIVE // {selectedCard.id.slice(-4)}</span>
                  <span className="text-sm self-end pb-0.5">{getWordCount(selectedCard.text)} WDS</span>
                </span>
                <span className="font-mono text-stone-500 text-xs font-bold opacity-60 tracking-tight text-right">
                  {selectedCard.timestamp}
                </span>
             </div>
             
             {/* Content */}
             <div className="font-mono text-stone-800 text-xl leading-relaxed whitespace-pre-wrap min-h-[100px] mb-8 relative z-10 drop-shadow-[0_0_1px_rgba(0,0,0,0.05)]">
                {selectedCard.text}
             </div>

             {/* Decorative footer stamp */}
             <div className="absolute bottom-20 right-8 opacity-10 pointer-events-none rotate-[-6deg] mix-blend-multiply z-0">
                <div className="border-2 border-stone-800 px-3 py-1 font-pixel text-xl tracking-widest text-stone-800">
                   CAT WORDS
                </div>
             </div>

             {/* Actions (Excluded from screenshot) */}
             <div className="flex justify-between items-center pt-6 border-t border-stone-800/10 relative z-20" data-html2canvas-ignore="true">
                <button
                    onClick={() => handleRemoveCard(selectedCard.id)}
                    className="px-4 py-2 text-red-700 hover:bg-red-50 hover:text-red-900 font-mono text-sm rounded transition-colors flex items-center gap-2"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Destroy
                </button>

                <div className="flex gap-3">
                    <button
                        onClick={handleSaveImage}
                        disabled={isSaving}
                        className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono text-sm rounded transition-colors flex items-center gap-2 border border-stone-300"
                    >
                        {isSaving ? (
                            <span className="w-4 h-4 border-2 border-stone-500 border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                        )}
                        Save Image
                    </button>
                    <button
                        onClick={handleCopy}
                        className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white font-mono text-sm rounded transition-colors flex items-center gap-2 shadow-sm"
                    >
                        {copyFeedback ? (
                            <span>Copied!</span>
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                                Copy Text
                            </>
                        )}
                    </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
