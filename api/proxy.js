const IGNORED_RESPONSE_HEADERS = new Set([
  'content-encoding',
  'content-length',
  'transfer-encoding',
]);

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

async function readRequestBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return undefined;
  }

  const chunks = [];
  for await (const chunk of req) {
    if (typeof chunk === 'string') {
      chunks.push(Buffer.from(chunk));
    } else {
      chunks.push(chunk);
    }
  }

  if (chunks.length === 0) {
    return undefined;
  }

  return Buffer.concat(chunks);
}

function buildTargetUrl(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host || 'localhost';
  const url = new URL(req.url, `${protocol}://${host}`);

  if (url.pathname.startsWith('/perplexity-proxy/')) {
    return {
      service: 'perplexity',
      targetUrl: `https://api.perplexity.ai${url.pathname.replace('/perplexity-proxy', '')}${url.search}`,
    };
  }

  if (url.pathname.startsWith('/api-proxy/')) {
    return {
      service: 'gemini',
      targetUrl: `https://generativelanguage.googleapis.com${url.pathname.replace('/api-proxy', '')}${url.search}`,
    };
  }

  return { service: null, targetUrl: null };
}

function buildForwardHeaders(req, authHeader) {
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue;

    // Skip hop-by-hop headers
    if (key === 'host' || key === 'connection' || key === 'content-length') {
      continue;
    }

    if (Array.isArray(value)) {
      headers.set(key, value.join(','));
    } else {
      headers.set(key, value);
    }
  }

  if (authHeader) {
    headers.set('authorization', authHeader);
  }

  return headers;
}

async function proxyRequest(req, res) {
  const { service, targetUrl: initialTargetUrl } = buildTargetUrl(req);
  let targetUrl = initialTargetUrl;

  if (!service || !targetUrl) {
    sendJson(res, 404, { error: 'Not Found' });
    return;
  }

  let authHeader = '';
  if (service === 'perplexity') {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      console.error('PERPLEXITY_API_KEY is not set.');
      sendJson(res, 500, { error: 'Server configuration error: Perplexity API key is missing.' });
      return;
    }
    authHeader = `Bearer ${apiKey}`;
  } else if (service === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set.');
      sendJson(res, 500, { error: 'Server configuration error: Gemini API key is missing.' });
      return;
    }

    const url = new URL(targetUrl);
    url.searchParams.set('key', apiKey);
    targetUrl = url.toString();
  }

  try {
    const body = await readRequestBody(req);
    const headers = buildForwardHeaders(req, authHeader);

    const proxyResponse = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    res.statusCode = proxyResponse.status;
    for (const [key, value] of proxyResponse.headers.entries()) {
      if (IGNORED_RESPONSE_HEADERS.has(key.toLowerCase())) {
        continue;
      }
      res.setHeader(key, value);
    }

    if (proxyResponse.body) {
      const reader = proxyResponse.body.getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          res.write(Buffer.from(value));
        }
      }
    }

    res.end();
  } catch (error) {
    console.error('Proxy error:', error);
    sendJson(res, 502, { error: 'Proxy error', details: error.message });
  }
}

export default async function handler(req, res) {
  // Enable CORS for local development and Vercel previews
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    req.headers['access-control-request-headers'] || 'Content-Type, Authorization'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  await proxyRequest(req, res);
}
