// api/perplexity.js
// Proxy các yêu cầu đến Perplexity AI một cách an toàn.
// Chạy trên server-side của Vercel.

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    try {
        const API_KEY = process.env.PERPLEXITY_API_KEY;
        if (!API_KEY) {
            console.error("PERPLEXITY_API_KEY is not set.");
            return res.status(500).json({ error: 'Server configuration error: Perplexity API key is missing.' });
        }

        const upstreamResponse = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
            },
            body: JSON.stringify(req.body),
        });

        // Chuyển tiếp headers
        for (const [key, value] of upstreamResponse.headers.entries()) {
            if (key.toLowerCase() !== 'content-encoding' && key.toLowerCase() !== 'transfer-encoding') {
                 res.setHeader(key, value);
            }
        }
        res.status(upstreamResponse.status);

        // Pipe a stream body
        if (upstreamResponse.body) {
            const reader = upstreamResponse.body.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
            }
        }
        res.end();

    } catch (error) {
        console.error('Perplexity proxy error:', error);
        res.status(502).json({ error: 'Proxy error', details: error.message });
    }
}
