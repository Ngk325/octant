import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ThemeProvider } from "./components/Theme";
import { ChatProvider } from "./chat/ChatContext";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* Both v7 future flags on, so the v7 major becomes a rename rather than a
        behaviour change. startTransition wraps state updates (React 18+ path);
        relativeSplatPath only affects multi-segment splat routes, of which this
        app has none — every route here is a fixed pattern. */}
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <ChatProvider>
          <App />
        </ChatProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
