import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { type JSXElementConstructor, type ReactElement, useState } from "react"

const client = new QueryClient()
export function QueryProvider({
  children,
}: {
  // biome-ignore lint/suspicious/noExplicitAny: necessary to match the rpsc react-query types
  children: ReactElement<any, string | JSXElementConstructor<any>> | undefined
}) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  )
}
