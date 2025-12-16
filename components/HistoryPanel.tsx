import React from "react";
import { CardData } from "../types";

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  history: CardData[];
  onSelectCard: (card: CardData) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  history,
  onSelectCard,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md max-h-[60vh] p-4 rounded-lg shadow-2xl relative flex flex-col ${isDarkMode ? "bg-stone-800 text-stone-100" : "bg-white text-stone-800"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-stone-600/30">
          <span className="font-pixel text-sm tracking-wider opacity-70">
            HISTORY ({history.length})
          </span>
          <button
            onClick={onClose}
            className={`p-1 rounded hover:bg-stone-700/50 transition-colors ${isDarkMode ? "text-stone-400" : "text-stone-500"}`}
          >
            <svg
              width="16"
              height="16"
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

        {/* History List */}
        <div className="flex-1 overflow-y-auto space-y-1">
          {history.length === 0 ? (
            <div
              className={`text-center py-8 ${isDarkMode ? "text-stone-500" : "text-stone-400"}`}
            >
              <p className="font-mono text-sm">No prints yet...</p>
            </div>
          ) : (
            [...history].reverse().map((card) => (
              <div
                key={card.id}
                onClick={() => {
                  onSelectCard(card);
                  onClose();
                }}
                className={`px-3 py-2 rounded cursor-pointer transition-colors ${
                  isDarkMode ? "hover:bg-stone-700/50" : "hover:bg-stone-100"
                }`}
              >
                <p
                  className={`font-mono text-sm truncate ${isDarkMode ? "text-stone-300" : "text-stone-700"}`}
                >
                  {card.text}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
