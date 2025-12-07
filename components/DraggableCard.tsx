import React, { useState, useEffect, useRef } from 'react';
import { CardData, Position } from '../types';
import { captureCardWithMargins } from '../services/imageService';
import { playTypeSound } from '../services/audioService';

interface DraggableCardProps {
  data: CardData;
  onUpdatePosition: (id: string, newPos: Position) => void;
  onBringToFront: (id: string) => void;
  onDoubleClick: (id: string) => void;
  onRemove: (id: string) => void;
}

export const DraggableCard: React.FC<DraggableCardProps> = ({
  data,
  onUpdatePosition,
  onBringToFront,
  onDoubleClick,
  onRemove,
}) => {
  const [typedContent, setTypedContent] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const dragOffset = useRef<Position>({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // Improved Word Count: Counts CJK characters individually + Space-separated Latin words
  const getWordCount = (text: string) => {
    const cjkCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const nonCjkText = text.replace(/[\u4e00-\u9fa5]/g, ' ');
    const latinCount = nonCjkText.trim().split(/\s+/).filter(Boolean).length;
    return cjkCount + latinCount;
  };

  const wordCount = getWordCount(data.text);

  // Typing effect
  useEffect(() => {
    if (typedContent.length < data.text.length) {
      const timeout = setTimeout(() => {
        setTypedContent(data.text.slice(0, typedContent.length + 1));
        // Decoupled audio: Play sound on every other character to keep rhythm steady at high speed
        if (typedContent.length % 2 === 0) {
           playTypeSound();
        }
      }, 10); // Fast speed: 10ms per character
      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
    }
  }, [typedContent, data.text]);

  // Sync DOM position when props change (and not dragging)
  useEffect(() => {
    if (!isDragging && cardRef.current) {
      cardRef.current.style.left = `${data.position.x}px`;
      cardRef.current.style.top = `${data.position.y}px`;
    }
  }, [data.position, isDragging]);

  // Dragging logic
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    
    // Immediate visual feedback
    onBringToFront(data.id);
    setIsDragging(true);
    
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      // Critical: Capture pointer to track fast movements outside element
      cardRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !cardRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const newX = e.clientX - dragOffset.current.x;
    const newY = e.clientY - dragOffset.current.y;

    // DIRECT DOM MANIPULATION for maximum sensitivity (bypassing React render cycle)
    cardRef.current.style.left = `${newX}px`;
    cardRef.current.style.top = `${newY}px`;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      
      if (cardRef.current) {
        cardRef.current.releasePointerCapture(e.pointerId);
        
        // Sync final DOM position to React state
        const finalX = parseFloat(cardRef.current.style.left || '0');
        const finalY = parseFloat(cardRef.current.style.top || '0');
        onUpdatePosition(data.id, { x: finalX, y: finalY });
      }
    }
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExiting(true);
    // Wait for animation to complete before removing from DOM
    setTimeout(() => {
        onRemove(data.id);
    }, 300);
  };

  const handleSaveImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaving || !cardRef.current) return;
    
    setIsSaving(true);
    try {
      await captureCardWithMargins(
        cardRef.current, 
        `cat-words-note-${data.id.slice(-4)}.png`
      );
    } catch (err) {
      console.error("Failed to save image", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate dynamic style for feeding animation
  const getDynamicStyle = () => {
    const style: React.CSSProperties = {
      position: 'absolute',
      // Note: left/top are initialized here but updated via direct DOM manipulation during drag
      left: data.position.x,
      top: data.position.y,
      zIndex: data.zIndex,
      ['--tw-rotate' as any]: `${data.rotation}deg`,
      cursor: isDragging ? 'grabbing' : 'grab',
      touchAction: 'none', // Critical: prevents scrolling on touch devices
    };

    // Feeding Animation: If typing and not dragging, shift translateY downwards initially 
    // and move it to 0 as text completes, simulating paper moving UP (feed out).
    if (isTyping && !isDragging) {
      const progress = Math.min(typedContent.length / (data.text.length || 1), 1);
      // Start 60px lower (positive Y) and move to 0
      const feedOffset = (1 - progress) * 60;
      style['--tw-translate-y' as any] = `${feedOffset}px`;
    }

    return style;
  };

  return (
    <div
      ref={cardRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick(data.id);
      }}
      style={getDynamicStyle()}
      className={`
        group
        transform
        w-80 min-h-[220px] p-6 pt-10
        bg-[#fbf9f5]
        shadow-[3px_3px_15px_rgba(0,0,0,0.15)] 
        border border-[#e5e0d8]
        
        /* Transition optimized for responsiveness: Position (left/top) is NOT transitioned */
        transition-[transform,box-shadow,opacity] ease-out
        
        relative overflow-visible
        rounded-[2px]
        will-change-transform
        
        ${isExiting ? 'duration-300 scale-0 opacity-0' : 'duration-200'}
        
        /* Hover effects - only active when NOT dragging and NOT exiting */
        ${!isDragging && !isExiting ? 'hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1' : ''}
        
        /* Dragging effects: Instant snap (duration-0) */
        ${isDragging ? 'shadow-[10px_20px_40px_rgba(0,0,0,0.3)] scale-[1.05] z-50 duration-0' : ''}
      `}
    >
      {/* Paper Texture Overlay */}
      <div className="absolute inset-0 overflow-hidden rounded-[2px] pointer-events-none">
          <div className="absolute inset-0 opacity-[0.4] mix-blend-multiply" 
               style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")` }}>
          </div>
      </div>

      {/* Push Pin Visual */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
         {/* Pin Head */}
         <div className="w-4 h-4 rounded-full bg-gradient-to-br from-red-600 to-red-800 shadow-[1px_2px_4px_rgba(0,0,0,0.3)] border border-red-900/50 relative">
             {/* Highlight */}
             <div className="absolute top-1 left-1 w-1 h-1 rounded-full bg-red-300 opacity-60 filter blur-[0.5px]"></div>
         </div>
         {/* Pin Shadow */}
         <div className="absolute top-3 left-2 w-3 h-3 bg-black/30 rounded-full blur-[1.5px] -z-10 transform skew-x-12"></div>
      </div>

      {/* Action Buttons */}
      <div 
        className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 pointer-events-none scale-90"
        data-html2canvas-ignore="true"
      >
        <button
          onClick={handleSaveImage}
          onPointerDown={(e) => e.stopPropagation()} 
          className="w-8 h-8 bg-stone-100 text-stone-600 rounded-full flex items-center justify-center shadow-md border border-stone-200 hover:bg-amber-100 hover:text-amber-800 hover:scale-110 transition-all pointer-events-auto"
          title="Save as Image"
        >
          {isSaving ? (
             <div className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          )}
        </button>

        <button
          onClick={handleRemoveClick}
          onPointerDown={(e) => e.stopPropagation()} 
          className="w-8 h-8 bg-stone-800 text-white rounded-full flex items-center justify-center shadow-md border border-stone-700 hover:bg-red-900 hover:scale-110 transition-all pointer-events-auto"
          title="Discard Card"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Metadata Header */}
      <div className="flex justify-between items-end border-b border-stone-800/10 pb-2 mb-4 relative z-10 pointer-events-none">
        <div className="text-[10px] text-stone-400 font-pixel tracking-widest uppercase opacity-70 flex gap-2">
          <span>SEQ // {data.id.slice(-4)}</span>
          <span className="opacity-50">|</span>
          <span>{wordCount} WDS</span>
        </div>
        <div className="text-[9px] text-stone-500 font-mono font-bold opacity-60 tracking-tight text-right leading-tight max-w-[120px]">
          {data.timestamp}
        </div>
      </div>

      {/* Typed Text */}
      <div className="font-mono text-stone-800 text-[1.1rem] leading-relaxed whitespace-pre-wrap select-none pointer-events-none relative z-10 drop-shadow-[0_0_1px_rgba(0,0,0,0.05)]">
        {typedContent}
        {isTyping && (
          <span className="inline-block w-2 h-5 bg-stone-800 ml-1 animate-type-cursor align-middle opacity-70"></span>
        )}
      </div>

      {/* Decorative Stamp Footer */}
      <div className="absolute bottom-4 right-5 opacity-10 pointer-events-none rotate-[-8deg] mix-blend-multiply z-0">
         <div className="border-2 border-stone-800 px-2 py-0.5 font-pixel text-xs tracking-widest text-stone-800">
           CAT WORDS
         </div>
      </div>
    </div>
  );
};
