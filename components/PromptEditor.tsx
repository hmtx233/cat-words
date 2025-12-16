import React, { useState, useEffect, useRef } from "react";
import { PromptTemplate } from "../types";

interface PromptEditorProps {
  isOpen: boolean;
  prompt: PromptTemplate | null; // null = new prompt
  onSave: (data: { name: string; content: string; tags: string[] }) => void;
  onClose: () => void;
  isDarkMode: boolean;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({
  isOpen,
  prompt,
  onSave,
  onClose,
  isDarkMode,
}) => {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (prompt) {
        setName(prompt.name);
        setContent(prompt.content);
        setTags([...prompt.tags]);
      } else {
        setName("");
        setContent("");
        setTags([]);
      }
      setTagInput("");
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isOpen, prompt]);

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = () => {
    if (!name.trim() || !content.trim()) return;
    onSave({ name: name.trim(), content: content.trim(), tags });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-lg rounded-lg shadow-2xl overflow-hidden ${
          isDarkMode ? "bg-stone-800" : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b ${
            isDarkMode ? "border-stone-700 bg-stone-900" : "border-stone-200 bg-stone-50"
          }`}
        >
          <h2
            className={`font-pixel text-lg tracking-wider ${
              isDarkMode ? "text-amber-500" : "text-amber-700"
            }`}
          >
            {prompt ? "EDIT PROMPT" : "NEW PROMPT"}
          </h2>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label
              className={`block text-xs font-mono mb-1 ${
                isDarkMode ? "text-stone-400" : "text-stone-500"
              }`}
            >
              Name
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Daily Todo"
              className={`w-full px-3 py-2 rounded border font-mono text-sm ${
                isDarkMode
                  ? "bg-stone-900 border-stone-600 text-stone-100 placeholder-stone-500"
                  : "bg-stone-50 border-stone-300 text-stone-800 placeholder-stone-400"
              } focus:outline-none focus:border-amber-500/50`}
            />
          </div>

          {/* Content */}
          <div>
            <label
              className={`block text-xs font-mono mb-1 ${
                isDarkMode ? "text-stone-400" : "text-stone-500"
              }`}
            >
              Prompt Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter the prompt that will be sent to AI..."
              rows={5}
              className={`w-full px-3 py-2 rounded border font-mono text-sm resize-none ${
                isDarkMode
                  ? "bg-stone-900 border-stone-600 text-stone-100 placeholder-stone-500"
                  : "bg-stone-50 border-stone-300 text-stone-800 placeholder-stone-400"
              } focus:outline-none focus:border-amber-500/50`}
            />
          </div>

          {/* Tags */}
          <div>
            <label
              className={`block text-xs font-mono mb-1 ${
                isDarkMode ? "text-stone-400" : "text-stone-500"
              }`}
            >
              Tags
            </label>
            <div className="flex gap-2 flex-wrap mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono ${
                    isDarkMode
                      ? "bg-amber-600/20 text-amber-400"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-400 transition-colors"
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Add tag..."
                className={`flex-1 px-3 py-1.5 rounded border font-mono text-xs ${
                  isDarkMode
                    ? "bg-stone-900 border-stone-600 text-stone-100 placeholder-stone-500"
                    : "bg-stone-50 border-stone-300 text-stone-800 placeholder-stone-400"
                } focus:outline-none focus:border-amber-500/50`}
              />
              <button
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
                className={`px-3 py-1.5 rounded font-mono text-xs transition-colors ${
                  isDarkMode
                    ? "bg-stone-700 hover:bg-stone-600 text-stone-300 disabled:opacity-50"
                    : "bg-stone-200 hover:bg-stone-300 text-stone-700 disabled:opacity-50"
                }`}
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-4 border-t flex justify-end gap-3 ${
            isDarkMode ? "border-stone-700 bg-stone-900" : "border-stone-200 bg-stone-50"
          }`}
        >
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded font-mono text-sm transition-colors ${
              isDarkMode
                ? "bg-stone-700 hover:bg-stone-600 text-stone-300"
                : "bg-stone-200 hover:bg-stone-300 text-stone-700"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !content.trim()}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded font-mono text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
