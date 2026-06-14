/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import fs from 'fs';
import axios from 'axios';
import https from 'https';
import path from 'path';
import { WebSocket, WebSocketServer } from 'ws';
import { URLSearchParams, URL } from 'url';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { pipeline } from 'stream/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const externalApiBaseUrl = 'https://generativelanguage.googleapis.com';
const externalWsBaseUrl = 'wss://generativelanguage.googleapis.com';
const perplexityApiBaseUrl = 'https://api.perplexity.ai';

// Support either API key env-var variant
const apiKeysStr = process.env.GEMINI_API_KEYS;
let geminiApiKeys = [];
if (apiKeysStr) {
  geminiApiKeys = apiKeysStr.split(',').map(k => k.trim()).filter(Boolean);
}
if (geminiApiKeys.length === 0) {
  const singleKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (singleKey) geminiApiKeys.push(singleKey);
}

const getGeminiApiKey = () => {
    if (geminiApiKeys.length === 0) return null;
    return geminiApiKeys[Math.floor(Math.random() * geminiApiKeys.length)];
};
const apiKey = geminiApiKeys.length > 0 ? geminiApiKeys[0] : null;

const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
const deepseekApiKey = process.env.DEEPSEEK_API_KEY;


const staticPath = path.join(__dirname,'dist');
const publicPath = path.join(__dirname,'public');


if (!apiKey) {
    console.error("Warning: GEMINI_API_KEY or API_KEY environment variable is not set! Gemini proxy functionality will be disabled.");
} else {
  console.log("GEMINI_API_KEY FOUND (proxy will use this)")
}

if (!perplexityApiKey) {
    console.error("Warning: PERPLEXITY_API_KEY environment variable is not set! Perplexity proxy functionality will be disabled.");
} else {
  console.log("PERPLEXITY_API_KEY FOUND (proxy will use this)")
}

if (!deepseekApiKey) {
    console.error("Warning: DEEPSEEK_API_KEY environment variable is not set! DeepSeek proxy functionality will be disabled.");
} else {
  console.log("DEEPSEEK_API_KEY FOUND (proxy will use this)")
}


// Limit body size to 50mb
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({extended: true, limit: '50mb'}));
app.set('trust proxy', 1 /* number of proxies between user and server */)

// Rate limiter for the proxy
const proxyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // Set ratelimit window at 15min (in ms)
    max: 100, // Limit each IP to 100 requests per window
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // no `X-RateLimit-*` headers
    handler: (req, res, next, options) => {
        console.warn(`Rate limit exceeded for IP: ${req.ip}. Path: ${req.path}`);
        res.status(options.statusCode).send(options.message);
    }
});

// Apply the rate limiter to all proxy routes
app.use('/api-proxy', proxyLimiter);
app.use('/perplexity-proxy', proxyLimiter);
app.use('/deepseek-proxy', proxyLimiter);

// --- Status Endpoint ---
app.get('/api/status', async (req, res) => {
    const statuses = {
        Google: { configured: false, valid: false },
        Perplexity: { configured: false, valid: false },
        DeepSeek: { configured: false, valid: false }
    };
    
    // Check Google (Gemini)
    const geminiKey = getGeminiApiKey();
    if (geminiKey) {
        statuses.Google.configured = true;
        try {
            const resp = await axios.get(`${externalApiBaseUrl}/v1beta/models?key=${geminiKey}`, { timeout: 5000, validateStatus: () => true });
            statuses.Google.valid = resp.status === 200;
        } catch(e) {}
    }
    
    // Check Perplexity
    if (perplexityApiKey) {
        statuses.Perplexity.configured = true;
        try {
            const resp = await axios.post(`${perplexityApiBaseUrl}/chat/completions`, {}, {
                headers: { 'Authorization': `Bearer ${perplexityApiKey}` },
                timeout: 5000,
                validateStatus: () => true
            });
            // 400 means Bad Request (missing body) which implies auth succeeded.
            // 401 means Unauthorized.
            statuses.Perplexity.valid = resp.status !== 401 && resp.status !== 403;
        } catch(e) {}
    }
    
    // Check DeepSeek
    if (deepseekApiKey) {
        statuses.DeepSeek.configured = true;
        try {
            const resp = await axios.get(`${deepseekApiBaseUrl}/models`, {
                headers: { 'Authorization': `Bearer ${deepseekApiKey}` },
                timeout: 5000,
                validateStatus: () => true
            });
            statuses.DeepSeek.valid = resp.status === 200;
        } catch(e) {}
    }
    
    res.json(statuses);
});

