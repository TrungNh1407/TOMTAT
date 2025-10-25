import { GoogleGenAI, Type } from "@google/genai";
import type { GenerateContentResponse, GroundingChunk, Content } from "@google/genai";
import type { Message, Flashcard, QuizQuestion } from './types';
import { isAiStudio } from "./isAiStudio";

// Các API endpoint mới trỏ đến các serverless functions của chúng ta.
const GEMINI_API_URL = '/api/ask';
const PPLX_API_URL = '/api/perplexity';

const isPerplexityModel = (model: string) => !model.startsWith('gemini');


// Cài đặt an toàn cho Gemini để giảm thiểu việc chặn nội dung y khoa hợp lệ.
const GEMINI_SAFETY_SETTINGS = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
];


export interface StreamChunk {
  text?: string;
  progress?: string;
  groundingChunks?: GroundingChunk[];
}

// --- Helper Functions for API Calls ---

/**
 * Gửi yêu cầu đến Gemini API route an toàn của chúng ta.
 * @param body - Nội dung yêu cầu gửi đến serverless function.
 * @param signal - AbortSignal để hủy yêu cầu.
 * @returns {Promise<Response>}
 */
async function callGeminiApi(body: object, signal?: AbortSignal): Promise<Response> {
    // Đọc các khóa do người dùng cung cấp từ localStorage để chuyển tiếp đến backend
    const storedKeys = localStorage.getItem('geminiApiKeys');
    const keys = storedKeys ? JSON.parse(storedKeys) : [];

    const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, keys }), // Thêm các khóa vào body
        ...(signal && { signal }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Lỗi gọi API Gemini proxy:", errorBody);
        try {
            const errorJson = JSON.parse(errorBody);
            throw new Error(errorJson.error || 'Không thể gọi API Gemini. Vui lòng thử lại.');
        } catch (e) {
            // Nếu phần thân không phải là JSON, hãy trả về văn bản lỗi thô.
             throw new Error(errorBody || 'Không thể gọi API Gemini. Vui lòng thử lại.');
        }
    }
    return response;
}

// --- Perplexity (Sonar) Implementation ---
async function* streamChatResponsePerplexity({ model, history, newMessage, systemPrompt, signal }: {
    model: string;
    history: Message[];
    newMessage: string;
    systemPrompt: string;
    signal: AbortSignal;
}): AsyncGenerator<{ text: string }> {
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];
    if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
    }
    // Chuyển đổi định dạng lịch sử của ứng dụng sang định dạng của Perplexity
    history.forEach(msg => {
        messages.push({
            role: msg.role === 'model' ? 'assistant' : 'user',
            content: msg.content
        });
    });
    // Thêm tin nhắn mới của người dùng
    messages.push({ role: 'user', content: newMessage });

    const body = {
        model,
        messages,
        stream: true,
    };

    const response = await fetch(PPLX_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal,
    });

    if (!response.ok) {
        try {
            const errorData = await response.json();
            const message = errorData?.error?.message || `Lỗi không xác định từ API Perplexity (${response.status}).`;
            throw new Error(message);
        } catch (e) {
            throw new Error(`Lỗi API Perplexity: ${response.status} - Máy chủ trả về phản hồi không hợp lệ.`);
        }
    }

    if (!response.body) {
        return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.substring(6);
                if (data.trim() === '[DONE]') {
                    return;
                }
                try {
                    const chunk = JSON.parse(data);
                    const text = chunk.choices?.[0]?.delta?.content || '';
                    if (text) {
                        yield { text };
                    }
                } catch (e) {
                    console.error('Lỗi phân tích cú pháp luồng Perplexity:', e);
                }
            }
        }
    }
}

