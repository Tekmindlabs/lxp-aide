import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/api/root';
import { createTRPCContext } from '@/server/api/trpc';
import { NextRequest } from 'next/server';

const handler = async (req: NextRequest) => {
  const url = new URL(req.url);
  const searchParams = Object.fromEntries(url.searchParams.entries());
  
  console.log('🔍 COMPREHENSIVE TRPC REQUEST DIAGNOSTIC', {
    timestamp: new Date().toISOString(),
    method: req.method,
    fullUrl: req.url,
    pathname: url.pathname,
    headers: Object.fromEntries(req.headers.entries()),
    searchParams: JSON.stringify(searchParams),
    trpcPath: url.pathname.split('/').pop()
  });

  // Enhanced error handling and logging
  try {
    const response = await fetchRequestHandler({
      endpoint: "/api/trpc/[trpc]",
      req,
      router: appRouter,
      createContext: async () => {
        const context = await createTRPCContext({ req });
        console.log('🔐 Context Creation Details', {
          sessionExists: !!context.session,
          userId: context.session?.user?.id,
          timestamp: new Date().toISOString()
        });
        return context;
      },
      onError: ({ path, error }) => {
        console.error('❌ TRPC ROUTE ERROR', {
          path,
          errorName: error.name,
          errorMessage: error.message,
          errorStack: error.stack,
          timestamp: new Date().toISOString()
        });
      },
    });

    console.log('✅ TRPC RESPONSE DETAILS', {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      timestamp: new Date().toISOString()
    });

    // Enhanced CORS and headers
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
    headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    headers.set('Access-Control-Allow-Headers', '*');
    headers.set('X-TRPC-Diagnostic', 'Request Processed Successfully');

    return new Response(response.body, {
      status: response.status,
      headers
    });
  } catch (error) {
    console.error('🚨 CRITICAL TRPC HANDLER ERROR', {
      errorName: error instanceof Error ? error.name : 'Unknown Error',
      errorMessage: error instanceof Error ? error.message : 'No details',
      errorStack: error instanceof Error ? error.stack : 'No trace',
      requestDetails: {
        url: req.url,
        method: req.method,
        pathname: url.pathname
      },
      timestamp: new Date().toISOString()
    });

    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      diagnosticMessage: 'Failed to process tRPC request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-TRPC-Error': 'Request Processing Failed'
      }
    });
  }
};

export { handler as GET, handler as POST };

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}


