import 'dotenv/config';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { URL } from 'url';

const app = express();

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
const perplexityApiKey = process.env.PERPLEXITY_API_KEY;

// Log key availability for debugging on Vercel
if (!apiKey) {
    console.warn("Warning: GEMINI_API_KEY or API_KEY is not set! Gemini proxy will fail.");
} else {
    console.log("GEMINI_API_KEY found.");
}

if (!perplexityApiKey) {
    console.warn("Warning: PERPLEXITY_API_KEY is not set! Perplexity proxy will fail.");
} else {
    console.log("PERPLEXITY_API_KEY found.");
}

app.use(express.json({ limit: '50mb' }));

const proxyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});

// Perplexity Proxy
app.use('/perplexity-proxy', proxyLimiter, createProxyMiddleware({
    target: 'https://api.perplexity.ai',
    changeOrigin: true,
    pathRewrite: { '^/perplexity-proxy': '' },
    onProxyReq: (proxyReq, req, res) => {
        if (!perplexityApiKey) {
            console.error('Perplexity API key is missing.');
            res.status(500).send('Server configuration error: Perplexity API key not set.');
            proxyReq.abort();
            return;
        }
        proxyReq.setHeader('Authorization', `Bearer ${perplexityApiKey}`);
    },
    logLevel: 'debug',
}));

// Gemini Proxy
app.use('/api-proxy', proxyLimiter, createProxyMiddleware({
    target: 'https://generativelanguage.googleapis.com',
    changeOrigin: true,
    pathRewrite: (path, req) => {
        if (!apiKey) {
            console.error('Gemini API key is missing during pathRewrite.');
            return path.replace('/api-proxy', ''); // Forward without key, will fail and be caught below
        }
        const newPath = path.replace('/api-proxy', '');
        const url = new URL(`https://example.com${newPath}`);
        url.searchParams.set('key', apiKey); // Set the real key, replacing any proxy key from client
        return url.pathname + url.search;
    },
    onProxyReq: (proxyReq, req, res) => {
        if (!apiKey) {
            console.error('Gemini API key is missing.');
            res.status(500).send('Server configuration error: Gemini API key not set.');
            proxyReq.abort();
        }
        // The API key is handled by pathRewrite, no need to add headers here.
    },
    logLevel: 'debug',
}));

// Export the app for Vercel's serverless function handler
export default app;
