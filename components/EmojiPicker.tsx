"use client";

import { useState } from "react";

const COMMON_EMOJIS = [
  "📢", "💬", "🎉", "🚀", "💡", "📚", "🎯", "🔥", "⭐", "💼",
  "🎨", "🎵", "🏆", "🌟", "💪", "🧠", "🔔", "📝", "🛠️", "🎮",
  "☕", "🌈", "🎭", "📊", "💻", "🤝", "🌍", "📱", "🎓", "🔐",
  "👥", "🗣️", "📣", "🎬", "📷", "🎤", "🏠", "🌙", "☀️", "⚡",
  "🔧", "🎪", "🎨", "🧩", "🏅", "🎁", "🌸", "🍕", "🎂", "🎈",
];

export interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  onClose?: () => void;
}

export function EmojiPicker({ value, onChange, onClose }: EmojiPickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleSelect = (emoji: string) => {
    onChange(emoji);
    setShowPicker(false);
    onClose?.();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="w-12 h-12 text-2xl border border-gray-300 dark:border-gray-700 rounded-lg hover:border-primary-600 transition-colors flex items-center justify-center"
      >
        {value}
      </button>

      {showPicker && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPicker(false)}
          />
          <div className="absolute bottom-14 left-0 z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-xl p-3 w-64">
            <div className="grid grid-cols-8 gap-2">
              {COMMON_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleSelect(emoji)}
                  className="text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
