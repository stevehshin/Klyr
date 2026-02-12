"use client";

import { useState, useEffect } from "react";

export interface ThemeSettings {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: string;
  fontFamily: string;
}

const DEFAULT_THEME: ThemeSettings = {
  primaryColor: "#3B82F6", // Blue
  accentColor: "#1D4ED8", // Dark Blue
  backgroundColor: "#FFFFFF", // White
  textColor: "#111827", // Dark Gray
  borderRadius: "0.5rem", // Medium
  fontFamily: "system-ui",
};

const PRESET_THEMES = {
  default: {
    name: "Default Blue",
    primaryColor: "#3B82F6",
    accentColor: "#1D4ED8",
    backgroundColor: "#FFFFFF",
    textColor: "#111827",
    borderRadius: "0.5rem",
    fontFamily: "system-ui",
  },
  purple: {
    name: "Purple Haze",
    primaryColor: "#9333EA",
    accentColor: "#6B21A8",
    backgroundColor: "#FFFFFF",
    textColor: "#111827",
    borderRadius: "0.5rem",
    fontFamily: "system-ui",
  },
  green: {
    name: "Fresh Green",
    primaryColor: "#10B981",
    accentColor: "#059669",
    backgroundColor: "#FFFFFF",
    textColor: "#111827",
    borderRadius: "0.5rem",
    fontFamily: "system-ui",
  },
  orange: {
    name: "Sunset Orange",
    primaryColor: "#F97316",
    accentColor: "#EA580C",
    backgroundColor: "#FFFFFF",
    textColor: "#111827",
    borderRadius: "0.5rem",
    fontFamily: "system-ui",
  },
  dark: {
    name: "Dark Mode",
    primaryColor: "#3B82F6",
    accentColor: "#1D4ED8",
    backgroundColor: "#111827",
    textColor: "#F9FAFB",
    borderRadius: "0.5rem",
    fontFamily: "system-ui",
  },
  minimal: {
    name: "Minimal",
    primaryColor: "#000000",
    accentColor: "#374151",
    backgroundColor: "#FFFFFF",
    textColor: "#000000",
    borderRadius: "0.25rem",
    fontFamily: "system-ui",
  },
};

export interface ThemeCustomizerProps {
  onClose: () => void;
}

export function ThemeCustomizer({ onClose }: ThemeCustomizerProps) {
  const [theme, setTheme] = useState<ThemeSettings>(DEFAULT_THEME);
  const [activeTab, setActiveTab] = useState<"presets" | "custom">("presets");

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem("klyr-theme");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTheme(parsed);
        applyTheme(parsed);
      } catch (error) {
        console.error("Failed to load theme:", error);
      }
    }
  }, []);

  const applyTheme = (themeSettings: ThemeSettings) => {
    const root = document.documentElement;
    root.style.setProperty("--color-primary", themeSettings.primaryColor);
    root.style.setProperty("--color-accent", themeSettings.accentColor);
    root.style.setProperty("--color-bg", themeSettings.backgroundColor);
    root.style.setProperty("--color-text", themeSettings.textColor);
    root.style.setProperty("--border-radius", themeSettings.borderRadius);
    root.style.setProperty("--font-family", themeSettings.fontFamily);
  };

  const handlePresetSelect = (preset: ThemeSettings) => {
    setTheme(preset);
    applyTheme(preset);
    localStorage.setItem("klyr-theme", JSON.stringify(preset));
  };

  const handleCustomChange = (key: keyof ThemeSettings, value: string) => {
    const newTheme = { ...theme, [key]: value };
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem("klyr-theme", JSON.stringify(newTheme));
  };

  const handleReset = () => {
    setTheme(DEFAULT_THEME);
    applyTheme(DEFAULT_THEME);
    localStorage.setItem("klyr-theme", JSON.stringify(DEFAULT_THEME));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Theme Customizer
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("presets")}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "presets"
                ? "text-primary-600 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Preset Themes
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "custom"
                ? "text-primary-600 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Custom Colors
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "presets" ? (
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(PRESET_THEMES).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => handlePresetSelect(preset)}
                  className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-600 transition-colors text-left"
                  style={{
                    borderColor: theme.primaryColor === preset.primaryColor ? preset.primaryColor : undefined,
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: preset.primaryColor }}
                    />
                    <div
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: preset.accentColor }}
                    />
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">{preset.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {preset.primaryColor}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Primary Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Primary Color
                </label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={theme.primaryColor}
                    onChange={(e) => handleCustomChange("primaryColor", e.target.value)}
                    className="w-16 h-16 rounded-lg border border-gray-300 dark:border-gray-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={theme.primaryColor}
                    onChange={(e) => handleCustomChange("primaryColor", e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Accent Color
                </label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={theme.accentColor}
                    onChange={(e) => handleCustomChange("accentColor", e.target.value)}
                    className="w-16 h-16 rounded-lg border border-gray-300 dark:border-gray-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={theme.accentColor}
                    onChange={(e) => handleCustomChange("accentColor", e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    placeholder="#1D4ED8"
                  />
                </div>
              </div>

              {/* Border Radius */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Border Radius: {theme.borderRadius}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.125"
                  value={parseFloat(theme.borderRadius)}
                  onChange={(e) => handleCustomChange("borderRadius", `${e.target.value}rem`)}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Sharp</span>
                  <span>Medium</span>
                  <span>Rounded</span>
                </div>
              </div>

              {/* Font Family */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Font Family
                </label>
                <select
                  value={theme.fontFamily}
                  onChange={(e) => handleCustomChange("fontFamily", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="system-ui">System Default</option>
                  <option value="'Inter', sans-serif">Inter</option>
                  <option value="'Roboto', sans-serif">Roboto</option>
                  <option value="'SF Pro Display', sans-serif">SF Pro Display</option>
                  <option value="'Helvetica Neue', sans-serif">Helvetica Neue</option>
                  <option value="'Georgia', serif">Georgia</option>
                  <option value="'Monaco', monospace">Monaco</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
          >
            Reset to Default
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
