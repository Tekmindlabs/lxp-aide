import { httpBatchLink, loggerLink } from '@trpc/client';
import { createTRPCNext } from '@trpc/next';
import superjson from 'superjson';
import { type AppRouter } from '@/server/api/root';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return '';
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  return 'http://localhost:3000';
};

export const api = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === 'development' ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson, // Move transformer here
          headers() {
            return {
              'x-trpc-source': 'react',
            };
          },
        }),
      ],
    };
  },
  ssr: false,
});

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;