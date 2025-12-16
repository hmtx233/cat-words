import React, { useState, useMemo } from "react";
import { PromptTemplate } from "../types";

interface PromptListProps {
  prompts: PromptTemplate[];
  selectedPrompt: PromptTemplate | null;
  onSelectPrompt: (prompt: PromptTemplate) => void;
  onEditPrompt: (prompt: PromptTemplate) => void;
  onDeletePrompt: (id: string) => void;
  onNewPrompt: () => void;
  isDarkMode: boolean;
}

export const PromptList: React.FC<PromptListProps> = ({
  prompts,
  selectedPrompt,
  onSelectPrompt,
  onEditPrompt,
  onDeletePrompt,
  onNewPrompt,
  isDarkMode,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // 获取所有标签
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    prompts.forEach((p) => p.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [prompts]);

  // 筛选提示词
  const filteredPrompts = useMemo(() => {
    let result = prompts;

    // 按标签筛选
    if (selectedTag) {
      result = result.filter((p) => p.tags.includes(selectedTag));
    }

    // 按搜索词筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.content.toLowerCase().includes(query)
      );
    }

    return result;
  }, [prompts, selectedTag, searchQuery]);

  return (
    <div
      className={`h-full flex flex-col ${
        isDarkMode ? "bg-stone-900/80" : "bg-white/80"
      } backdrop-blur-sm rounded-lg border ${
        isDarkMode ? "border-stone-700" : "border-stone-200"
      }`}
    >
      {/* Header */}
      <div className="p-3 border-b border-stone-700/50">
        <div className="flex items-center justify-between mb-2">
          <h2
            className={`font-pixel text-sm tracking-wider ${
              isDarkMode ? "text-amber-500/80" : "text-amber-700"
            }`}
          >
            PROMPTS
          </h2>
          <button
            onClick={onNewPrompt}
            className={`p-1.5 rounded-full transition-colors ${
              isDarkMode
                ? "hover:bg-stone-700 text-stone-400 hover:text-white"
                : "hover:bg-stone-200 text-stone-500 hover:text-stone-800"
            }`}
            title="New Prompt"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className={`w-full px-3 py-1.5 pl-8 text-xs font-mono rounded border ${
              isDarkMode
                ? "bg-stone-800 border-stone-600 text-stone-100 placeholder-stone-500"
                : "bg-stone-50 border-stone-300 text-stone-800 placeholder-stone-400"
            } focus:outline-none focus:border-amber-500/50`}
          />
          <svg
            className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${
              isDarkMode ? "text-stone-500" : "text-stone-400"
            }`}
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
      </div>

      {/* Tags */}
      {allTags.length > 0 && (
        <div className="p-2 border-b border-stone-700/50 flex flex-wrap gap-1">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-2 py-0.5 text-[10px] font-mono rounded-full transition-colors ${
              selectedTag === null
                ? "bg-amber-600 text-white"
                : isDarkMode
                  ? "bg-stone-700 text-stone-400 hover:bg-stone-600"
                  : "bg-stone-200 text-stone-600 hover:bg-stone-300"
            }`}
          >
            ALL
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
              className={`px-2 py-0.5 text-[10px] font-mono rounded-full transition-colors ${
                selectedTag === tag
                  ? "bg-amber-600 text-white"
                  : isDarkMode
                    ? "bg-stone-700 text-stone-400 hover:bg-stone-600"
                    : "bg-stone-200 text-stone-600 hover:bg-stone-300"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Prompt List */}
      <div className="flex-1 overflow-y-auto">
        {filteredPrompts.length === 0 ? (
          <div
            className={`p-4 text-center text-xs font-mono ${
              isDarkMode ? "text-stone-500" : "text-stone-400"
            }`}
          >
            No prompts found
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredPrompts.map((prompt) => (
              <div
                key={prompt.id}
                onClick={() => onSelectPrompt(prompt)}
                className={`p-2 rounded cursor-pointer transition-all group ${
                  selectedPrompt?.id === prompt.id
                    ? isDarkMode
                      ? "bg-amber-600/20 border border-amber-500/50"
                      : "bg-amber-100 border border-amber-300"
                    : isDarkMode
                      ? "hover:bg-stone-800 border border-transparent"
                      : "hover:bg-stone-100 border border-transparent"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-mono text-xs font-bold truncate ${
                        isDarkMode ? "text-stone-200" : "text-stone-700"
                      }`}
                    >
                      {prompt.name}
                    </h3>
                    <p
                      className={`text-[10px] mt-0.5 line-clamp-2 ${
                        isDarkMode ? "text-stone-500" : "text-stone-400"
                      }`}
                    >
                      {prompt.content}
                    </p>
                    {prompt.tags.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {prompt.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`px-1 py-0.5 text-[8px] font-mono rounded ${
                              isDarkMode
                                ? "bg-stone-700 text-stone-400"
                                : "bg-stone-200 text-stone-500"
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditPrompt(prompt);
                      }}
                      className={`p-1 rounded transition-colors ${
                        isDarkMode
                          ? "hover:bg-stone-700 text-stone-500 hover:text-stone-300"
                          : "hover:bg-stone-200 text-stone-400 hover:text-stone-600"
                      }`}
                      title="Edit"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this prompt?")) {
                          onDeletePrompt(prompt.id);
                        }
                      }}
                      className={`p-1 rounded transition-colors ${
                        isDarkMode
                          ? "hover:bg-red-900/50 text-stone-500 hover:text-red-400"
                          : "hover:bg-red-100 text-stone-400 hover:text-red-600"
                      }`}
                      title="Delete"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
