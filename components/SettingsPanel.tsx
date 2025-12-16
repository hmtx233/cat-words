import React, { useState, useEffect } from "react";

export interface AppSettings {
  apiUrl: string;
  apiToken: string;
  systemPrompt: string;
  maxCards: number;
  model: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  apiUrl: "",
  apiToken: "",
  systemPrompt:
    "Write a short, cryptic but beautiful sentence about time, memory, or the future. Max 15 words. Style: Vintage typewriter note.",
  maxCards: 1,
  model: "gpt-3.5-turbo",
};

const STORAGE_KEY = "prompt-print-settings";

export const loadSettings = (): AppSettings => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error("Failed to load settings:", e);
  }
  return DEFAULT_SETTINGS;
};

export const saveSettings = (settings: AppSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
};

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onSettingsChange?: (settings: AppSettings) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  onSettingsChange,
}) => {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(loadSettings());
      setSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    if (onSettingsChange) {
      onSettingsChange(settings);
    }
    setTimeout(() => setSaved(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-lg p-6 rounded-lg shadow-2xl relative ${isDarkMode ? "bg-stone-800 text-stone-100" : "bg-white text-stone-800"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-pixel text-xl tracking-wider">SETTINGS</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded hover:bg-stone-700/50 transition-colors ${isDarkMode ? "text-stone-400" : "text-stone-500"}`}
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

        {/* Form */}
        <div className="space-y-4">
          {/* Max Cards */}
          <div>
            <label className="block text-sm font-mono mb-1 opacity-70">
              Max Cards on Screen
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="10"
                value={settings.maxCards}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    maxCards: parseInt(e.target.value),
                  }))
                }
                className="flex-1 h-2 bg-stone-600 rounded-lg appearance-none cursor-pointer"
              />
              <span
                className={`font-mono text-lg w-8 text-center ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}
              >
                {settings.maxCards}
              </span>
            </div>
          </div>

          <div
            className={`border-t ${isDarkMode ? "border-stone-700" : "border-stone-200"} my-4`}
          ></div>

          {/* API URL */}
          <div>
            <label className="block text-sm font-mono mb-1 opacity-70">
              API URL
            </label>
            <input
              type="text"
              value={settings.apiUrl}
              onChange={(e) =>
                setSettings((s) => ({ ...s, apiUrl: e.target.value }))
              }
              placeholder="https://api.openai.com/v1/chat/completions"
              className={`w-full px-3 py-2 rounded border font-mono text-sm ${
                isDarkMode
                  ? "bg-stone-900 border-stone-600 text-stone-100 placeholder-stone-500"
                  : "bg-stone-50 border-stone-300 text-stone-800 placeholder-stone-400"
              }`}
            />
          </div>

          {/* API Token */}
          <div>
            <label className="block text-sm font-mono mb-1 opacity-70">
              API Token
            </label>
            <input
              type="password"
              value={settings.apiToken}
              onChange={(e) =>
                setSettings((s) => ({ ...s, apiToken: e.target.value }))
              }
              placeholder="sk-..."
              className={`w-full px-3 py-2 rounded border font-mono text-sm ${
                isDarkMode
                  ? "bg-stone-900 border-stone-600 text-stone-100 placeholder-stone-500"
                  : "bg-stone-50 border-stone-300 text-stone-800 placeholder-stone-400"
              }`}
            />
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-mono mb-1 opacity-70">
              Model
            </label>
            <input
              type="text"
              value={settings.model}
              onChange={(e) =>
                setSettings((s) => ({ ...s, model: e.target.value }))
              }
              placeholder="gpt-3.5-turbo"
              className={`w-full px-3 py-2 rounded border font-mono text-sm ${
                isDarkMode
                  ? "bg-stone-900 border-stone-600 text-stone-100 placeholder-stone-500"
                  : "bg-stone-50 border-stone-300 text-stone-800 placeholder-stone-400"
              }`}
            />
            <p
              className={`text-xs mt-1 ${isDarkMode ? "text-stone-500" : "text-stone-400"}`}
            >
              e.g., gpt-3.5-turbo, gpt-4, deepseek-chat, moonshot-v1
            </p>
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-sm font-mono mb-1 opacity-70">
              System Prompt
            </label>
            <textarea
              value={settings.systemPrompt}
              onChange={(e) =>
                setSettings((s) => ({ ...s, systemPrompt: e.target.value }))
              }
              rows={3}
              placeholder="Enter the system prompt for AI generation..."
              className={`w-full px-3 py-2 rounded border font-mono text-sm resize-none ${
                isDarkMode
                  ? "bg-stone-900 border-stone-600 text-stone-100 placeholder-stone-500"
                  : "bg-stone-50 border-stone-300 text-stone-800 placeholder-stone-400"
              }`}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
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
            onClick={handleSave}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded font-mono text-sm transition-colors"
          >
            {saved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};
