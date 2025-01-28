import { headers } from "next/headers";
import { createTRPCClient, loggerLink, httpBatchLink } from "@trpc/client";
import { type AppRouter } from "@/server/api/root";

export const api = createTRPCClient<AppRouter>({
	links: [
		loggerLink({
			enabled: (opts) =>
				process.env.NODE_ENV === "development" ||
				(opts.direction === "down" && opts.result instanceof Error),
		}),
		httpBatchLink({
			url: `${process.env.NEXT_PUBLIC_APP_URL}/api/trpc`,
			async headers() {
				const headersList = await headers();
				const entries = Array.from(headersList.entries());
				return {
					...Object.fromEntries(entries),
					"x-trpc-source": "rsc",
				};
			},
		}),
	],
});