// New function for chunked summarization
async function* streamChunkedSummarization(
    { model, content, systemPrompt, signal }: {
        model: string;
        content: string;
        systemPrompt: string;
        signal: AbortSignal;
    }
): AsyncGenerator<StreamChunk> {
    const PERPLEXITY_TOKEN_LIMIT = 131072;
    // Using a safer 2.5 chars/token for calculation and 80% buffer
    const CHUNK_CHAR_LIMIT = Math.floor(PERPLEXITY_TOKEN_LIMIT * 0.8 * 2.5);

    // 1. Split content into chunks
    const chunks: string[] = [];
    for (let i = 0; i < content.length; i += CHUNK_CHAR_LIMIT) {
        chunks.push(content.substring(i, i + CHUNK_CHAR_LIMIT));
    }
    yield { progress: `Tài liệu quá lớn. Bắt đầu tóm tắt thành ${chunks.length} phần...\n` };

    // 2. Summarize each chunk (Map step)
    const chunkSummaries: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
        if (signal.aborted) throw new Error("Thao tác đã bị người dùng hủy bỏ.");
        const chunk = chunks[i];
        yield { progress: `\nĐang tóm tắt phần ${i + 1}/${chunks.length}...` };

        const chunkSummaryPrompt = `Vui lòng tóm tắt chi tiết đoạn văn bản sau, đây là một phần của một tài liệu lớn hơn. Trích xuất tất cả các điểm chính, dữ liệu quan trọng và kết luận.
        ---
        ${chunk}`;
        
        const summary = await generateContent(chunkSummaryPrompt, model);
        chunkSummaries.push(summary);
        yield { progress: ` xong.` };
    }
    
    // 3. Combine summaries and summarize again (Reduce step)
    const combinedSummaries = chunkSummaries.join('\n\n---\n\n');
    yield { progress: '\n\nĐã xong các phần. Bây giờ tổng hợp lại thành một bản tóm tắt cuối cùng...' };

    const finalSystemPrompt = `Bạn là một chuyên gia trong việc kết hợp nhiều bản tóm tắt thành một bản tóm tắt cuối cùng, mạch lạc. Dưới đây là một tập hợp các bản tóm tắt từ các phần khác nhau của một tài liệu lớn. Vui lòng hợp nhất chúng thành một bản tóm tắt duy nhất, có cấu trúc tốt, tuân theo các nguyên tắc sau:\n\n${systemPrompt}`;
    
    // 4. Stream the final result
    const finalStream = streamChatResponsePerplexity({
        model,
        history: [],
        newMessage: combinedSummaries,
        systemPrompt: finalSystemPrompt,
        signal,
    });
    
    yield { progress: '[CLEAR]' };

    for await (const chunk of finalStream) {
        yield { text: chunk.text };
    }
}


// --- Gemini Implementation ---

async function* streamChunkedSummarizationGemini(
    { model, content, systemPrompt, useWebSearch, responseMimeType, responseSchema, signal }: {
        model: string;
        content: string;
        systemPrompt: string;
        useWebSearch: boolean;
        responseMimeType?: string;
        responseSchema?: unknown;
        signal: AbortSignal;
    }
): AsyncGenerator<StreamChunk> {
    const GEMINI_TOKEN_LIMIT = 1000000; // A safe token limit for chunking
    // Using a safer 2.5 chars/token for calculation and 80% buffer
    const CHUNK_CHAR_LIMIT = Math.floor(GEMINI_TOKEN_LIMIT * 0.8 * 2.5);

    // 1. Split content into chunks
    const chunks: string[] = [];
    for (let i = 0; i < content.length; i += CHUNK_CHAR_LIMIT) {
        chunks.push(content.substring(i, i + CHUNK_CHAR_LIMIT));
    }
    yield { progress: `Tài liệu quá lớn. Bắt đầu tóm tắt thành ${chunks.length} phần...\n` };

    // 2. Summarize each chunk (Map step)
    const chunkSummaries: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
        if (signal.aborted) throw new Error("Thao tác đã bị người dùng hủy bỏ.");
        const chunk = chunks[i];
        yield { progress: `\nĐang tóm tắt phần ${i + 1}/${chunks.length}...` };

        const chunkSummaryPrompt = `Vui lòng tóm tắt chi tiết đoạn văn bản sau, đây là một phần của một tài liệu lớn hơn. Trích xuất tất cả các điểm chính, dữ liệu quan trọng và kết luận.
        ---
        ${chunk}`;
        
        const summary = await generateContent(chunkSummaryPrompt, model);
        chunkSummaries.push(summary);
        yield { progress: ` xong.` };
    }
    
    // 3. Combine summaries and summarize again (Reduce step)
    const combinedSummaries = chunkSummaries.join('\n\n---\n\n');
    yield { progress: '\n\nĐã xong các phần. Bây giờ tổng hợp lại thành một bản tóm tắt cuối cùng...' };

    const finalSystemPrompt = `Bạn là một chuyên gia trong việc kết hợp nhiều bản tóm tắt thành một bản tóm tắt cuối cùng, mạch lạc. Dưới đây là một tập hợp các bản tóm tắt từ các phần khác nhau của một tài liệu lớn. Vui lòng hợp nhất chúng thành một bản tóm tắt duy nhất, có cấu trúc tốt, tuân theo các nguyên tắc sau:\n\n${systemPrompt}`;
    
    // 4. Stream the final result
    const finalStream = streamChatResponse({
        model,
        history: [],
        newMessage: combinedSummaries,
        systemPrompt: finalSystemPrompt,
        useWebSearch,
        responseMimeType,
        responseSchema,
        signal,
    });
    
    yield { progress: '[CLEAR]' };

    for await (const chunk of finalStream) {
        yield chunk;
    }
}

