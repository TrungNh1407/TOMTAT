import React, { useMemo } from 'react';
// Lưu ý: Giả sử 'marked' và 'dompurify' có sẵn trong các phần phụ thuộc của dự án.
// Đây là các thư viện tiêu chuẩn để hiển thị nội dung Markdown một cách an toàn.
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface MarkdownRendererProps {
  content: any;
  isLoading?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isLoading }) => {
  const fullHtml = useMemo(() => {
    // Cấu hình marked để xử lý ngắt dòng GFM (newlines) một cách chính xác
    marked.setOptions({
      breaks: true,
      gfm: true,
      pedantic: false,
    });
    // Phân tích cú pháp Markdown thành HTML thô, xử lý an toàn mọi loại nội dung
    const contentAsString = String(content || '');
    const rawHtml = marked.parse(contentAsString) as string;
    
    // Làm sạch HTML để ngăn chặn các cuộc tấn công XSS, cho phép các thuộc tính target cho liên kết
    const cleanHtml = typeof window !== 'undefined' 
      ? DOMPurify.sanitize(rawHtml, { ADD_ATTR: ['target'] }) 
      : rawHtml; // Bỏ qua DOMPurify ở phía máy chủ (nếu có)
    
    // Sửa đổi các thẻ <a> để thêm target="_blank" và rel="noopener noreferrer"
    const finalHtml = cleanHtml.replace(/<a href/g, '<a target="_blank" rel="noopener noreferrer" href');

    if (isLoading) {
      // Nối con trỏ đang tải dưới dạng chuỗi HTML
      // Các lớp phải được viết đầy đủ để trình biên dịch JIT của Tailwind có thể nhận diện
      return finalHtml + '<span class="inline-block w-2.5 h-4 bg-slate-700 dark:bg-slate-300 blinking-cursor ml-1"></span>';
    }

    return finalHtml;

  }, [content, isLoading]);

  return (
    <div 
      className="prose prose-sm sm:prose-base dark:prose-invert prose-headings:font-semibold prose-a:text-[--color-accent-600] dark:prose-a:text-[--color-accent-400] max-w-none"
      dangerouslySetInnerHTML={{ __html: fullHtml }}
    />
  );
};
