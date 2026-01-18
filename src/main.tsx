import App from "./App";
import React, { useState, useLayoutEffect } from "react";
import ReactDOM from "react-dom/client";

interface AppProps {
  enableDarkMode?: boolean;
  setEnableDarkMode?: (value: boolean) => void;
}

const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [enableDarkMode, setEnableDarkMode] = useState(true)

  useLayoutEffect(() => {
    document.documentElement.setAttribute(
      'data-prefers-color-scheme',
      enableDarkMode ? 'dark' : 'light'
    )
  }, [enableDarkMode])

  const child = children as React.ReactElement<AppProps>
  return React.cloneElement(child, { enableDarkMode, setEnableDarkMode })
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeWrapper>
      <App />
    </ThemeWrapper>
  </React.StrictMode>,
);