async function* streamChatResponseGemini({ model, history, newMessage, systemPrompt, useWebSearch, responseMimeType, responseSchema, signal }: {
    model: string;
    history: Message[];
    newMessage: string;
    systemPrompt: string;
    useWebSearch: boolean;
    responseMimeType?: string;
    responseSchema?: unknown;
    signal: AbortSignal;
}): AsyncGenerator<StreamChunk> {
    const contents: Content[] = [...history, { role: 'user', content: newMessage }].map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }],
    }));
    
    const config: any = {
        safetySettings: GEMINI_SAFETY_SETTINGS
    };
    if (systemPrompt) config.systemInstruction = systemPrompt;
    if (useWebSearch) config.tools = [{googleSearch: {}}];
    if (responseMimeType) config.responseMimeType = responseMimeType;
    if (responseSchema) config.responseSchema = responseSchema;
    
    try {
        const response = await callGeminiApi({ model, contents, config, stream: true }, signal);

        if (!response.body) {
          throw new Error("Response body is null");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let hasReceivedText = false;
        let lastChunk: GenerateContentResponse | null = null;

        while (true) {
            const { done, value } = await reader.read();
            if (done || signal.aborted) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const chunk: GenerateContentResponse = JSON.parse(line);
                        lastChunk = chunk;
                        const text = chunk.text;
                        if (text) {
                            hasReceivedText = true;
                            yield {
                                text,
                                groundingChunks: chunk.candidates?.[0]?.groundingMetadata?.groundingChunks,
                            };
                        }
                    } catch (e) {
                         console.error('Lỗi phân tích cú pháp luồng Gemini:', e, 'Dòng:', line);
                    }
                }
            }
        }
        
        if (!hasReceivedText && !signal.aborted) {
            const finishReason = lastChunk?.candidates?.[0]?.finishReason;
            if (finishReason === 'SAFETY') {
                throw new Error("Phản hồi đã bị chặn do cài đặt an toàn. Nội dung tài liệu có thể chứa các thuật ngữ bị coi là nhạy cảm.");
            }
        }

    } catch (err) {
        if (!signal.aborted) {
            console.error("Lỗi gọi API Gemini:", err);
            throw new Error(err instanceof Error ? err.message : 'Không thể gọi API Gemini. Vui lòng thử lại.');
        }
    }
}


