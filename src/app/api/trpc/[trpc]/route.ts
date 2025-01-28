import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";
import { env } from "@/env.mjs";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { headers } from 'next/headers';

const handler = async (req: NextRequest) => {
	console.log(`Handling ${req.method} request to ${req.url}`);

	if (req.method === 'OPTIONS') {
		return new Response(null, {
			status: 200,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Request-Method': '*',
				'Access-Control-Allow-Methods': 'OPTIONS, GET, POST',
				'Access-Control-Allow-Headers': '*',
			},
		});
	}

	const headersList = headers();
	const cookieHeader = headersList.get('cookie') ?? '';

	const response = await fetchRequestHandler({
		endpoint: "/api/trpc",
		req: new Request(req.url, {
			method: req.method,
			headers: {
				...Object.fromEntries(req.headers),
				cookie: cookieHeader,
			},
			body: req.body,
		}),
		router: appRouter,
		createContext: async () => createTRPCContext({ 
			req: new Request(req.url, {
				headers: {
					...Object.fromEntries(req.headers),
					cookie: cookieHeader,
				},
			})
		}),
		onError:
			env.NODE_ENV === "development"
				? ({ path, error }) => {
						console.error(
							`❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
							error
						);
					}
				: undefined,
	});

	response.headers.set('Access-Control-Allow-Origin', '*');
	response.headers.set('Access-Control-Request-Method', '*');
	response.headers.set('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
	response.headers.set('Access-Control-Allow-Headers', '*');

	return response;
};

export { handler as GET, handler as POST, handler as OPTIONS };