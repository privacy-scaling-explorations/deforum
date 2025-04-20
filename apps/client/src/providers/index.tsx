import { GlobalProvider } from "@/contexts/GlobalContext";
import { QueryProvider } from "./QueryProvider";
import { RouterProvider } from "./RouterProvider";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { router as mainRouterInstance } from "../main";

export function Providers({ router }: { router: typeof mainRouterInstance }) {
  return (
    <QueryProvider>
      <TooltipPrimitive.Provider delayDuration={0}>
        <GlobalProvider>
          <RouterProvider router={router} />
        </GlobalProvider>
      </TooltipPrimitive.Provider>
    </QueryProvider>
  );
}
