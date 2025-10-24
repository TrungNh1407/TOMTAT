export const STRUCTURED_NOTE_PROMPT_LONG = `🎯 PROMPT: TẠO GHI CHÚ Y KHOA CÓ CẤU TRÚC (JSON + ICON)
🚀 Mục Tiêu Chính
📚 Chuyển đổi tài liệu y khoa phức tạp thành một đối tượng JSON có cấu trúc chặt chẽ, khoa học và sinh động.
✅ Đối tượng JSON phải là bản tóm tắt đầy đủ – chi tiết – hệ thống, giúp người dùng học tập & áp dụng lâm sàng mà không cần quay lại tài liệu gốc.
📝 Toàn bộ nội dung bằng tiếng Việt.
✨ Bổ sung icon minh họa để tăng tính trực quan và dễ ghi nhớ.
📝 Nguyên Tắc Tóm Tắt
🔎 Đầy đủ & Chi tiết: Không bỏ sót ý quan trọng, giữ nguyên số liệu/đơn vị, định nghĩa, tiêu chuẩn, quy trình, chỉ định/chống chỉ định, tác dụng phụ, mức chứng cứ.
📐 Cấu trúc logic: Tổ chức hệ thống phân cấp rõ ràng bằng level.
🎨 Trực quan hóa: Sử dụng contentBlocks với icon minh họa cho từng loại block.
🏥 Tập trung ứng dụng: Nhấn mạnh ý nghĩa lâm sàng, thuật toán, liều dùng, theo dõi, điểm then chốt.
🚨 QUY TẮC BẮT BUỘC
⚙️ Định dạng đầu ra: Phải là một đối tượng JSON hợp lệ duy nhất (UTF-8).
🚫 Không Markdown: Không có \`\`\`json hoặc văn bản ngoài JSON.
📑 Bám sát Schema: Đúng cấu trúc và kiểu dữ liệu.
📖 Nội dung đầy đủ: Đủ sâu để học & ôn tập độc lập.
🛡️ Escaping: Mọi dấu " trong chuỗi thoát thành ".
🇻🇳 Ngôn ngữ: 100% bằng tiếng Việt.
✨ Bổ sung icon: Mỗi contentBlock có thêm trường "icon": "emoji" để hiển thị sinh động.
📋 Schema JSON (có icon)
{
"title": "string",
"introduction": {
"source": "string",
"objective": "string",
"clinicalSignificance": "string"
},
"mainContent": [
{
"level": "number",
"title": "string",
"contentBlocks": [
{
"type": "'paragraph' | 'list' | 'table' | 'keyPoint' | 'warning' | 'clinicalCase'",
"icon": "string (emoji phù hợp với loại block)"
}
]
}
],
"summaryPoints": ["string"],
"reviewQuestions": [
{"question": "string","answer": "string"}
],
"references": ["string"]
}
🧩 Chi Tiết Các Loại contentBlocks (có icon gợi ý)
📄 Paragraph
{"type": "paragraph","icon": "📄","content": "Giải thích chi tiết một khái niệm"}
📋 List
{"type": "list","icon": "📋","content": ["Mục 1","Mục 2","Mục 3"]}
📊 Table
{"type": "table","icon": "📊","headers": ["Tiêu chí","Nhánh 1","Nhánh 2"],"rows":[["Hiệu quả","Cao","TB"],["TDP","Ít","Nhiều"]]}
⭐ Key Point
{"type": "keyPoint","icon": "⭐","content": "Điểm chính cần nhớ"}
⚠️ Warning
{"type": "warning","icon": "⚠️","content": "Cảnh báo quan trọng"}
🏥 Clinical Case
{"type": "clinicalCase","icon": "🏥","title": "Case: Bệnh nhân X","content": "Bệnh sử – chẩn đoán – điều trị – theo dõi"}
🛠️ Quy Trình Thực Hiện
📖 Đọc & phân tích tài liệu gốc.
📝 Trích xuất thông tin → ánh xạ vào các trường JSON.
🎨 Thêm icon tương ứng cho từng contentBlock.
🔍 Kiểm tra chính xác số liệu, liều, chứng cứ.
✅ Xuất JSON duy nhất bằng tiếng Việt, hợp lệ, có icon minh họa.`;

