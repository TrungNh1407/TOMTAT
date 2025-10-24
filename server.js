// This file is now a Vercel Serverless Function, not an Express server.
// It acts as a secure proxy to the Gemini and Perplexity APIs.

export default async function handler(request, response) {
  // Determine the target API based on the request path
  const url = new URL(request.url, `http://${request.headers.host}`);
  
  let targetUrl;
  let apiKey;
  let authHeader = '';

  if (url.pathname.startsWith('/perplexity-proxy/')) {
    targetUrl = `https://api.perplexity.ai${url.pathname.replace('/perplexity-proxy', '')}`;
    apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      console.error('PERPLEXITY_API_KEY is not set.');
      return response.status(500).json({ error: 'Server configuration error: Perplexity API key is missing.' });
    }
    authHeader = `Bearer ${apiKey}`;
    console.log(`Proxying to Perplexity: ${targetUrl}`);
  } else if (url.pathname.startsWith('/api-proxy/')) {
    const geminiPath = url.pathname.replace('/api-proxy', '');
    targetUrl = `https://generativelanguage.googleapis.com${geminiPath}${url.search}`;
    apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set.');
      return response.status(500).json({ error: 'Server configuration error: Gemini API key is missing.' });
    }
    // Add the key as a query parameter for Gemini
    const targetUrlObj = new URL(targetUrl);
    targetUrlObj.searchParams.set('key', apiKey);
    targetUrl = targetUrlObj.toString();
    console.log(`Proxying to Gemini: ${targetUrl}`);
  } else {
    return response.status(404).json({ error: 'Not Found' });
  }
  
  try {
    const proxyResponse = await fetch(targetUrl, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        // Copy other necessary headers from the original request if needed
        ...(authHeader ? { 'Authorization': authHeader } : {})
      },
      body: request.method !== 'GET' && request.method !== 'HEAD' ? JSON.stringify(request.body) : undefined,
      signal: request.signal, // Pass through the abort signal
    });

    // Check if the response is streamable
    const isStream = proxyResponse.headers.get('content-type')?.includes('text/event-stream');

    // Set response headers from the target response
    response.statusCode = proxyResponse.status;
    for (const [key, value] of proxyResponse.headers.entries()) {
      response.setHeader(key, value);
    }
    
    // Stream the response back to the client
    if (proxyResponse.body) {
      const reader = proxyResponse.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        response.write(value);
      }
    }
    
    response.end();

  } catch (error) {
    console.error('Proxy error:', error);
    response.status(502).json({ error: 'Proxy error', details: error.message });
  }
}
