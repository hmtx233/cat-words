import React, { useState, useMemo } from "react";
import { PromptTemplate } from "../types";

interface PromptManagerProps {
  isOpen: boolean;
  onClose: () => void;
  prompts: PromptTemplate[];
  selectedPrompt: PromptTemplate | null;
  onSelectPrompt: (prompt: PromptTemplate) => void;
  onEditPrompt: (prompt: PromptTemplate) => void;
  onDeletePrompt: (id: string) => void;
  onNewPrompt: () => void;
  isDarkMode: boolean;
}

export const PromptManager: React.FC<PromptManagerProps> = ({
  isOpen,
  onClose,
  prompts,
  selectedPrompt,
  onSelectPrompt,
  onEditPrompt,
  onDeletePrompt,
  onNewPrompt,
  isDarkMode,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "created" | "updated">("created");

  // 获取所有标签
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    prompts.forEach((p) => p.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [prompts]);

  // 排序和筛选提示词
  const filteredPrompts = useMemo(() => {
    let result = prompts;

    // 按搜索词筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.content.toLowerCase().includes(query) ||
          p.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    // 排序
    const sorted = [...result];
    switch (sortBy) {
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "created":
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "updated":
        sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
    }

    return sorted;
  }, [prompts, searchQuery, sortBy]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-4xl h-[80vh] rounded-lg shadow-2xl overflow-hidden flex flex-col ${
          isDarkMode ? "bg-stone-800" : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isDarkMode ? "border-stone-700 bg-stone-900" : "border-stone-200 bg-stone-50"
          }`}
        >
          <h2
            className={`font-pixel text-xl tracking-wider ${
              isDarkMode ? "text-amber-500" : "text-amber-700"
            }`}
          >
            PROMPT MANAGER
          </h2>
          <div className="flex gap-2">
            <button
              onClick={onNewPrompt}
              className={`px-4 py-2 rounded font-mono text-sm font-bold transition-colors ${
                isDarkMode
                  ? "bg-amber-600 hover:bg-amber-500 text-white"
                  : "bg-amber-500 hover:bg-amber-600 text-white"
              }`}
            >
              + New Prompt
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded transition-colors ${
                isDarkMode
                  ? "hover:bg-stone-700 text-stone-400 hover:text-white"
                  : "hover:bg-stone-200 text-stone-500 hover:text-stone-800"
              }`}
            >
              <svg
                width="20"
                height="20"
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

        {/* Search and Filter */}
        <div
          className={`px-6 py-4 border-b space-y-3 ${
            isDarkMode ? "border-stone-700 bg-stone-800/50" : "border-stone-200 bg-stone-50/50"
          }`}
        >
          <div className="flex gap-3 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, content or tags..."
                className={`w-full px-3 py-2 pl-8 text-sm font-mono rounded border ${
                  isDarkMode
                    ? "bg-stone-900 border-stone-600 text-stone-100 placeholder-stone-500"
                    : "bg-white border-stone-300 text-stone-800 placeholder-stone-400"
                } focus:outline-none focus:border-amber-500/50`}
              />
              <svg
                className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${
                  isDarkMode ? "text-stone-500" : "text-stone-400"
                }`}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`px-3 py-2 rounded border font-mono text-xs ${
                isDarkMode
                  ? "bg-stone-900 border-stone-600 text-stone-100"
                  : "bg-white border-stone-300 text-stone-800"
              } focus:outline-none focus:border-amber-500/50`}
            >
              <option value="created">Newest</option>
              <option value="updated">Recently Updated</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <span
                className={`text-xs font-mono ${
                  isDarkMode ? "text-stone-500" : "text-stone-500"
                }`}
              >
                Tags:
              </span>
              {allTags.map((tag) => (
                <span
                  key={tag}
                  className={`px-2 py-1 text-xs font-mono rounded ${
                    isDarkMode
                      ? "bg-stone-700 text-stone-400"
                      : "bg-stone-200 text-stone-600"
                  }`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className={`border-b sticky top-0 ${
                  isDarkMode
                    ? "bg-stone-900/80 border-stone-700"
                    : "bg-stone-50/80 border-stone-200"
                }`}
              >
                <th
                  className={`px-6 py-3 text-left font-mono font-bold ${
                    isDarkMode ? "text-stone-400" : "text-stone-600"
                  }`}
                >
                  Name
                </th>
                <th
                  className={`px-6 py-3 text-left font-mono font-bold ${
                    isDarkMode ? "text-stone-400" : "text-stone-600"
                  }`}
                >
                  Content
                </th>
                <th
                  className={`px-6 py-3 text-left font-mono font-bold ${
                    isDarkMode ? "text-stone-400" : "text-stone-600"
                  }`}
                >
                  Tags
                </th>
                <th
                  className={`px-6 py-3 text-left font-mono font-bold ${
                    isDarkMode ? "text-stone-400" : "text-stone-600"
                  }`}
                >
                  Updated
                </th>
                <th
                  className={`px-6 py-3 text-center font-mono font-bold ${
                    isDarkMode ? "text-stone-400" : "text-stone-600"
                  }`}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPrompts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className={`px-6 py-8 text-center font-mono text-sm ${
                      isDarkMode ? "text-stone-500" : "text-stone-400"
                    }`}
                  >
                    No prompts found
                  </td>
                </tr>
              ) : (
                filteredPrompts.map((prompt) => {
                  const isSelected = selectedPrompt?.id === prompt.id;
                  return (
                    <tr
                      key={prompt.id}
                      onClick={() => onSelectPrompt(prompt)}
                      className={`border-b cursor-pointer transition-colors ${
                        isSelected
                          ? isDarkMode
                            ? "bg-amber-600/20 hover:bg-amber-600/30"
                            : "bg-amber-100/50 hover:bg-amber-100"
                          : isDarkMode
                            ? "hover:bg-stone-700/50"
                            : "hover:bg-stone-50"
                      } ${isDarkMode ? "border-stone-700" : "border-stone-200"}`}
                    >
                      <td className={`px-6 py-4 font-mono font-bold ${isDarkMode ? "text-stone-200" : "text-stone-800"}`}>
                        {isSelected && <span className="text-amber-500 mr-2">✓</span>}
                        {prompt.name}
                      </td>
                      <td className={`px-6 py-4 font-mono text-xs line-clamp-2 ${isDarkMode ? "text-stone-400" : "text-stone-600"}`}>
                        {prompt.content}
                      </td>
                      <td className={`px-6 py-4 ${isDarkMode ? "text-stone-400" : "text-stone-600"}`}>
                        <div className="flex gap-1 flex-wrap">
                          {prompt.tags.length === 0 ? (
                            <span className="text-xs font-mono opacity-50">-</span>
                          ) : (
                            prompt.tags.map((tag) => (
                              <span
                                key={tag}
                                className={`px-2 py-1 text-xs font-mono rounded ${
                                  isDarkMode
                                    ? "bg-stone-700 text-stone-400"
                                    : "bg-stone-200 text-stone-600"
                                }`}
                              >
                                {tag}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className={`px-6 py-4 font-mono text-xs whitespace-nowrap ${isDarkMode ? "text-stone-500" : "text-stone-500"}`}>
                        {new Date(prompt.updatedAt).toLocaleDateString()}
                      </td>
                      <td className={`px-6 py-4 text-center`}>
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditPrompt(prompt);
                            }}
                            className={`p-1.5 rounded transition-colors ${
                              isDarkMode
                                ? "hover:bg-stone-700 text-stone-500 hover:text-stone-300"
                                : "hover:bg-stone-200 text-stone-400 hover:text-stone-600"
                            }`}
                            title="Edit"
                          >
                            <svg
                              width="14"
                              height="14"
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
                              if (confirm(`Delete "${prompt.name}"?`)) {
                                onDeletePrompt(prompt.id);
                              }
                            }}
                            className={`p-1.5 rounded transition-colors ${
                              isDarkMode
                                ? "hover:bg-red-900/50 text-stone-500 hover:text-red-400"
                                : "hover:bg-red-100 text-stone-400 hover:text-red-600"
                            }`}
                            title="Delete"
                          >
                            <svg
                              width="14"
                              height="14"
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
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-3 border-t text-xs font-mono ${
            isDarkMode ? "border-stone-700 bg-stone-900 text-stone-500" : "border-stone-200 bg-stone-50 text-stone-500"
          }`}
        >
          {filteredPrompts.length} prompt(s)
        </div>
      </div>
    </div>
  );
};
