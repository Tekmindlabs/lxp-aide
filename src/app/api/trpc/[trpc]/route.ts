import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";
import { env } from "@/env.mjs";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { headers } from 'next/headers';

const handler = async (req: NextRequest) => {
	try {
		const response = await fetchRequestHandler({
			endpoint: "/api/trpc",
			req,
			router: appRouter,
			createContext: async () => createTRPCContext({ req }),
			batching: {
				enabled: true
			},
			onError: ({ path, error }) => {
				console.error(`[TRPC] Error in procedure ${path ?? "<no-path>"}: ${error.message}`);
			},
		});

		return response;
	} catch (error) {
		console.error('[TRPC] Unhandled error:', error);
		return new Response(JSON.stringify({ error: 'Internal Server Error' }), { 
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};

export { handler as GET, handler as POST };

