import { createTRPCClient, loggerLink, httpBatchLink } from "@trpc/client";
import { type AppRouter } from "@/server/api/root";
import superjson from "superjson";

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  return 'http://localhost:3000';
};

export const api = createTRPCClient<AppRouter>({
  links: [
    loggerLink({
      enabled: (opts) =>
        process.env.NODE_ENV === "development" ||
        (opts.direction === "down" && opts.result instanceof Error),
    }),
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      headers() {
        return {
          'x-trpc-source': 'server',
        };
      },
      transformer: superjson,
    }),
  ],
});