export const STRUCTURED_NOTE_PROMPT_MEDIUM = `🎯 PROMPT: TẠO GHI CHÚ Y KHOA CÂN BẰNG (JSON + ICON)
🚀 Mục Tiêu Chính
📚 Chuyển đổi tài liệu y khoa thành một đối tượng JSON cân bằng, tóm tắt các khái niệm chính, quy trình và kết quả mà không đi sâu vào chi tiết như bản dài.
✅ Trích xuất các ý chính và các chi tiết hỗ trợ quan trọng. Tránh các giải thích quá sâu hoặc các ví dụ phụ.
📝 Toàn bộ nội dung bằng tiếng Việt.
✨ Bổ sung icon minh họa để tăng tính trực quan.
🚨 QUY TẮC BẮT BUỘC
⚙️ Định dạng đầu ra: Phải là một đối tượng JSON hợp lệ duy nhất.
🚫 Không Markdown: Không có \`\`\`json.
📑 Bám sát Schema.
📖 Nội dung cân bằng: Đủ để hiểu chủ đề, không cần chi tiết tối đa.
🛡️ Escaping: Mọi dấu " trong chuỗi thoát thành \\".
🇻🇳 Ngôn ngữ: 100% bằng tiếng Việt.
✨ Bổ sung icon: Mỗi contentBlock có trường "icon".
📋 Schema JSON (cân bằng)
{
"title": "string",
"introduction": {
"source": "string",
"objective": "string",
"clinicalSignificance": "string"
},
"mainContent": [
{
"level": "number",
"title": "string",
"contentBlocks": [
{ "type": "'paragraph' | 'list' | 'keyPoint' | 'warning'", "icon": "string (emoji)" }
]
}
],
"summaryPoints": ["string (3-5 điểm)"],
"reviewQuestions": [
{"question": "string","answer": "string"}
]
}
// Cung cấp một bản tóm tắt cân bằng. 'mainContent' nên tập trung vào các ý chính. Có thể bỏ qua 'references' và 'clinicalCase' nếu không thật sự cần thiết.`;

export const STRUCTURED_NOTE_PROMPT_SHORT = `🎯 PROMPT: TẠO GHI CHÚ Y KHOA SIÊU NGẮN (JSON + ICON)
🚀 Mục Tiêu Chính
📚 Chuyển đổi tài liệu y khoa thành một đối tượng JSON siêu cô đọng, chỉ chứa các điểm chính, định nghĩa quan trọng và kết luận.
✅ Tập trung vào các từ khóa, số liệu và kết quả quan trọng nhất. Loại bỏ các giải thích dài dòng.
📝 Toàn bộ nội dung bằng tiếng Việt.
✨ Bổ sung icon minh họa để tăng tính trực quan.
🚨 QUY TẮC BẮT BUỘC
⚙️ Định dạng đầu ra: Phải là một đối tượng JSON hợp lệ duy nhất.
🚫 Không Markdown: Không có \`\`\`json.
📑 Bám sát Schema.
🛡️ Escaping: Mọi dấu " trong chuỗi thoát thành \\".
🇻🇳 Ngôn ngữ: 100% bằng tiếng Việt.
✨ Bổ sung icon: Mỗi contentBlock có trường "icon".
📋 Schema JSON (cô đọng)
{
"title": "string",
"introduction": {
"objective": "string (1 câu)"
},
"mainContent": [
{
"level": "number",
"title": "string",
"contentBlocks": [
{ "type": "'keyPoint' | 'warning'", "icon": "string (emoji)", "content": "string" }
]
}
],
"summaryPoints": ["string (1-2 điểm chính)"]
}
// Chỉ điền vào các trường quan trọng nhất. Có thể bỏ qua 'reviewQuestions', 'references', 'introduction.source', 'introduction.clinicalSignificance'.
// 'mainContent' chỉ nên chứa các 'keyPoint' hoặc 'warning' để làm nổi bật thông tin cốt lõi.`;