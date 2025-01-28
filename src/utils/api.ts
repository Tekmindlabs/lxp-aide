import { createTRPCNext } from '@trpc/next';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../server/api/root';
import superjson from 'superjson';

export const api = createTRPCNext<AppRouter>({
  transformer: superjson,
  config() {
    return {
      links: [
        httpBatchLink({
          url: `${process.env.NEXT_PUBLIC_APP_URL}/api/trpc`,
          headers() {
            return {
              'Content-Type': 'application/json',
            };
          },
        }),
      ],
    };
  },
  ssr: false,
});