// --- Main Exported Functions (Routers) ---
export async function* streamChatResponse({ model, history, newMessage, systemPrompt, useWebSearch, responseMimeType, responseSchema, signal }: {
    model: string;
    history: Message[];
    newMessage: string;
    systemPrompt: string;
    useWebSearch: boolean;
    responseMimeType?: string;
    responseSchema?: unknown;
    signal: AbortSignal;
}): AsyncGenerator<StreamChunk> {
    if (isPerplexityModel(model)) {
        if (isAiStudio()) {
            throw new Error("Các mô hình Perplexity không được hỗ trợ trong AI Studio.");
        }
        const stream = streamChatResponsePerplexity({ model, history, newMessage, systemPrompt, signal });
        for await (const chunk of stream) {
            yield chunk;
        }
    } else { // Gemini Models
        const contents: Content[] = [...history, { role: 'user', content: newMessage }].map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }],
        }));
        
        const config: any = {
            safetySettings: GEMINI_SAFETY_SETTINGS
        };
        if (systemPrompt) config.systemInstruction = systemPrompt;
        if (useWebSearch) config.tools = [{googleSearch: {}}];
        if (responseMimeType) config.responseMimeType = responseMimeType;
        if (responseSchema) config.responseSchema = responseSchema;

        if (isAiStudio()) {
            // Logic cho AI Studio: Gọi trực tiếp SDK
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const responseStream = await ai.models.generateContentStream({ model, contents, config });

                for await (const chunk of responseStream) {
                    if (signal.aborted) break;
                    yield {
                        text: chunk.text,
                        groundingChunks: chunk.candidates?.[0]?.groundingMetadata?.groundingChunks,
                    };
                }
            } catch (err) {
                if (!signal.aborted) {
                    console.error("Lỗi gọi API Gemini SDK:", err);
                    throw err;
                }
            }
        } else {
            // Logic cho Vercel: Gọi proxy (bao gồm cả chunking)
            const GEMINI_TOKEN_LIMIT = 1000000;
            const GEMINI_CHAR_LIMIT = Math.floor(GEMINI_TOKEN_LIMIT * 0.8 * 2.5);

            if (history.length === 0 && newMessage.length > GEMINI_CHAR_LIMIT) {
                yield* streamChunkedSummarizationGemini({
                    model,
                    content: newMessage,
                    systemPrompt,
                    useWebSearch,
                    responseMimeType,
                    responseSchema,
                    signal,
                });
            } else {
                yield* streamChatResponseGemini({ model, history, newMessage, systemPrompt, useWebSearch, responseMimeType, responseSchema, signal });
            }
        }
    }
}

export const generateContent = async (prompt: string, model: string): Promise<string> => {
    if (isPerplexityModel(model)) {
        if (isAiStudio()) {
            throw new Error("Các mô hình Perplexity không được hỗ trợ trong AI Studio.");
        }
         const body = {
            model,
            messages: [{ role: 'user', content: prompt }],
            stream: false,
        };

        const response = await fetch(PPLX_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            try {
                const errorData = await response.json();
                const message = errorData?.error?.message || `Lỗi không xác định từ API Perplexity (${response.status}).`;
                throw new Error(message);
            } catch (e) {
                throw new Error(`Lỗi API Perplexity: ${response.status} - Máy chủ trả về phản hồi không hợp lệ.`);
            }
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (!text) {
            throw new Error("Perplexity không trả về bất kỳ văn bản nào.");
        }
        return text;
    } else { // Gemini Model
        const contents: Content[] = [{ role: 'user', parts: [{ text: prompt }] }];
        const config = { safetySettings: GEMINI_SAFETY_SETTINGS };

        if (isAiStudio()) {
            // Logic cho AI Studio: Gọi trực tiếp SDK
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const response = await ai.models.generateContent({ model, contents, config });
                if (!response.text) {
                    console.error("Gemini SDK response was blocked or empty:", JSON.stringify(response, null, 2));
                    const finishReason = response.candidates?.[0]?.finishReason;
                    if (finishReason === 'SAFETY') {
                        throw new Error("Phản hồi đã bị chặn do cài đặt an toàn. Nội dung tài liệu có thể chứa các thuật ngữ bị coi là nhạy cảm.");
                    }
                    throw new Error("AI không trả về bất kỳ văn bản nào. Phản hồi có thể trống hoặc đã bị chặn.");
                }
                return response.text;
            } catch (err) {
                 console.error("Lỗi gọi API Gemini SDK:", err);
                 throw err;
            }
        } else {
            // Logic cho Vercel: Gọi proxy
            const response = await callGeminiApi({ model, contents, config, stream: false });
            const data: GenerateContentResponse = await response.json();

            if (!data.text) {
                console.error("Gemini API response was blocked or empty:", JSON.stringify(data, null, 2));
                const finishReason = data.candidates?.[0]?.finishReason;
                if (finishReason === 'SAFETY') {
                     throw new Error("Phản hồi đã bị chặn do cài đặt an toàn. Nội dung tài liệu có thể chứa các thuật ngữ bị coi là nhạy cảm.");
                }
                throw new Error("AI không trả về bất kỳ văn bản nào. Phản hồi có thể trống hoặc đã bị chặn.");
            }
            return data.text;
        }
    }
};

