import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/api/root';
import { createTRPCContext } from '@/server/api/trpc';
import { NextRequest } from 'next/server';

const handler = async (req: NextRequest) => {
  // Parse batch request details
  const url = new URL(req.url);
  const batchRequests = url.pathname
    .split('/api/trpc/')[1]
    ?.split(',')
    .filter(Boolean);

  console.log('🔍 BATCH REQUEST ANALYSIS', {
    fullUrl: req.url,
    method: req.method,
    batchRequests,
    headers: Object.fromEntries(req.headers.entries()),
    timestamp: new Date().toISOString()
  });

  try {
    const response = await fetchRequestHandler({
      req: req as unknown as Request,
      endpoint: '/api/trpc',
      router: appRouter,
      createContext: async () => {
        const context = await createTRPCContext({ req: req as unknown as Request });
        console.log('🔐 Context Creation Details', {
          sessionExists: !!context.session,
          userId: context.session?.user?.id,
          userRoles: context.session?.user?.roles,
          userPermissions: context.session?.user?.permissions,
          timestamp: new Date().toISOString()
        });
        return context;
      },
      onError: ({ path, error }) => {
        console.error('❌ TRPC Error', {
          path,
          errorType: error.name,
          errorMessage: error.message,
          errorCode: error instanceof Error ? error.cause : undefined,
          timestamp: new Date().toISOString()
        });
      },
      batching: {
        enabled: true
      }
    });

    // Add diagnostic headers
    const headers = new Headers(response.headers);
    headers.set('X-TRPC-Batch-Size', String(batchRequests?.length || 1));
    headers.set('X-TRPC-Version', '10.x');
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    headers.set('Access-Control-Allow-Headers', '*');

    return new Response(response.body, {
      status: response.status,
      headers
    });
  } catch (error) {
    console.error('🚨 Critical Handler Error', {
      errorType: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
      batchRequests,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        code: 'INTERNAL_SERVER_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
        path: batchRequests,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
          'Access-Control-Allow-Headers': '*'
        }
      }
    );
  }
};

export { handler as GET, handler as POST };

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': '*'
    }
  });
}



