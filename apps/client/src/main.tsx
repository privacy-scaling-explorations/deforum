import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import { routeTree } from "./routeTree.gen";
import { Providers } from "@/providers";

import "./index.css";

import { createRouter } from "@tanstack/react-router";
const router = createRouter({ routeTree });
export { router };

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <Providers router={router} />
    </StrictMode>
  );
}
