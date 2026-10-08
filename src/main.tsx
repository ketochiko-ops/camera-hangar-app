import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { InventoryProvider } from "./context/InventoryContext";
import { App } from "./App";
import "./styles.css";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <InventoryProvider>
      <App />
    </InventoryProvider>
  </StrictMode>,
);
