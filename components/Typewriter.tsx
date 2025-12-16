import React, { useState, useRef, useEffect } from "react";
import { PromptTemplate } from "../types";
import { generateWithPrompt } from "../services/geminiService";
import { playTypeSound, playPrintSound } from "../services/audioService";

interface TypewriterProps {
  onPrint: (text: string, promptId?: string, promptName?: string) => void;
  isPrinting: boolean;
  selectedPrompt: PromptTemplate | null;
  onClearPrompt: () => void;
}

export const Typewriter: React.FC<TypewriterProps> = ({
  onPrint,
  isPrinting,
  selectedPrompt,
  onClearPrompt,
}) => {
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    if (newVal.length > inputText.length) {
      playTypeSound();
    }
    setInputText(newVal);
  };

  const handlePrintClick = () => {
    if (inputText.trim() && !isPrinting && !isGenerating) {
      playPrintSound();
      onPrint(inputText);
      setInputText("");
    }
  };

  // 使用输入的文本或选中的提示词生成 Todo
  const handleGenerateWithPrompt = async () => {
    if (isGenerating || isPrinting) return;

    setIsGenerating(true);

    try {
      // 优先使用输入的文本，其次使用选中提示词，最后用默认
      let textToUse = "";
      if (inputText.trim()) {
        textToUse = inputText.trim();
      } else if (selectedPrompt) {
        textToUse = selectedPrompt.content;
      } else {
        textToUse = "今天的待办事项";
      }

      // 构造生成 Todo 的提示词
      const todoPrompt = `根据以下内容生成一个 TODO 清单，每行一个待办事项，以 □ 开头，4-6 个项目：\n\n${textToUse}`;

      const generatedText = await generateWithPrompt(todoPrompt);

      if (generatedText && generatedText.trim()) {
        playPrintSound();
        // 直接打印，不设置 inputText
        onPrint(generatedText.trim(), selectedPrompt?.id, selectedPrompt?.name);
        setInputText("");
        setIsGenerating(false);
      } else {
        setIsGenerating(false);
      }
    } catch (error) {
      console.error("Generation failed:", error);
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handlePrintClick();
    }
  };

  return (
    <div className="relative w-full max-w-xl mx-auto pointer-events-auto flex flex-col items-center scale-90">
      {/* Platen (The Roller) */}
      <div className="w-[92%] h-8 bg-gradient-to-b from-[#1a1a1a] via-[#2a2a2a] to-[#0a0a0a] rounded-lg shadow-xl relative z-0 border-b border-white/5 mx-auto">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:4px_4px]"></div>
      </div>

      {/* The Paper (Input Area) */}
      <div
        className={`
          relative z-10 w-[85%] -mt-4 bg-[#fdfbf7]
          shadow-[0_0_10px_rgba(0,0,0,0.4)]
          transition-all duration-300 ease-out origin-bottom
          ${isPrinting ? "-translate-y-[120px] opacity-0 rotate-1" : "translate-y-0 opacity-100 rotate-0"}
        `}
        style={{
          minHeight: "100px",
          clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
        }}
      >
        {/* Paper texture/watermark */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-repeat space-y-4 p-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-px w-full bg-stone-900"></div>
          ))}
        </div>

        <textarea
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={
            selectedPrompt
              ? `Using: ${selectedPrompt.name}`
              : "Type or select a prompt..."
          }
          disabled={isPrinting || isGenerating}
          className="w-full h-full bg-transparent p-4 pb-6 border-none outline-none font-mono text-stone-800 text-base resize-none placeholder-stone-300 leading-relaxed"
          style={{ minHeight: "100px" }}
          spellCheck={false}
        />

        {/* Character Count */}
        <div className="absolute bottom-1 right-3 text-[9px] text-stone-400 font-pixel tracking-widest pointer-events-none select-none opacity-60">
          {inputText.length} CHARS
        </div>
      </div>

      {/* Typewriter Body (Chassis) */}
      <div className="w-full relative z-20 -mt-1">
        {/* Main Body Shape */}
        <div className="bg-[#262626] rounded-[1.5rem] p-3 shadow-xl border-t-4 border-[#1f1f1f] relative overflow-hidden">
          {/* Metallic Sheen */}
          <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

          {/* Key Deck */}
          <div className="bg-[#1a1a1a] rounded-lg p-4 shadow-inner border border-white/5 flex flex-col gap-4 items-center">
            {/* Brand Label */}
            <div className="bg-black/50 px-3 py-0.5 rounded border border-white/10 shadow">
              <span className="text-amber-500/60 font-pixel tracking-[0.2em] text-[10px]">
                PROMPT PRINT TODO
              </span>
            </div>

            {/* Selected Prompt Display */}
            {selectedPrompt && (
              <div className="w-full bg-stone-800/50 rounded-lg p-2 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span className="text-amber-400 text-xs font-mono truncate block">
                    {selectedPrompt.name}
                  </span>
                  <span className="text-stone-500 text-[10px] font-mono truncate block">
                    {selectedPrompt.content.slice(0, 50)}...
                  </span>
                </div>
                <button
                  onClick={onClearPrompt}
                  className="p-1 rounded hover:bg-stone-700 text-stone-500 hover:text-stone-300 transition-colors"
                  title="Clear selection"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 md:gap-6 w-full">
              {/* Left Action: Generate with Prompt */}
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={handleGenerateWithPrompt}
                  disabled={isGenerating || isPrinting}
                  className="
                    group relative w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#e0e0e0] border-[4px] border-[#111] shadow-[0_3px_0_#000]
                    active:shadow-none active:translate-y-[3px] active:border-[3px]
                    transition-all flex items-center justify-center
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                  title={
                    selectedPrompt
                      ? `Generate with: ${selectedPrompt.name}`
                      : "Generate with AI"
                  }
                >
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-stone-300 bg-[#f0f0f0] flex items-center justify-center shadow-inner group-hover:bg-blue-50 transition-colors">
                    {isGenerating ? (
                      <div className="w-3 h-3 border-2 border-stone-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span className="text-stone-600 font-bold text-sm font-mono">
                        AI
                      </span>
                    )}
                  </div>
                </button>
                <span className="text-[8px] font-bold text-stone-500 uppercase tracking-wider">
                  Generate
                </span>
              </div>

              {/* Middle: Print Bar */}
              <div className="flex-1 max-w-[180px]">
                <button
                  onClick={handlePrintClick}
                  disabled={!inputText.trim() || isPrinting || isGenerating}
                  className="
                    w-full h-10 rounded bg-[#8a1c1c] border-b-[4px] border-[#5c1010] shadow-[0_3px_8px_rgba(0,0,0,0.4)]
                    active:border-b-0 active:translate-y-[4px] active:shadow-none
                    transition-all flex items-center justify-center
                    disabled:bg-[#3d3d3d] disabled:border-[#222] disabled:cursor-not-allowed
                  "
                >
                  <span className="text-white/90 font-mono text-sm font-bold tracking-[0.2em] uppercase drop-shadow-md">
                    Print
                  </span>
                </button>
              </div>

              {/* Empty space for balance */}
              <div className="w-10 md:w-12"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
