import React, { useState, useRef, useEffect } from 'react';
import { generateCreativeText } from '../services/geminiService';
import { playTypeSound, playPrintSound } from '../services/audioService';

const PREDEFINED_MESSAGES = [
  "Initiating system boot sequence...",
  "Load high memory area: OK.",
  "Mounting virtual volumes...",
  "Synthesizing nostalgia circuits...",
  "Ready for user input."
];

interface TypewriterProps {
  onPrint: (text: string) => void;
  isPrinting: boolean;
}

export const Typewriter: React.FC<TypewriterProps> = ({ onPrint, isPrinting }) => {
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBatchPrinting, setIsBatchPrinting] = useState(false);
  const [hasPrintedBatch, setHasPrintedBatch] = useState(false);
  
  // Ref to handle unmounting safety during async loops
  const isMounted = useRef(true);
  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    // Play sound if adding characters (typing), not deleting
    if (newVal.length > inputText.length) {
      playTypeSound();
    }
    setInputText(newVal);
  };

  const handlePrintClick = () => {
    if (inputText.trim() && !isPrinting && !isBatchPrinting) {
      playPrintSound();
      onPrint(inputText);
      setInputText('');
    }
  };

  const handleAiGenerate = async () => {
    if (isGenerating || isPrinting || isBatchPrinting) return;
    setIsGenerating(true);
    const text = await generateCreativeText();
    if (isMounted.current) {
      // Simulate typing sound for AI arrival? Maybe not, silent arrival is spookier/cooler.
      setInputText(text);
      setIsGenerating(false);
    }
  };

  const handlePrintAll = async () => {
    if (isPrinting || isGenerating || isBatchPrinting) return;
    setIsBatchPrinting(true);

    for (const msg of PREDEFINED_MESSAGES) {
       if (!isMounted.current) break;
       
       setInputText(msg);
       // Typing simulation delay
       await new Promise(r => setTimeout(r, 600)); 
       
       if (!isMounted.current) break;
       playPrintSound();
       onPrint(msg);
       setInputText(''); 
       
       // Delay between cards
       await new Promise(r => setTimeout(r, 1200)); 
    }

    if (isMounted.current) {
      setIsBatchPrinting(false);
      setHasPrintedBatch(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePrintClick();
    }
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto pointer-events-auto flex flex-col items-center">
      
      {/* Platen (The Roller) */}
      <div className="w-[92%] h-12 bg-gradient-to-b from-[#1a1a1a] via-[#2a2a2a] to-[#0a0a0a] rounded-lg shadow-2xl relative z-0 border-b border-white/5 mx-auto">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:4px_4px]"></div>
      </div>

      {/* The Paper (Input Area) */}
      <div 
        className={`
          relative z-10 w-[85%] -mt-6 bg-[#fdfbf7] 
          shadow-[0_0_15px_rgba(0,0,0,0.5)] 
          transition-all duration-500 ease-in-out origin-bottom
          ${isPrinting ? '-translate-y-[200px] opacity-0 rotate-1' : 'translate-y-0 opacity-100 rotate-0'}
        `}
        style={{ minHeight: '160px', clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' }}
      >
         {/* Paper texture/watermark */}
         <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-repeat space-y-6 p-6">
             {[...Array(6)].map((_,i) => <div key={i} className="h-px w-full bg-stone-900"></div>)}
         </div>

         <textarea
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="..."
            disabled={isPrinting || isGenerating || isBatchPrinting}
            className="w-full h-full bg-transparent p-8 pb-10 border-none outline-none font-mono text-stone-800 text-xl resize-none placeholder-stone-300 leading-relaxed"
            spellCheck={false}
         />
         
         {/* Character Count */}
         <div className="absolute bottom-2 right-4 text-[10px] text-stone-400 font-pixel tracking-widest pointer-events-none select-none opacity-60">
            {inputText.length} CHARS
         </div>
      </div>

      {/* Typewriter Body (Chassis) */}
      <div className="w-full relative z-20 -mt-2">
        
        {/* Main Body Shape */}
        <div className="bg-[#262626] rounded-[2rem] p-4 shadow-2xl border-t-8 border-[#1f1f1f] relative overflow-hidden">
          
          {/* Metallic Sheen */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

          {/* Key Deck */}
          <div className="bg-[#1a1a1a] rounded-xl p-6 shadow-inner border border-white/5 flex flex-col gap-6 items-center">
            
            {/* Brand Label */}
            <div className="bg-black/50 px-4 py-1 rounded border border-white/10 shadow mb-2">
               <span className="text-amber-500/60 font-pixel tracking-[0.2em] text-xs">CAT WORDS RETRO</span>
            </div>

            <div className="flex items-center justify-center gap-4 md:gap-8 w-full">
                
                {/* Left Action: Auto Gen */}
                <div className="flex flex-col items-center gap-2">
                    <button
                        onClick={handleAiGenerate}
                        disabled={isGenerating || isPrinting || isBatchPrinting}
                        className="
                          group relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#e0e0e0] border-[6px] border-[#111] shadow-[0_5px_0_#000]
                          active:shadow-none active:translate-y-[5px] active:border-[4px]
                          transition-all flex items-center justify-center
                          disabled:opacity-50 disabled:cursor-not-allowed
                        "
                        title="AI Auto Draft"
                    >
                       <div className="w-10 h-10 rounded-full border border-stone-300 bg-[#f0f0f0] flex items-center justify-center shadow-inner group-hover:bg-blue-50 transition-colors">
                           {isGenerating ? <div className="w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin"></div> : <span className="text-stone-600 font-bold text-lg font-mono">AI</span>}
                       </div>
                    </button>
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Draft</span>
                </div>

                {/* Middle: Space / Print Bar */}
                <div className="flex-1 max-w-xs">
                    <button
                      onClick={handlePrintClick}
                      disabled={!inputText.trim() || isPrinting || isGenerating || isBatchPrinting}
                      className="
                        w-full h-16 rounded bg-[#8a1c1c] border-b-[6px] border-[#5c1010] shadow-[0_4px_10px_rgba(0,0,0,0.5)]
                        active:border-b-0 active:translate-y-[6px] active:shadow-none
                        transition-all flex items-center justify-center
                        disabled:bg-[#3d3d3d] disabled:border-[#222] disabled:cursor-not-allowed
                      "
                    >
                      <span className="text-white/90 font-mono text-xl font-bold tracking-[0.2em] uppercase drop-shadow-md">
                        Print
                      </span>
                    </button>
                </div>

                {/* Right Action: Batch / Replay */}
                 <div className="flex flex-col items-center gap-2">
                    <button
                        onClick={handlePrintAll}
                        disabled={isGenerating || isPrinting || isBatchPrinting}
                        className="
                          group relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#e0e0e0] border-[6px] border-[#111] shadow-[0_5px_0_#000]
                          active:shadow-none active:translate-y-[5px] active:border-[4px]
                          transition-all flex items-center justify-center
                          disabled:opacity-50 disabled:cursor-not-allowed
                        "
                        title={hasPrintedBatch ? "Replay Last Batch" : "Batch Print All"}
                    >
                       <div className="w-10 h-10 rounded-full border border-stone-300 bg-[#f0f0f0] flex items-center justify-center shadow-inner group-hover:bg-yellow-50 transition-colors">
                           <span className="text-stone-600 font-bold text-xs md:text-sm font-mono">
                             {hasPrintedBatch ? "AGAIN" : "ALL"}
                           </span>
                       </div>
                    </button>
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                      {hasPrintedBatch ? "Replay" : "Batch"}
                    </span>
                </div>

            </div>
            
            {/* Decorative Keyboard Rows (Visual Only) */}
            <div className="w-full flex flex-col gap-2 opacity-30 pointer-events-none scale-90 hidden md:flex">
                <div className="flex justify-center gap-2">
                     {[...Array(10)].map((_, i) => <div key={i} className="w-8 h-8 rounded-full bg-black shadow ring-1 ring-white/10"></div>)}
                </div>
                <div className="flex justify-center gap-2 px-4">
                     {[...Array(9)].map((_, i) => <div key={i} className="w-8 h-8 rounded-full bg-black shadow ring-1 ring-white/10"></div>)}
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
