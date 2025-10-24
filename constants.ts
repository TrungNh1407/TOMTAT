import { STRUCTURED_NOTE_PROMPT_LONG, STRUCTURED_NOTE_PROMPT_MEDIUM, STRUCTURED_NOTE_PROMPT_SHORT } from './structuredNotePrompt';
import { LONG_SUMMARIZATION_PROMPT, MEDIUM_SUMMARIZATION_PROMPT, SHORT_SUMMARIZATION_PROMPT } from './markdownPrompts';
import type { SummaryLength, OutputFormat } from './types';

export const TOC_EXTRACTION_PROMPT = `
Phân tích tài liệu được cung cấp và chỉ trích xuất cấu trúc phân cấp của nó.
Tạo một mục lục (Table of Contents) ở định dạng Markdown.
Chỉ bao gồm các tiêu đề (headings).
KHÔNG tóm tắt. KHÔNG thêm bất kỳ văn bản giới thiệu hoặc kết luận nào.
Chỉ trả về danh sách các tiêu đề dạng markdown. Ví dụ:

# Tiêu đề chính 1
## Tiêu đề phụ 1.1
### Tiêu đề phụ 1.1.1
## Tiêu đề phụ 1.2
# Tiêu đề chính 2
## Tiêu đề phụ 2.1
`;

export const CHAT_SYSTEM_PROMPT = "You are a helpful and friendly AI assistant.";

export type PromptConfigCollection = Record<OutputFormat, Record<SummaryLength, string>>;

export const promptConfigs: PromptConfigCollection = {
  structured: {
    short: STRUCTURED_NOTE_PROMPT_SHORT,
    medium: STRUCTURED_NOTE_PROMPT_MEDIUM,
    long: STRUCTURED_NOTE_PROMPT_LONG,
  },
  markdown: {
    short: SHORT_SUMMARIZATION_PROMPT,
    medium: MEDIUM_SUMMARIZATION_PROMPT,
    long: LONG_SUMMARIZATION_PROMPT,
  }
};

export const LOADING_TIPS = [
  'Bạn có biết? Bạn có thể thay đổi độ dài tóm tắt (ngắn, trung bình, dài) trước khi tạo.',
  'Mẹo: Sau khi có bản tóm tắt, hãy đặt các câu hỏi tiếp theo để đào sâu vào các chủ đề cụ thể.',
  'Tùy chỉnh: Nhấp vào "Chỉnh sửa Prompt" để tinh chỉnh cách AI tạo ra các bản tóm tắt cho bạn.',
  'Thử nghiệm: Tải lên các loại tệp khác nhau như .txt, .md, hoặc thậm chí là .pdf để xem AI xử lý chúng.',
  'Nhanh hơn: Model "Gemini 2.5 Flash" thường cho kết quả nhanh hơn, phù hợp cho các bản tóm tắt nhanh.',
  'Hiển thị: Nhấp vào biểu tượng bánh răng ở góc trên cùng bên phải để thay đổi cỡ chữ và màu nhấn của ứng dụng.'
];
