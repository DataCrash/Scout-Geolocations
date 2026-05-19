import App from "@/App";
import "leaflet/dist/leaflet.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

function triggerServiceWorkerOfflineSync() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  void navigator.serviceWorker.ready.then((registration) => {
    registration.active?.postMessage({
      type: "SYNC_OFFLINE_CHECKINS",
    });
  });
}

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/service-worker.js").then(() => {
      triggerServiceWorkerOfflineSync();
    });
  });

  window.addEventListener("online", triggerServiceWorkerOfflineSync);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
