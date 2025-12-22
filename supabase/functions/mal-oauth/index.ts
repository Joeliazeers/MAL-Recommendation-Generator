import { serve } from "https://deno.land/std@0.208.0/http/server.ts"

const MAL_TOKEN_URL = "https://myanimelist.net/v1/oauth2/token"

// CORS: Use environment variable for production, fallback to '*' for development
const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN') || '*'

const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const { code, code_verifier, grant_type, refresh_token, redirect_uri } = await req.json()
    
    // Get secrets from environment (set these in Supabase Dashboard > Edge Functions > Secrets)
    const clientId = Deno.env.get('MAL_CLIENT_ID')
    const clientSecret = Deno.env.get('MAL_CLIENT_SECRET')

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: 'MAL credentials not configured on server' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate required parameters based on grant type
    if (grant_type === 'refresh_token') {
      if (!refresh_token) {
        return new Response(
          JSON.stringify({ error: 'Missing required parameter: refresh_token' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      // authorization_code flow
      if (!code || !code_verifier || !redirect_uri) {
        return new Response(
          JSON.stringify({ error: 'Missing required parameters: code, code_verifier, or redirect_uri' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Build the request body based on grant type
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: grant_type || 'authorization_code',
    })

    if (grant_type === 'refresh_token') {
      params.append('refresh_token', refresh_token)
    } else {
      params.append('code', code)
      params.append('code_verifier', code_verifier)
      params.append('redirect_uri', redirect_uri)
    }

    // Make request to MAL
    const response = await fetch(MAL_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('MAL OAuth error:', data)
      return new Response(
        JSON.stringify({ error: data.error || 'Failed to exchange token' }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Return the tokens
    return new Response(
      JSON.stringify({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        token_type: data.token_type,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
