import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@ummahlibrary/api";

// Dynamic: reads the request to dispatch tRPC procedures.
function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => ({}),
  });
}

export { handler as GET, handler as POST };
