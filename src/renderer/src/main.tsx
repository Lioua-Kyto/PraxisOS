import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "./theme/ThemeProvider";
import App from "./App";
import { TimerWidget } from "./widget/TimerWidget";
import "./index.css";

// The pinned timer is a second window over the same bundle, told apart by the
// hash the main process loads it with. Sharing the entry keeps one preload,
// one theme provider and one build.
const isWidget = window.location.hash === "#widget";

// The widget window is transparent, so the app background must not paint over
// its rounded corners and drop shadow.
if (isWidget) document.documentElement.classList.add("widget-mode");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>{isWidget ? <TimerWidget /> : <App />}</ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
