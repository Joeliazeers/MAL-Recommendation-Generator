export const config = {
  runtime: 'edge',
}

export default async function handler(request) {
  const url = new URL(request.url)
  
  // Get the path after /api/mal/v2
  const malPath = url.pathname.replace('/api/mal/v2', '/v2')
  const malUrl = `https://api.myanimelist.net${malPath}${url.search}`
  
  // Get headers from original request
  const headers = new Headers()
  
  // Forward authorization header
  const authHeader = request.headers.get('Authorization')
  if (authHeader) {
    headers.set('Authorization', authHeader)
  }
  
  // Forward X-MAL-CLIENT-ID if present
  const clientIdHeader = request.headers.get('X-MAL-CLIENT-ID')
  if (clientIdHeader) {
    headers.set('X-MAL-CLIENT-ID', clientIdHeader)
  }

  try {
    const response = await fetch(malUrl, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' 
        ? await request.text() 
        : undefined,
    })

    // Get response data
    const data = await response.text()
    
    // Return response with CORS headers
    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, X-MAL-CLIENT-ID, Content-Type',
      },
    })
  } catch (_error) {
    return new Response(
      JSON.stringify({ error: 'Failed to proxy request to MAL API' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
}
