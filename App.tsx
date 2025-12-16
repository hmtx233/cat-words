import React, { useState, useEffect, useRef } from "react";
import { Typewriter } from "./components/Typewriter";
import { DraggableCard } from "./components/DraggableCard";
import { PromptManager } from "./components/PromptManager";
import { PromptEditor } from "./components/PromptEditor";
import {
  SettingsPanel,
  loadSettings,
  AppSettings,
} from "./components/SettingsPanel";
import { HistoryPanel } from "./components/HistoryPanel";
import { CardData, Position, PromptTemplate } from "./types";
import {
  loadPrompts,
  savePrompts,
  addPrompt,
  updatePrompt,
  deletePrompt,
} from "./services/promptService";
import { captureCardWithMargins } from "./services/imageService";

export default function App() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [history, setHistory] = useState<CardData[]>([]);
  const [maxCards, setMaxCards] = useState(loadSettings().maxCards);
  const [isPrinting, setIsPrinting] = useState(false);
  const [maxZIndex, setMaxZIndex] = useState(1);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDraggingToHistory, setIsDraggingToHistory] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  // Prompt management state
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(
    null,
  );
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(
    null,
  );

  const modalCardRef = useRef<HTMLDivElement>(null);
  const historyDropZoneRef = useRef<HTMLDivElement>(null);

  // Load prompts on mount
  useEffect(() => {
    setPrompts(loadPrompts());
  }, []);

  const handleSettingsChange = (settings: AppSettings) => {
    setMaxCards(settings.maxCards);
  };

  useEffect(() => {
    const handleResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedCard(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (copyFeedback) {
      const timer = setTimeout(() => setCopyFeedback(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copyFeedback]);

  // Prompt handlers
  const handleNewPrompt = () => {
    setEditingPrompt(null);
    setIsEditorOpen(true);
  };

  const handleEditPrompt = (prompt: PromptTemplate) => {
    setEditingPrompt(prompt);
    setIsEditorOpen(true);
  };

  const handleSavePrompt = (data: {
    name: string;
    content: string;
    tags: string[];
  }) => {
    if (editingPrompt) {
      updatePrompt(editingPrompt.id, data);
    } else {
      addPrompt(data);
    }
    setPrompts(loadPrompts());
    setIsEditorOpen(false);
  };

  const handleDeletePrompt = (id: string) => {
    deletePrompt(id);
    setPrompts(loadPrompts());
    if (selectedPrompt?.id === id) {
      setSelectedPrompt(null);
    }
  };

  const handlePrint = (
    text: string,
    promptId?: string,
    promptName?: string,
  ) => {
    setIsPrinting(true);

    setTimeout(() => {
      const id = Date.now().toString();
      const randomOffsetX = Math.random() * 30 - 15;
      const randomOffsetY = Math.random() * 30 - 15;

      const now = new Date();
      const dateStr = now.toLocaleDateString("en-CA");
      const weekDay = now
        .toLocaleDateString("en-US", { weekday: "short" })
        .toUpperCase();
      const timeStr = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });
      const fullTimestamp = `${dateStr} ${weekDay} ${timeStr}`;

      const startX = windowSize.width / 2 - 128 + randomOffsetX;
      const startY = windowSize.height - 380 + randomOffsetY;

      const newCard: CardData = {
        id,
        text,
        promptId,
        promptName,
        position: {
          x: startX,
          y: startY,
        },
        zIndex: maxZIndex + 1,
        rotation: Math.random() * 4 - 2,
        timestamp: fullTimestamp,
      };

      setCards((prev) => {
        const newCards = [...prev, newCard];
        if (newCards.length > maxCards) {
          const overflow = newCards.splice(0, newCards.length - maxCards);
          setHistory((h) => [...h, ...overflow]);
        }
        return newCards;
      });
      setMaxZIndex((prev) => prev + 1);
      setIsPrinting(false);
    }, 400);
  };

  const updateCardPosition = (id: string, newPos: Position) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === id ? { ...card, position: newPos } : card,
      ),
    );
  };

  const handleCardDrag = (id: string, currentPos: Position) => {
    if (historyDropZoneRef.current) {
      const rect = historyDropZoneRef.current.getBoundingClientRect();
      const cardCenterX = currentPos.x + 144;
      const cardCenterY = currentPos.y + 100;

      const isOverDropZone =
        cardCenterX >= rect.left - 30 &&
        cardCenterX <= rect.right + 30 &&
        cardCenterY >= rect.top - 30 &&
        cardCenterY <= rect.bottom + 30;

      setIsDraggingToHistory(isOverDropZone);
    }
  };

  const handleCardDragEnd = (id: string, finalPos: Position) => {
    const card = cards.find((c) => c.id === id);
    if (isDraggingToHistory && card) {
      setHistory((prev) => [...prev, card]);
      setCards((prev) => prev.filter((c) => c.id !== id));
    }
    setIsDraggingToHistory(false);
  };

  // 处理 Todo 项的状态变化
  const handleTodoStateChange = (
    cardId: string,
    lineIndex: number,
    completed: boolean,
  ) => {
    setCards((prev) =>
      prev.map((card) => {
        if (card.id === cardId) {
          return {
            ...card,
            todoStates: {
              ...card.todoStates,
              [lineIndex.toString()]: completed,
            },
          };
        }
        return card;
      }),
    );

    // 更新 selectedCard
    if (selectedCard?.id === cardId) {
      setSelectedCard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          todoStates: {
            ...prev.todoStates,
            [lineIndex.toString()]: completed,
          },
        };
      });
    }
  };

  const bringToFront = (id: string) => {
    const newMax = maxZIndex + 1;
    setMaxZIndex(newMax);
    setCards((prev) =>
      prev.map((card) => (card.id === id ? { ...card, zIndex: newMax } : card)),
    );
  };

  const handleRemoveCard = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    if (selectedCard?.id === id) {
      setSelectedCard(null);
    }
  };

  const handleCardDoubleClick = (id: string) => {
    const card = cards.find((c) => c.id === id);
    if (card) {
      setSelectedCard(card);
    }
  };

  const handleRestoreFromHistory = (card: CardData) => {
    setHistory((prev) => prev.filter((c) => c.id !== card.id));
    const newCard = {
      ...card,
      position: {
        x: windowSize.width / 2 - 144 + Math.random() * 30 - 15,
        y: windowSize.height - 380 + Math.random() * 30 - 15,
      },
      zIndex: maxZIndex + 1,
    };
    setCards((prev) => {
      const newCards = [...prev, newCard];
      if (newCards.length > maxCards) {
        const overflow = newCards.splice(0, newCards.length - maxCards);
        setHistory((h) => [...h, ...overflow]);
      }
      return newCards;
    });
    setMaxZIndex((prev) => prev + 1);
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
        `prompt-print-${selectedCard.id.slice(-4)}.png`,
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

  const getWordCount = (text: string) => {
    const cjkCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const nonCjkText = text.replace(/[\u4e00-\u9fa5]/g, " ");
    const latinCount = nonCjkText.trim().split(/\s+/).filter(Boolean).length;
    return cjkCount + latinCount;
  };

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden transition-colors duration-500 ${isDarkMode ? "bg-[#1c1917]" : "bg-[#f5f5f4]"}`}
    >
      {/* Background Texture */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none transition-all duration-500"
        style={{
          backgroundImage: `radial-gradient(${isDarkMode ? "#44403c" : "#a8a29e"} 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      ></div>

      {/* Vignette */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${isDarkMode ? "bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] opacity-100" : "bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.1)_100%)] opacity-50"}`}
      ></div>

      {/* Brand Watermark */}
      <div className="absolute top-8 left-8 select-none pointer-events-none z-0">
        <div
          className={`font-pixel text-4xl tracking-widest transition-all duration-500 ${isDarkMode ? "text-amber-500/10" : "text-amber-700/10"}`}
        >
          PROMPT PRINT
        </div>
        <div
          className={`font-mono text-xs mt-1 tracking-[0.3em] transition-all duration-500 ${isDarkMode ? "text-stone-500/30" : "text-stone-600/30"}`}
        >
          TODO v2.0
        </div>
      </div>

      {/* Top Right Buttons */}
      <div className="absolute top-8 right-8 z-50 flex gap-2">
        {/* Prompt Manager Button */}
        <button
          onClick={() => setIsManagerOpen(true)}
          className={`
            p-2.5 rounded-full border shadow-md transition-all
            ${
              isDarkMode
                ? "bg-stone-800 border-stone-700 text-amber-400 hover:bg-stone-700 hover:text-amber-300"
                : "bg-white border-stone-200 text-amber-600 hover:bg-stone-50 hover:text-amber-700"
            }
          `}
          title="Manage Prompts"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        </button>

        {/* History Drop Zone */}
        <div
          ref={historyDropZoneRef}
          onClick={() => setIsHistoryOpen(true)}
          className={`
            p-2.5 rounded-full border shadow-md transition-all cursor-pointer
            ${
              isDraggingToHistory
                ? "bg-amber-500 border-amber-400 text-white scale-125 ring-4 ring-amber-300/50"
                : isDarkMode
                  ? "bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700"
                  : "bg-white border-stone-200 text-stone-600 hover:bg-stone-100"
            }
          `}
          title={
            isDraggingToHistory
              ? "Release to Archive"
              : `View History (${history.length})`
          }
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          {isDraggingToHistory && (
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-amber-400 whitespace-nowrap font-mono">
              DROP HERE
            </span>
          )}
        </div>

        {/* Settings Button */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className={`
            p-2.5 rounded-full border shadow-md transition-all
            ${
              isDarkMode
                ? "bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700"
                : "bg-white border-stone-200 text-stone-600 hover:bg-stone-100"
            }
          `}
          title="AI Settings"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`
            p-2.5 rounded-full border shadow-md transition-all
            ${
              isDarkMode
                ? "bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700"
                : "bg-white border-stone-200 text-stone-600 hover:bg-stone-100"
            }
          `}
          title={isDarkMode ? "Switch to Day Mode" : "Switch to Night Mode"}
        >
          {isDarkMode ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          )}
        </button>
      </div>

      {/* Selected Prompt Display */}
      {selectedPrompt && (
        <div
          className={`fixed bottom-32 left-8 px-4 py-3 rounded-lg border shadow-lg z-20 max-w-xs ${
            isDarkMode
              ? "bg-stone-800/95 border-amber-600/50 text-stone-100"
              : "bg-amber-50/95 border-amber-300/50 text-amber-900"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p
                className={`font-pixel text-xs tracking-wider ${isDarkMode ? "text-amber-400" : "text-amber-700"}`}
              >
                SELECTED
              </p>
              <p className="font-mono font-bold text-sm mt-1 truncate">
                {selectedPrompt.name}
              </p>
              <p
                className={`font-mono text-xs mt-1 line-clamp-2 ${isDarkMode ? "text-stone-400" : "text-amber-700/70"}`}
              >
                {selectedPrompt.content}
              </p>
            </div>
            <button
              onClick={() => setSelectedPrompt(null)}
              className={`p-1 rounded hover:bg-opacity-70 transition-colors flex-shrink-0 ${
                isDarkMode
                  ? "text-stone-500 hover:text-stone-300"
                  : "text-amber-600 hover:text-amber-800"
              }`}
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
        </div>
      )}

      {/* Cards Layer */}
      <div className="absolute inset-0 z-10 w-full h-full">
        {cards.map((card) => (
          <DraggableCard
            key={card.id}
            data={card}
            onUpdatePosition={updateCardPosition}
            onBringToFront={bringToFront}
            onDoubleClick={handleCardDoubleClick}
            onRemove={handleRemoveCard}
            onDrag={handleCardDrag}
            onDragEnd={handleCardDragEnd}
            onTodoStateChange={handleTodoStateChange}
          />
        ))}
      </div>

      {/* Typewriter Interface */}
      <div className="absolute bottom-0 left-0 w-full z-50 flex justify-center pointer-events-none pb-4">
        <Typewriter
          onPrint={handlePrint}
          isPrinting={isPrinting}
          selectedPrompt={selectedPrompt}
          onClearPrompt={() => setSelectedPrompt(null)}
        />
      </div>

      {/* Instructions */}
      {cards.length === 0 && !isPrinting && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 text-stone-500 font-mono text-center select-none pointer-events-none opacity-50 animate-pulse">
          <p>CLICK PROMPT MANAGER TO START</p>
          <p className="text-xs mt-2 text-stone-600">
            Create or select a prompt, then generate
          </p>
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
            onClick={(e) => e.stopPropagation()}
          >
            {/* Paper Texture */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.4] mix-blend-multiply"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")`,
              }}
            ></div>

            {/* Push Pin */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-600 to-red-800 shadow-[2px_3px_5px_rgba(0,0,0,0.3)] border border-red-900/50 relative">
                <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-red-300 opacity-60 filter blur-[0.5px]"></div>
              </div>
              <div className="absolute top-3 left-2 w-4 h-4 bg-black/30 rounded-full blur-[2px] -z-10 transform skew-x-12"></div>
            </div>

            {/* Header */}
            <div className="flex justify-between items-end border-b border-stone-800/10 pb-4 mb-6 relative z-10">
              <span className="font-pixel text-stone-400 tracking-widest text-lg opacity-70 flex gap-4">
                <span>#{selectedCard.id.slice(-4)}</span>
                <span className="text-sm self-end pb-0.5">
                  {getWordCount(selectedCard.text)} WDS
                </span>
              </span>
              <span className="font-mono text-stone-500 text-xs font-bold opacity-60 tracking-tight text-right">
                {selectedCard.timestamp}
              </span>
            </div>

            {/* Prompt Name */}
            {selectedCard.promptName && (
              <div className="mb-4 relative z-10">
                <span className="text-xs font-mono text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  {selectedCard.promptName}
                </span>
              </div>
            )}

            {/* Content */}
            <div className="font-mono text-stone-800 text-xl leading-relaxed min-h-[100px] mb-8 relative z-10 drop-shadow-[0_0_1px_rgba(0,0,0,0.05)]">
              {selectedCard.text.includes("□") ? (
                // Todo 格式：可点击
                <div className="space-y-2">
                  {selectedCard.text.split("\n").map((line, idx) => {
                    const isTodo = line.trim().startsWith("□");
                    const isCompleted =
                      selectedCard.todoStates?.[idx.toString()] || false;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (isTodo) {
                            handleTodoStateChange(
                              selectedCard.id,
                              idx,
                              !isCompleted,
                            );
                          }
                        }}
                        className={`cursor-pointer transition-all ${
                          isTodo ? "hover:bg-stone-100 px-2 py-1 rounded" : ""
                        } ${isCompleted ? "line-through opacity-50 text-stone-500" : ""}`}
                      >
                        {isTodo ? (
                          <span>
                            {isCompleted ? "☑" : "□"}{" "}
                            {line.replace("□", "").trim()}
                          </span>
                        ) : (
                          line
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                // 普通格式
                <div className="whitespace-pre-wrap">{selectedCard.text}</div>
              )}
            </div>

            {/* Decorative footer stamp */}
            <div className="absolute bottom-20 right-8 opacity-10 pointer-events-none rotate-[-6deg] mix-blend-multiply z-0">
              <div className="border-2 border-stone-800 px-3 py-1 font-pixel text-xl tracking-widest text-stone-800">
                PROMPT PRINT
              </div>
            </div>

            {/* Actions */}
            <div
              className="flex justify-between items-center pt-6 border-t border-stone-800/10 relative z-20"
              data-html2canvas-ignore="true"
            >
              <button
                onClick={() => handleRemoveCard(selectedCard.id)}
                className="px-4 py-2 text-red-700 hover:bg-red-50 hover:text-red-900 font-mono text-sm rounded transition-colors flex items-center gap-2"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
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
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="9"
                          y="9"
                          width="13"
                          height="13"
                          rx="2"
                          ry="2"
                        ></rect>
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

      {/* Prompt Manager Modal */}
      <PromptManager
        isOpen={isManagerOpen}
        onClose={() => setIsManagerOpen(false)}
        prompts={prompts}
        selectedPrompt={selectedPrompt}
        onSelectPrompt={setSelectedPrompt}
        onEditPrompt={handleEditPrompt}
        onDeletePrompt={handleDeletePrompt}
        onNewPrompt={handleNewPrompt}
        isDarkMode={isDarkMode}
      />

      {/* Prompt Editor Modal */}
      <PromptEditor
        isOpen={isEditorOpen}
        prompt={editingPrompt}
        onSave={handleSavePrompt}
        onClose={() => setIsEditorOpen(false)}
        isDarkMode={isDarkMode}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isDarkMode={isDarkMode}
        onSettingsChange={handleSettingsChange}
      />

      {/* History Panel */}
      <HistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        isDarkMode={isDarkMode}
        history={history}
        onSelectCard={handleRestoreFromHistory}
      />
    </div>
  );
}
