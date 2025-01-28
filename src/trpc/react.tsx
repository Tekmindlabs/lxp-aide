'use client';

import { QueryClient, QueryClientProvider, QueryObserverOptions } from '@tanstack/react-query';
import { httpBatchLink, loggerLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { useState } from 'react';
import { type AppRouter } from '@/server/api/root';
import superjson from 'superjson';
import { TRPCError } from '@trpc/server';

const getBaseUrl = () => {
	// Server-side rendering
	if (typeof window === 'undefined') {
		// Prioritize environment variable, then fallback
		if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
		
		// Detect vercel deployment or default to localhost
		if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
		
		return 'http://localhost:3000';
	}

	// Client-side: use current origin
	return window.location.origin;
};

export const trpc = createTRPCReact<AppRouter>();

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(() => new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 30000,
				retry: (failureCount, error) => {
					if (error instanceof TRPCError) {
						switch (error.code) {
							case 'UNAUTHORIZED':
							case 'FORBIDDEN':
								return false;
							default:
								return failureCount < 1;
						}
					}
					return failureCount < 1;
				},
				retryDelay: 500,
				onError: (error: unknown) => {
					console.error('Query Error', error);
				},
			} as QueryObserverOptions,
		},
	}));

	const [trpcClient] = useState(() =>
		trpc.createClient({
			links: [
				loggerLink({
					enabled: (opts) =>
						process.env.NODE_ENV === 'development' ||
						(opts.direction === 'down' && opts.result instanceof Error),
					logger: (type, data) => {
						console.log(`TRPC Link Logger (${type})`, data);
					}
				}),
				httpBatchLink({
					url: `${getBaseUrl()}/api/trpc`,
					fetch(url, options) {
						return fetch(url, {
							...options,
							credentials: 'include',
						});
					},
					transformer: superjson,
				}),
			],
		})
	);

	return (
		<QueryClientProvider client={queryClient}>
			<trpc.Provider client={trpcClient} queryClient={queryClient}>
				{children}
			</trpc.Provider>
		</QueryClientProvider>
	);
}

export const api = trpc;


