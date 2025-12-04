/**
 * Health check endpoint for connectivity testing
 * Used by the offline detection system to verify actual internet connectivity
 */

export async function GET() {
  return new Response(null, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache'
    }
  });
}

export async function HEAD() {
  return new Response(null, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache'
    }
  });
}