// --- Perplexity Proxy ---
app.use('/perplexity-proxy', async (req, res) => {
    if (!perplexityApiKey) {
        return res.status(500).json({ error: 'Perplexity API key not configured on server.' });
    }
    try {
        const targetUrl = `${perplexityApiBaseUrl}${req.originalUrl.replace('/perplexity-proxy', '')}`;
        console.log(`Perplexity Proxy: Forwarding request to ${targetUrl}`);

        const outgoingHeaders = {
            'Authorization': `Bearer ${perplexityApiKey}`,
            'Content-Type': req.headers['content-type'] || 'application/json',
            'Accept': req.headers['accept'] || '*/*',
        };
        
        const axiosConfig = {
            method: req.method,
            url: targetUrl,
            headers: outgoingHeaders,
            data: req.body,
            responseType: 'stream',
            validateStatus: () => true,
        };

        const apiResponse = await axios(axiosConfig);

        res.status(apiResponse.status);
        const hopByHopHeaders = ['transfer-encoding', 'connection', 'keep-alive', 'upgrade', 'expect', 'content-length', 'content-encoding'];
        Object.keys(apiResponse.headers).forEach(key => {
            if (!hopByHopHeaders.includes(key.toLowerCase())) {
                res.setHeader(key, apiResponse.headers[key]);
            }
        });
        
        if (res.flushHeaders) res.flushHeaders();
        await pipeline(apiResponse.data, res);

    } catch (error) {
        console.error('Perplexity Proxy Error:', error.message);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Perplexity proxy failed', message: error.message });
        }
    }
});

const deepseekApiBaseUrl = 'https://api.deepseek.com';

// --- DeepSeek Proxy ---
app.use('/deepseek-proxy', async (req, res) => {
    if (!deepseekApiKey) {
        return res.status(500).json({ error: 'DeepSeek API key not configured on server.' });
    }
    try {
        const targetUrl = `${deepseekApiBaseUrl}${req.originalUrl.replace('/deepseek-proxy', '')}`;
        console.log(`DeepSeek Proxy: Forwarding request to ${targetUrl}`);

        const outgoingHeaders = {
            'Authorization': `Bearer ${deepseekApiKey}`,
            'Content-Type': req.headers['content-type'] || 'application/json',
            'Accept': req.headers['accept'] || '*/*',
        };
        
        const axiosConfig = {
            method: req.method,
            url: targetUrl,
            headers: outgoingHeaders,
            data: req.body,
            responseType: 'stream',
            validateStatus: () => true,
        };

        const apiResponse = await axios(axiosConfig);

        res.status(apiResponse.status);
        const hopByHopHeaders = ['transfer-encoding', 'connection', 'keep-alive', 'upgrade', 'expect', 'content-length', 'content-encoding'];
        Object.keys(apiResponse.headers).forEach(key => {
            if (!hopByHopHeaders.includes(key.toLowerCase())) {
                res.setHeader(key, apiResponse.headers[key]);
            }
        });
        
        if (res.flushHeaders) res.flushHeaders();
        await pipeline(apiResponse.data, res);

    } catch (error) {
        console.error('DeepSeek Proxy Error:', error.message);
        if (!res.headersSent) {
            res.status(500).json({ error: 'DeepSeek proxy failed', message: error.message });
        }
    }
});


// --- Gemini Proxy (HTTP/WebSocket) ---
app.use('/api-proxy', async (req, res, next) => {
    // If the request is an upgrade request, it's for WebSockets, so pass to next middleware/handler
    if (req.headers.upgrade && req.headers.upgrade.toLowerCase() === 'websocket') {
        return next(); // Pass to the WebSocket upgrade handler
    }

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*'); // Adjust as needed for security
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Goog-Api-Key');
        res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight response for 1 day
        return res.sendStatus(200);
    }
    
    if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API key not configured on server.' });
    }

    if (req.body) { // Only log body if it exists
        console.log("  Gemini Request Body (from frontend):", req.body);
    }
    try {
        const urlObj = new URL(`${externalApiBaseUrl}${req.originalUrl.replace('/api-proxy', '')}`);
        urlObj.searchParams.delete('key');
        const targetUrl = urlObj.toString();
        console.log(`Gemini HTTP Proxy: Forwarding request to ${targetUrl}`);

        // Prepare headers for the outgoing request
        const currentGeminiKey = getGeminiApiKey();
        const outgoingHeaders = {
            'X-Goog-Api-Key': currentGeminiKey,
            'Content-Type': req.headers['content-type'] || 'application/json',
            'Accept': req.headers['accept'] || '*/*',
        };

        const axiosConfig = {
            method: req.method,
            url: targetUrl,
            headers: outgoingHeaders,
            data: req.body,
            responseType: 'stream',
            validateStatus: () => true,
        };

        const apiResponse = await axios(axiosConfig);

        res.status(apiResponse.status);
        const hopByHopHeaders = ['transfer-encoding', 'connection', 'keep-alive', 'upgrade', 'expect', 'content-length', 'content-encoding'];
        Object.keys(apiResponse.headers).forEach(key => {
            if (!hopByHopHeaders.includes(key.toLowerCase())) {
                res.setHeader(key, apiResponse.headers[key]);
            }
        });
        
        if (res.flushHeaders) res.flushHeaders();
        await pipeline(apiResponse.data, res);

    } catch (error) {
        console.error('Gemini Proxy error:', error.message);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Gemini proxy error', message: error.message });
        }
    }
});