export async function* streamTranscript(youtubeUrl: string, model: string, signal: AbortSignal): AsyncGenerator<string> {
    const prompt = `Vui lòng trích xuất bản ghi đầy đủ từ video YouTube tại URL sau, bao gồm cả dấu thời gian (timestamps) ở định dạng [HH:MM:SS] hoặc [MM:SS] cho mỗi đoạn. Chỉ trả về bản ghi, không có bất kỳ văn bản nào khác ngoài bản ghi.

URL: ${youtubeUrl}`;
    
    const targetModel = model.startsWith('gemini') ? model : 'gemini-2.5-flash';

    try {
        const stream = streamChatResponse({
            model: targetModel,
            history: [],
            newMessage: prompt,
            systemPrompt: '',
            useWebSearch: false,
            signal: signal
        });

        for await (const chunk of stream) {
            if (chunk.text) {
                yield chunk.text;
            }
        }
    } catch (err) {
        if (!signal.aborted) {
           throw err;
        }
    }
}

export const translateTexts = async (textsToTranslate: string[]): Promise<{ [original: string]: string }> => {
  if (!textsToTranslate || textsToTranslate.length === 0) {
    return {};
  }

  const prompt = `Dịch danh sách các tiêu đề tài liệu sau sang tiếng Việt.
Cung cấp phản hồi dưới dạng một mảng JSON duy nhất của các đối tượng. Mỗi đối tượng phải có hai khóa: "original" và "translation".
Không bao gồm bất kỳ văn bản hoặc định dạng markdown nào khác trong phản hồi của bạn.

Ví dụ đầu vào: ["1. Introduction", "2. Methodology"]
Ví dụ đầu ra: [{"original": "1. Introduction", "translation": "1. Giới thiệu"}, {"original": "2. Methodology", "translation": "2. Phương pháp luận"}]

Các tiêu đề cần dịch:
${JSON.stringify(textsToTranslate)}
`;
  const model = 'gemini-2.5-flash';
  const contents: Content[] = [{ role: 'user', parts: [{ text: prompt }] }];
  const config = {
      safetySettings: GEMINI_SAFETY_SETTINGS,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            original: { type: Type.STRING },
            translation: { type: Type.STRING },
          },
          required: ["original", "translation"],
        },
      },
  };

  let rawText = '';

  if (isAiStudio()) {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({ model, contents, config });
      rawText = response.text;
  } else {
      const response = await callGeminiApi({ model, contents, config, stream: false });
      const data: GenerateContentResponse = await response.json();
      rawText = data.text;
  }

  if (!rawText) {
    throw new Error("AI không trả về bất kỳ văn bản nào để dịch. Phản hồi có thể đã bị chặn.");
  }

  try {
    const translations: { original: string; translation: string }[] = JSON.parse(rawText);
    const translationMap: { [original: string]: string } = {};
    textsToTranslate.forEach(originalText => {
        const found = translations.find(t => t.original === originalText);
        translationMap[originalText] = found ? found.translation : originalText;
    });

    return translationMap;
  } catch (e) {
    console.error("Không thể phân tích JSON dịch từ Gemini:", rawText, e);
    throw new Error("Không thể phân tích văn bản đã dịch từ AI.");
  }
};

