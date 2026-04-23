"use client";

import { useState, useEffect } from "react";
import { Volume2, VolumeOff, Sun, Moon } from "lucide-react";
import { isSoundEnabled, setSoundEnabled } from "@/lib/sounds";

export function AppPreferences() {
  const [sound, setSound] = useState(true);
  const [dark, setDark] = useState(true);

  useEffect(() => {
    setSound(isSoundEnabled());
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleSound() {
    const next = !sound;
    setSound(next);
    setSoundEnabled(next);
  }

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.classList.toggle("light", !next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <div>
      <h2 className="text-sm font-bold text-[#F0F0F0] mb-1">Preferences</h2>
      <p className="text-xs text-[#71717A] mb-4">Customize your Huat experience.</p>
      <div className="bg-[#141414] border border-[#282828] rounded-lg divide-y divide-[#282828]">
        {/* Sound */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {sound ? <Volume2 className="w-4 h-4 text-[#9CA3AF]" /> : <VolumeOff className="w-4 h-4 text-[#9CA3AF]" />}
            <div>
              <p className="text-sm text-[#F0F0F0]">Notification sounds</p>
              <p className="text-xs text-[#71717A] mt-0.5">Play sounds for messages and AngBao credits</p>
            </div>
          </div>
          <button
            onClick={toggleSound}
            className={`w-10 h-5 rounded-full relative transition-colors flex-shrink-0 ${sound ? "bg-[#22C55E]" : "bg-[#333333]"}`}
          >
            <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: sound ? 22 : 2 }} />
          </button>
        </div>

        {/* Theme */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {dark ? <Moon className="w-4 h-4 text-[#9CA3AF]" /> : <Sun className="w-4 h-4 text-[#9CA3AF]" />}
            <div>
              <p className="text-sm text-[#F0F0F0]">Dark mode</p>
              <p className="text-xs text-[#71717A] mt-0.5">Switch between dark and light appearance</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`w-10 h-5 rounded-full relative transition-colors flex-shrink-0 ${dark ? "bg-[#22C55E]" : "bg-[#333333]"}`}
          >
            <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: dark ? 22 : 2 }} />
          </button>
        </div>
      </div>
    </div>
  );
}
