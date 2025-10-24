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
            return res.status(500).json({ error: { message: 'Lỗi cấu hình máy chủ: Thiếu khóa API Perplexity.' } });
        }

        const upstreamResponse = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
            },
            body: JSON.stringify(req.body),
        });

        // Check for errors from Perplexity
        if (!upstreamResponse.ok) {
            const errorBodyText = await upstreamResponse.text();
            console.error(`Lỗi API Perplexity (${upstreamResponse.status}):`, errorBodyText);
            
            try {
                // Perplexity API errors are supposed to be JSON
                const errorJson = JSON.parse(errorBodyText);
                return res.status(upstreamResponse.status).json(errorJson);
            } catch (e) {
                // If it's not JSON (like the HTML error page), return a structured, user-friendly error.
                let message = `Đã xảy ra lỗi không mong muốn với API Perplexity (Trạng thái: ${upstreamResponse.status}).`;
                if (upstreamResponse.status === 401) {
                    message = "Xác thực API Perplexity thất bại. Vui lòng kiểm tra lại API key của bạn đã được cấu hình đúng trên máy chủ.";
                }
                return res.status(upstreamResponse.status).json({
                    error: { message, type: 'proxy_error' }
                });
            }
        }

        // Forward headers for the stream
        res.writeHead(200, {
            'Content-Type': upstreamResponse.headers.get('Content-Type') || 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        });

        // Pipe the stream body back to the client
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
        console.error('Lỗi proxy nội bộ Perplexity:', error);
        res.status(502).json({ error: { message: 'Đã xảy ra lỗi proxy nội bộ.', type: 'proxy_error' } });
    }
}
