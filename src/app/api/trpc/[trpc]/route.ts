import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/api/root';
import { createTRPCContext } from '@/server/api/trpc';
import { NextRequest } from 'next/server';

const handler = async (req: NextRequest) => {
  // Capture raw request details
  console.log('🔍 RAW REQUEST DIAGNOSTIC', {
    fullUrl: req.url,
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
    rawPathname: new URL(req.url).pathname,
  });

  const url = new URL(req.url);
  const searchParams = Object.fromEntries(url.searchParams.entries());
  
  // Comprehensive path segment analysis
  const fullPathSegments = url.pathname.split('/');
  const pathSegments = fullPathSegments.filter(Boolean);
  
  // Advanced path extraction with multiple fallback strategies
  const extractTrpcPath = () => {
    // Strategy 1: Find [trpc] segment
    const trpcIndex = pathSegments.findIndex(segment => 
      segment === '[trpc]' || segment.includes('trpc')
    );
    if (trpcIndex >= 0) {
      return pathSegments.slice(trpcIndex + 1).join('/');
    }

    // Strategy 2: Look for last segment after /api/trpc/
    const apiTrpcIndex = fullPathSegments.indexOf('api') + 2;
    if (apiTrpcIndex > 1 && apiTrpcIndex < fullPathSegments.length) {
      return fullPathSegments.slice(apiTrpcIndex).join('/');
    }

    // Strategy 3: Use last segment as fallback
    return pathSegments[pathSegments.length - 1];
  };

  const trpcPath = extractTrpcPath();
  
  console.log('🚦 ADVANCED TRPC PATH DIAGNOSTIC', {
    fullPathSegments,
    pathSegments,
    extractedTrpcPath: trpcPath,
    searchParams: JSON.stringify(searchParams),
  });


  // Enhanced error handling and logging
  try {
    const response = await fetchRequestHandler({
      req: req as unknown as Request,  // Cast NextRequest to Request
      endpoint: trpcPath || 'unknown',  // Fallback to 'unknown' if no path
      router: appRouter,
      createContext: async () => {
      const context = await createTRPCContext({ req: req as unknown as Request });
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
        trpcPath,
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
    headers.set('X-TRPC-Endpoint', trpcPath);

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
      pathname: url.pathname,
      trpcPath
      },
      timestamp: new Date().toISOString()
    });

    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      diagnosticMessage: 'Failed to process tRPC request',
      details: error instanceof Error ? error.message : 'Unknown error',
      trpcPath
    }), {
      status: 500,
      headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'X-TRPC-Error': 'Request Processing Failed',
      'X-TRPC-Endpoint': trpcPath
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


