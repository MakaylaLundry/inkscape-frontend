import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';
type ColorblindMode = 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';

interface AccessibilityContextType {
  theme: Theme;
  colorblindMode: ColorblindMode;
  textScale: number; // 0.8 to 2.0
  setTheme: (theme: Theme) => void;
  setColorblindMode: (mode: ColorblindMode) => void;
  setTextScale: (scale: number) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [colorblindMode, setColorblindModeState] = useState<ColorblindMode>('none');
  const [textScale, setTextScaleState] = useState<number>(1);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Apply colorblind mode
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('colorblind-deuteranopia', 'colorblind-protanopia', 'colorblind-tritanopia');
    if (colorblindMode !== 'none') {
      root.classList.add(`colorblind-${colorblindMode}`);
    }
  }, [colorblindMode]);

  // Apply text scale with smooth transition
  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = `${textScale * 100}%`;
    root.style.transition = 'font-size 0.15s ease-out';
  }, [textScale]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('inkscape-theme', newTheme);
  };

  const setColorblindMode = (mode: ColorblindMode) => {
    setColorblindModeState(mode);
    localStorage.setItem('inkscape-colorblind', mode);
  };

  const setTextScale = (scale: number) => {
    // Clamp between 0.8 and 2.0
    const clampedScale = Math.min(2, Math.max(0.8, scale));
    setTextScaleState(clampedScale);
    localStorage.setItem('inkscape-textscale', clampedScale.toString());
  };

  // Load saved preferences
  useEffect(() => {
    const savedTheme = localStorage.getItem('inkscape-theme') as Theme | null;
    const savedColorblind = localStorage.getItem('inkscape-colorblind') as ColorblindMode | null;
    const savedTextScale = localStorage.getItem('inkscape-textscale');

    if (savedTheme) setThemeState(savedTheme);
    if (savedColorblind) setColorblindModeState(savedColorblind);
    if (savedTextScale) setTextScaleState(parseFloat(savedTextScale));
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{
        theme,
        colorblindMode,
        textScale,
        setTheme,
        setColorblindMode,
        setTextScale,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
