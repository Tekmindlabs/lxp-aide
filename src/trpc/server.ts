import { createTRPCClient, loggerLink, httpBatchLink } from "@trpc/client";
import { type AppRouter } from "@/server/api/root";
import superjson from "superjson";

export const api = createTRPCClient<AppRouter>({
	links: [
		loggerLink({
			enabled: (opts) =>
				process.env.NODE_ENV === "development" ||
				(opts.direction === "down" && opts.result instanceof Error),
		}),
		httpBatchLink({
			url: process.env.NODE_ENV === 'development' 
				? '/api/trpc'
				: `${process.env.NEXT_PUBLIC_APP_URL}/api/trpc`,
			headers() {
				return {
					'x-trpc-source': 'rsc',
				};
			},
			transformer: superjson,
		}),
	],
});