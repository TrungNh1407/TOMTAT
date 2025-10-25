// api/ask.js
import { GoogleGenAI } from '@google/genai';

/**
 * Xử lý các yêu cầu API đến Gemini với logic dự phòng khóa.
 * Chạy trên server-side của Vercel để bảo mật API key.
 * @param {import('http').IncomingMessage} req - Yêu cầu đến.
 * @param {import('http').ServerResponse} res - Phản hồi đi.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  let lastError = null;

  try {
    const { model, contents, config, stream, keys: userKeys } = req.body;
    
    // Ưu tiên các khóa do người dùng cung cấp, sau đó đến các khóa từ biến môi trường
    const serverKeys = process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(',').map(k => k.trim()).filter(Boolean) : [];
    const keysToTry = (userKeys && userKeys.length > 0) ? userKeys : serverKeys;

    if (keysToTry.length === 0) {
      console.error("Không có khóa API Gemini nào được cấu hình.");
      return res.status(500).json({ error: 'Server not configured: API key missing.' });
    }

    for (const key of keysToTry) {
      try {
        const ai = new GoogleGenAI({ apiKey: key });

        if (stream) {
          const responseStream = await ai.models.generateContentStream({ model, contents, config });
          
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Transfer-Encoding': 'chunked',
          });

          for await (const chunk of responseStream) {
            const serializableChunk = {
              candidates: chunk.candidates,
              text: chunk.text,
            };
            res.write(JSON.stringify(serializableChunk) + '\n');
          }
          res.end();
        } else {
          const response = await ai.models.generateContent({ model, contents, config });
          const serializableResponse = {
            candidates: response.candidates,
            text: response.text,
          };
          res.status(200).json(serializableResponse);
        }
        
        // Nếu thành công, thoát khỏi vòng lặp và hàm
        return; 

      } catch (error) {
        console.warn(`Khóa API [${key.substring(0, 4)}...] thất bại. Đang thử khóa tiếp theo. Lỗi:`, error.message);
        lastError = error; // Lưu lỗi cuối cùng để trả về nếu tất cả các khóa đều thất bại
      }
    }

    // Nếu vòng lặp hoàn tất mà không thành công, hãy ném lỗi cuối cùng
    if (lastError) {
        throw lastError;
    }

  } catch (error) {
    console.error('Error in /api/ask route after all retries:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    
    let statusCode = 500;
    if (message.includes('API key not valid') || message.includes('permission')) {
        statusCode = 401;
    } else if (message.includes('quota')) {
        statusCode = 429;
    }
    
    res.status(statusCode).json({ error: 'Đã xảy ra lỗi khi gọi API Gemini sau khi thử tất cả các khóa.', details: message });
  }
}