export const LONG_SUMMARIZATION_PROMPT = `
# 🎯 PROMPT: TÓM TẮT TÀI LIỆU Y KHOA CHI TIẾT – ĐẦY ĐỦ THÔNG TIN

## 🚀 Mục Tiêu Chính

- Biến tài liệu gốc (dài, phức tạp) thành bản tóm tắt **có cấu trúc logic, dễ nắm bắt nhưng vẫn đầy đủ chi tiết nhất, không bỏ sót thông tin**.
- Cô đọng thông tin chuyên sâu → trình bày **mạch lạc, có hệ thống, không lược bỏ những ý quan trọng**.
- Tối ưu hóa việc ghi nhớ bằng sơ đồ phân cấp, bullet journal, bảng, sơ đồ tư duy.
- Đảm bảo bản tóm tắt đầy đủ thông tin để **người đọc có thể học tập, nghiên cứu và áp dụng vào thực tế mà không cần quay lại tài liệu gốc**.
- **Luôn tạo nội dung tóm tắt bằng tiếng Việt.**

* * *

## 🧱 Nguyên Tắc Trình Bày (Áp dụng cho đầu ra Markdown)

- 📊 **Bullet Journal phân cấp chi tiết** (H1 → H2 → bullet, có thể có H3 nếu cần).
    
- 🗂️ **KHÔNG TỰ TẠO MỤC LỤC.** Hệ thống sẽ tự động tạo mục lục từ các tiêu đề (headings) của bạn.
    
- 🎯 **Emoji minh họa** có mục đích (tổng quan, cảnh báo, mẹo, dữ liệu).
    
- 🔍 **Định dạng rõ ràng & nhất quán**:
    
    - **Đậm** cho khái niệm, thuật ngữ chính.
    - *Nghiêng* cho giải thích, định nghĩa.
    - ~~Gạch ngang~~ cho thông tin lỗi thời.
    - ***Đậm và nghiêng*** cho công thức, quy trình, số liệu then chốt.
- 📊 Sử dụng **bảng so sánh, sơ đồ, flowchart** khi phù hợp để tăng tính trực quan.
    
- 🔗 Bổ sung **tài liệu tham khảo** hoặc liên kết mở rộng ở cuối.
    

* * *

## 📚 CẤU TRÚC TÀI LIỆU TÓM TẮT (Áp dụng cho đầu ra Markdown)

### 1\. 📖 Giới thiệu

- Nguồn gốc & tác giả & link ( ngắn gọn)
- Mục tiêu chính
- Ý nghĩa lâm sàng / học tập

### 2\. 🧩 Nội dung chính (Áp dụng hệ thống đánh số phân cấp. Sử dụng định dạng Markdown chuẩn cho các tiêu đề và danh sách.)

📌 Tiêu đề lớn → Chủ đề chính

⚡ Ý chính → Mô tả ngắn

🔎 Thông tin chi tiết → Bảng, bullet, giải thích đầy đủ

ℹ️ **Lưu ý**: điểm quan trọng cần ghi nhớ

⚠️ **Cảnh báo**: rủi ro, chống chỉ định, biến chứng

💡 **Mẹo học tập**: mẹo ghi nhớ, mnemonics

📊 **Ví dụ minh họa / Case study** (nếu có)

🎯 **Kết luận đoạn**: tổng hợp ngắn gọn ý chính

### 3\. 📊 Bảng & Sơ đồ (tùy nội dung)

- Bảng tóm tắt số liệu
- Sơ đồ chẩn đoán, xử trí

### 4\. 💡 Tổng kết cuối

- Tóm tắt toàn bộ tài liệu trong **5–7 bullet ngắn gọn**
- Nhấn mạnh ứng dụng thực hành

### 5\. 🔄 Yếu tố tương tác

- ❓ **Câu hỏi ôn tập** + đáp án gợi ý
- 📖 **Bài tập áp dụng / Case lâm sàng + đáp án**
- 🔗 **Tài liệu tham khảo / liên kết đọc thêm**

* * *

## 🛠️ QUY TRÌNH THỰC HIỆN

1.  Đọc & phân tích kỹ nội dung tài liệu gốc.
2.  Xác định các chủ đề chính – phụ.
3.  Tuân theo cấu trúc Markdown đã nêu.
4.  Triển khai viết, **giữ nguyên độ dài & độ chi tiết cần thiết**.
5.  Bổ sung bảng, sơ đồ, ví dụ minh họa khi cần thiết.
6.  Thêm phần tương tác (câu hỏi, case, bài tập) để tăng tính ứng dụng.
7.  Đảm bảo bản tóm tắt đủ để học tập **độc lập** mà không cần đọc lại tài liệu gốc.

* * *

## ⚠️ LƯU Ý KỸ THUẬT

- Nội dung dựa **100% vào tài liệu gốc**, không thêm ý kiến cá nhân.
- Không lược bỏ ý quan trọng → ưu tiên đầy đủ thông tin.
- Tóm tắt phải **chi tiết, có chiều sâu**, tránh quá ngắn gọn.
`;

