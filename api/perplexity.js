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

        // Xử lý các lỗi từ Perplexity
        if (!upstreamResponse.ok) {
            const errorBodyText = await upstreamResponse.text();
            // Ghi lại lỗi thô để gỡ lỗi trên máy chủ
            console.error(`Upstream Perplexity API Error (${upstreamResponse.status}):`, errorBodyText);
            
            // Cố gắng phân tích lỗi dưới dạng JSON, theo đặc tả của Perplexity
            try {
                const errorJson = JSON.parse(errorBodyText);
                return res.status(upstreamResponse.status).json(errorJson);
            } catch (e) {
                // Nếu không phải là JSON, đó là lỗi proxy/mạng/HTML. Tạo một lỗi JSON thân thiện cho client của chúng ta.
                let message = `Đã xảy ra lỗi không mong muốn với API Perplexity (Trạng thái: ${upstreamResponse.status}).`;
                if (upstreamResponse.status === 401) {
                    message = "Xác thực API Perplexity thất bại. Vui lòng kiểm tra lại API key của bạn đã được cấu hình đúng trên máy chủ.";
                }
                
                // Trả về đối tượng lỗi JSON có cấu trúc của riêng chúng ta
                return res.status(upstreamResponse.status).json({
                    error: { message, type: 'proxy_error' }
                });
            }
        }

        // Chuyển tiếp headers cho luồng
        res.writeHead(200, {
            'Content-Type': upstreamResponse.headers.get('Content-Type') || 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        });

        // Chuyển tiếp nội dung luồng về cho client
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