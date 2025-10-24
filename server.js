/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// This is a simplified server file for Vercel deployment.
// Vercel handles static file serving automatically from the 'dist' directory.
// This file only needs to act as an API proxy.

require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
const perplexityApiKey = process.env.PERPLEXITY_API_KEY;

// Log key availability
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


// Vercel's body parser middleware is sufficient. No need for express.json() here
// for proxying, but we keep it in case of direct POSTs to the function itself.
app.use(express.json({ limit: '50mb' }));

// Set up rate limiting to prevent abuse
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
            return res.status(500).send('Server configuration error: Perplexity API key not set.');
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
        // Add the API key to the query parameters
        const newPath = path.replace('/api-proxy', '');
        const url = new URL(`https://example.com${newPath}`); // Base URL doesn't matter, just for parsing
        url.searchParams.set('key', apiKey);
        return url.pathname + url.search;
    },
    onProxyReq: (proxyReq, req, res) => {
        if (!apiKey) {
            console.error('Gemini API key is missing.');
            return res.status(500).send('Server configuration error: Gemini API key not set.');
        }
        // Remove the API key from the request body if it was sent from the client
        if (req.body && req.body.apiKey) {
            delete req.body.apiKey;
        }
        // We are adding the key via pathRewrite, but just in case,
        // let's also ensure it's in the header for certain calls.
        proxyReq.setHeader('X-Goog-Api-Key', apiKey);
    },
    logLevel: 'debug',
}));


// Export the app for Vercel
module.exports = app;