const webSocketInterceptorScriptTag = `<script src="/public/websocket-interceptor.js" defer></script>`;

// Prepare service worker registration script content
const serviceWorkerRegistrationScript = `
<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load' , () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(registration => {
        console.log('Service Worker registered successfully with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
} else {
  console.log('Service workers are not supported in this browser.');
}
</script>
`;

if (!process.env.VERCEL) {
    app.get('/', (req, res) => {
        const placeholderPath = path.join(publicPath, 'placeholder.html');

        // Try to serve index.html
        console.log("LOG: Route '/' accessed. Attempting to serve index.html.");
        const indexPath = path.join(staticPath, 'index.html');

        fs.readFile(indexPath, 'utf8', (err, indexHtmlData) => {
            if (err) {
                // index.html not found or unreadable, serve the original placeholder
                console.log('LOG: index.html not found or unreadable. Falling back to original placeholder.');
                return res.sendFile(placeholderPath);
            }

            // If Gemini API key is not set, we can still serve the app,
            // but WebSocket proxy won't work. The app might rely on HTTP proxy only.
            if (!apiKey) {
            console.log("LOG: Gemini API key not set. Serving original index.html without WebSocket script injection.");
            return res.sendFile(indexPath);
            }

            // index.html found and Gemini apiKey set, inject WebSocket script
            console.log("LOG: index.html read successfully. Injecting scripts.");
            let injectedHtml = indexHtmlData;


            if (injectedHtml.includes('<head>')) {
                // Inject WebSocket interceptor first, then service worker script
                injectedHtml = injectedHtml.replace(
                    '<head>',
                    `<head>${webSocketInterceptorScriptTag}${serviceWorkerRegistrationScript}`
                );
                console.log("LOG: Scripts injected into <head>.");
            } else {
                console.warn("WARNING: <head> tag not found in index.html. Prepending scripts to the beginning of the file as a fallback.");
                injectedHtml = `${webSocketInterceptorScriptTag}${serviceWorkerRegistrationScript}${indexHtmlData}`;
            }
            res.send(injectedHtml);
        });
    });

    app.get('/service-worker.js', (req, res) => {
    return res.sendFile(path.join(publicPath, 'service-worker.js'));
    });

    app.use('/public', express.static(publicPath));
    app.use(express.static(staticPath));
}

if (!process.env.VERCEL) {
// Start the HTTP server
const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
    if (apiKey) console.log(`Gemini proxy active on /api-proxy/**`);
    if (perplexityApiKey) console.log(`Perplexity proxy active on /perplexity-proxy/**`);
});

// Create WebSocket server and attach it to the HTTP server for Gemini Live
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);
    const pathname = requestUrl.pathname;

    if (pathname.startsWith('/api-proxy/')) {
        if (!apiKey) {
            console.error("WebSocket proxy: Gemini API key not configured. Closing connection.");
            socket.destroy();
            return;
        }

        wss.handleUpgrade(request, socket, head, (clientWs) => {
            console.log('Client WebSocket connected to Gemini proxy for path:', pathname);

            const targetPathSegment = pathname.substring('/api-proxy'.length);
            const clientQuery = new URLSearchParams(requestUrl.search);
            clientQuery.set('key', getGeminiApiKey());
            const targetGeminiWsUrl = `${externalWsBaseUrl}${targetPathSegment}?${clientQuery.toString()}`;
            console.log(`Attempting to connect to target WebSocket: ${targetGeminiWsUrl}`);

            const geminiWs = new WebSocket(targetGeminiWsUrl, {
                protocol: request.headers['sec-websocket-protocol'],
            });

            const messageQueue = [];

            geminiWs.on('open', () => {
                console.log('Proxy connected to Gemini WebSocket');
                while (messageQueue.length > 0) {
                    const message = messageQueue.shift();
                    geminiWs.send(message);
                }
            });

            geminiWs.on('message', (message) => clientWs.send(message));
            geminiWs.on('close', (code, reason) => clientWs.close(code, reason.toString()));
            geminiWs.on('error', (error) => {
                console.error('Error on Gemini WebSocket connection:', error);
                clientWs.close(1011, 'Upstream WebSocket error');
            });

            clientWs.on('message', (message) => {
                if (geminiWs.readyState === WebSocket.OPEN) {
                    geminiWs.send(message);
                } else {
                    messageQueue.push(message);
                }
            });

            clientWs.on('close', (code, reason) => geminiWs.close(code, reason.toString()));
            clientWs.on('error', (error) => {
                console.error('Error on client WebSocket connection:', error);
                geminiWs.close(1011, 'Client WebSocket error');
            });
        });
    } else {
        console.log(`WebSocket upgrade request for non-proxy path: ${pathname}. Closing connection.`);
        socket.destroy();
    }
});
}

export default app;