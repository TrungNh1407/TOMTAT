// api/ask.js
import { GoogleGenAI } from '@google/genai';

/**
 * Xử lý các yêu cầu API đến Gemini.
 * Chạy trên server-side của Vercel để bảo mật API key.
 * @param {import('http').IncomingMessage} req - Yêu cầu đến.
 * @param {import('http').ServerResponse} res - Phản hồi đi.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // Body sẽ chứa tất cả các tham số cần thiết cho SDK
    const { model, contents, config, stream } = req.body;

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      console.error("GEMINI_API_KEY is not set.");
      return res.status(500).json({ error: 'Server not configured: API key missing.' });
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    if (stream) {
      const responseStream = await ai.models.generateContentStream({ model, contents, config });
      
      // Đặt headers cho streaming
      res.writeHead(200, {
        'Content-Type': 'application/json', // Các chunk là đối tượng JSON, client sẽ phân tích NDJSON.
        'Transfer-Encoding': 'chunked',
      });

      // Stream mỗi chunk dưới dạng một chuỗi JSON được phân tách bằng dòng mới
      for await (const chunk of responseStream) {
        // FIX: Thuộc tính `.text` của đối tượng `GenerateContentResponse` là một getter,
        // nó không được tuần tự hóa bởi JSON.stringify. Chúng ta phải gọi nó một cách tường minh và
        // tạo một đối tượng có thể tuần tự hóa mới để gửi cho client.
        const serializableChunk = {
          candidates: chunk.candidates,
          text: chunk.text,
        };
        res.write(JSON.stringify(serializableChunk) + '\n');
      }
      res.end();
    } else {
      // Xử lý các yêu cầu không streaming
      const response = await ai.models.generateContent({ model, contents, config });
      
      // FIX: Thuộc tính `.text` của đối tượng `GenerateContentResponse` là một getter.
      // Chúng ta phải tạo một đối tượng có thể tuần tự hóa một cách tường minh để đảm bảo client nhận được văn bản.
      const serializableResponse = {
        candidates: response.candidates,
        text: response.text,
      };
      res.status(200).json(serializableResponse);
    }
  } catch (error) {
    console.error('Error in /api/ask route:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ error: 'An error occurred while calling the Gemini API.', details: message });
  }
}