export const MEDIUM_SUMMARIZATION_PROMPT = `
🎯 PROMPT: TÓM TẮT TÀI LIỆU THÀNH NỘI DUNG HỌC TẬP HIỆU QUẢ
🚀 Mục Tiêu Chính

Biến tài liệu dài thành bản tóm tắt có cấu trúc rõ ràng, dễ nắm bắt

Cô đọng thông tin phức tạp → trình bày chi tiết, gọn gàng, dễ hiểu, sinh động, không bỏ sót nội dung

Tối ưu ghi nhớ bằng sơ đồ phân cấp, bullet journal

Giúp người đọc áp dụng kiến thức ngay vào thực tế

**Luôn tạo nội dung tóm tắt bằng tiếng Việt.**

🧱 Nguyên Tắc Trình Bày

📊 Bullet Journal phân cấp (H1 → H2 → bullet ngắn)

🗂️ **KHÔNG TỰ TẠO MỤC LỤC.** Hệ thống sẽ tự động tạo mục lục từ các tiêu đề.

🎯 Emoji minh họa có mục đích, không lạm dụng

🔍 Định dạng rõ ràng:

Đậm cho khái niệm chính

Nghiêng để giải thích, định nghĩa

Gạch ngang thông tin lỗi thời

***Đậm và nghiêng*** cho công thức, quy trình, từ khóa

📚 CẤU TRÚC TÀI LIỆU TÓM TẮT
1. 📄 Giới thiệu tài liệu

Nguồn gốc & tác giả

Mục tiêu chính

2. 🧩 Nội dung chính
📌 Tiêu đề lớn (H1)

⚡ Ý chính (H2) → chỉ 1 dòng ngắn

Thông tin bổ sung → bullet ngắn

ℹ️ Lưu ý: thông tin quan trọng cần nhớ

⚠️ Cảnh báo: rủi ro hoặc biến chứng

💡 Mẹo: mẹo học tập, gợi ý nhớ nhanh

🎯 Kết luận: điểm chính của đoạn
3. 💡 Tổng kết

Tóm gọn trong 2–3 dòng

Nhấn mạnh bằng icon 💡

4. 🔄 Yếu tố tương tác

Câu hỏi ôn tập + đáp án

Liên kết mở rộng (tài liệu tham khảo)

Bài tập áp dụng + lời giải

🛠️ QUY TRÌNH THỰC HIỆN

Đọc & phân tích nội dung tài liệu

Xác định các chủ đề chính – phụ

Sắp xếp lại theo cấu trúc trên

Bổ sung điểm then chốt & yếu tố tương tác

Đảm bảo tính đầy đủ, không bỏ sót ý quan trọng

⚠️ LƯU Ý KỸ THUẬT

Nội dung dựa 100% vào tài liệu gốc, không thêm ý kiến cá nhân

Ưu tiên thông tin trọng yếu, có tính ứng dụng

Bản tóm tắt phải đủ để người đọc học tập độc lập
`;

export const SHORT_SUMMARIZATION_PROMPT = `
🎯 **Mục tiêu:** Tóm tắt siêu ngắn gọn, chỉ giữ lại những thông tin cốt lõi nhất. Luôn trả lời bằng tiếng Việt.

📚 **Cấu trúc:**
1. 📖 **Giới thiệu:** 1 câu duy nhất về nguồn gốc và mục tiêu.
2. 🧩 **Nội dung chính:**
    - Sử dụng các tiêu đề (H1, H2) để phân cấp.
    - Mỗi ý chính chỉ dùng 1 bullet (dấu gạch đầu dòng).
    - ***Đậm và nghiêng*** cho từ khóa quan trọng nhất.
    - ⚠️ **Cảnh báo:** Dùng emoji và in đậm cho các điểm cần lưu ý đặc biệt.
3. 💡 **Tổng kết:** 2-3 bullet tóm tắt những điểm phải nhớ.

📝 **Yêu cầu:**
- **KHÔNG** tạo mục lục.
- **KHÔNG** giải thích dài dòng.
- **Tập trung** vào kết quả, con số, liều lượng, quy trình chính.
`;