export const generateTitle = async (content: string): Promise<string> => {
  const prompt = `Dựa vào nội dung tóm tắt sau, hãy tạo một tiêu đề ngắn gọn, mô tả (tối đa 10 từ). Chỉ trả về văn bản tiêu đề, không có tiền tố hay định dạng gì khác.

Tóm tắt:
"""
${content}
"""`;
  const responseText = await generateContent(prompt, 'gemini-2.5-flash');
  return responseText.replace(/"/g, '').trim();
};

export const generateFollowUpQuestions = async (content: string): Promise<string[]> => {
  const prompt = `Dựa vào nội dung tóm tắt sau, hãy tạo ra 3 câu hỏi tiếp theo ngắn gọn để giúp người dùng khám phá chủ đề sâu hơn. Trả về dưới dạng một mảng JSON chứa các chuỗi. Chỉ trả về mảng JSON, không có bất kỳ văn bản nào khác.

Ví dụ đầu ra:
["Câu hỏi gợi ý 1 là gì?", "Làm thế nào để so sánh X và Y?", "Giải thích thêm về Z."]

Tóm tắt:
"""
${content}
"""`;
  const model = 'gemini-2.5-flash';
  const contents: Content[] = [{ role: 'user', parts: [{ text: prompt }] }];
  const config = {
      safetySettings: GEMINI_SAFETY_SETTINGS,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
  };
  
  let rawText = '';
  if (isAiStudio()) {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({ model, contents, config });
      rawText = response.text;
  } else {
      const response = await callGeminiApi({ model, contents, config, stream: false });
      const data: GenerateContentResponse = await response.json();
      rawText = data.text;
  }

  if (!rawText) return [];
  try {
    const questions: string[] = JSON.parse(rawText);
    return questions.slice(0, 3);
  } catch (e) {
    console.error("Could not parse follow-up questions from Gemini:", rawText, e);
    return [];
  }
};

export const generateFlashcards = async (content: string): Promise<Flashcard[]> => {
  const prompt = `Dựa trên nội dung sau, hãy tạo một bộ thẻ ghi nhớ (flashcards) để giúp học tập. Mỗi thẻ nên có một câu hỏi ngắn gọn và một câu trả lời súc tích. Trả về dưới dạng một mảng JSON của các đối tượng, mỗi đối tượng có khóa "question" và "answer". Đảm bảo câu trả lời trực tiếp và đi thẳng vào vấn đề.

Nội dung:
"""
${content}
"""`;
  const model = 'gemini-2.5-flash';
  const contents: Content[] = [{ role: 'user', parts: [{ text: prompt }] }];
  const config = {
      safetySettings: GEMINI_SAFETY_SETTINGS,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            answer: { type: Type.STRING },
          },
          required: ["question", "answer"],
        },
      },
  };

  let rawText = '';
  if (isAiStudio()) {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({ model, contents, config });
      rawText = response.text;
  } else {
      const response = await callGeminiApi({ model, contents, config, stream: false });
      const data: GenerateContentResponse = await response.json();
      rawText = data.text;
  }

  if (!rawText) return [];
  try {
    return JSON.parse(rawText);
  } catch (e) {
    console.error("Could not parse flashcards from Gemini:", rawText, e);
    return [];
  }
};

export const generateQuiz = async (content: string): Promise<QuizQuestion[]> => {
  const prompt = `Dựa trên nội dung sau, hãy tạo một bài kiểm tra trắc nghiệm. Mỗi câu hỏi phải có 4 lựa chọn và một câu trả lời đúng. Trả về dưới dạng một mảng JSON của các đối tượng. Mỗi đối tượng phải có khóa "question", "options" (một mảng 4 chuỗi) và "correctAnswer" (một chuỗi khớp với một trong các lựa chọn).

Nội dung:
"""
${content}
"""`;
  const model = 'gemini-2.5-flash';
  const contents: Content[] = [{ role: 'user', parts: [{ text: prompt }] }];
  const config = {
      safetySettings: GEMINI_SAFETY_SETTINGS,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            correctAnswer: { type: Type.STRING },
          },
          required: ["question", "options", "correctAnswer"],
        },
      },
  };
  
  let rawText = '';
  if (isAiStudio()) {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({ model, contents, config });
      rawText = response.text;
  } else {
      const response = await callGeminiApi({ model, contents, config, stream: false });
      const data: GenerateContentResponse = await response.json();
      rawText = data.text;
  }

  if (!rawText) return [];
  try {
    return JSON.parse(rawText);
  } catch (e) {
    console.error("Could not parse quiz from Gemini:", rawText, e);
    return [];
  }
};
