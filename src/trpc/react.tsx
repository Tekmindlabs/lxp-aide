'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, loggerLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { useState } from 'react';
import { type AppRouter } from '@/server/api/root';
import superjson from 'superjson';

const trpcReact = createTRPCReact<AppRouter>();

export function TRPCReactProvider(props: { children: React.ReactNode; cookies: string }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 30000,
						gcTime: 60000,
						retry: 1,
						refetchOnWindowFocus: false,
					},
				},
			})
	);

	const [trpcClient] = useState(() =>
		trpcReact.createClient({
			links: [
				loggerLink({
					enabled: (opts) =>
						process.env.NODE_ENV === 'development' ||
						(opts.direction === 'down' && opts.result instanceof Error),
				}),
				httpBatchLink({
					url: process.env.NODE_ENV === 'development' 
						? '/api/trpc'
						: `${process.env.NEXT_PUBLIC_APP_URL}/api/trpc`,
					transformer: superjson,
					headers() {
						return {
							cookie: props.cookies,
							'x-trpc-source': 'react',
						};
					},
				}),
			],
		})
	);

	return (
		<QueryClientProvider client={queryClient}>
			<trpcReact.Provider client={trpcClient} queryClient={queryClient}>
				{props.children}
			</trpcReact.Provider>
		</QueryClientProvider>
	);
}

export const api = trpcReact;