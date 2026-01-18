import App from "./App";
import React, { useState, useLayoutEffect } from "react";
import ReactDOM from "react-dom/client";

type ThemeMode = 'light' | 'dark' | 'auto'

interface AppProps {
  themeMode?: ThemeMode;
  setThemeMode?: (value: ThemeMode) => void;
}

const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('themeMode') as ThemeMode
    return saved || 'auto'
  })

  useLayoutEffect(() => {
    localStorage.setItem('themeMode', themeMode)
    
    const getSystemTheme = () => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    
    const actualTheme = themeMode === 'auto' ? getSystemTheme() : themeMode
    document.documentElement.setAttribute('data-prefers-color-scheme', actualTheme)
  }, [themeMode])

  const child = children as React.ReactElement<AppProps>
  return React.cloneElement(child, { themeMode, setThemeMode })
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeWrapper>
      <App />
    </ThemeWrapper>
  </React.StrictMode>,
);
