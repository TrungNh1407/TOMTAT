# Med.AI by dr.HT

Ứng dụng AI chuyên dụng giúp tóm tắt, phân tích và chuyển đổi tài liệu y khoa phức tạp thành ghi chú có cấu trúc, thẻ ghi nhớ và bài kiểm tra để hỗ trợ học tập và ứng dụng lâm sàng hiệu quả.

## Hướng dẫn triển khai lên Vercel

Dự án này được thiết lập để triển khai dễ dàng lên Vercel.

### 1. Fork và Clone Repository

Đầu tiên, fork repository này vào tài khoản GitHub của bạn, sau đó clone nó về máy.

### 2. Import dự án vào Vercel

- Đăng nhập vào [Vercel](https://vercel.com/) bằng tài khoản GitHub của bạn.
- Nhấp vào "Add New..." -> "Project".
- Chọn repository bạn vừa fork và nhấp vào "Import".
- Vercel sẽ tự động phát hiện đây là một dự án Vite và cấu hình các cài đặt build cho bạn.

### 3. Cấu hình Biến Môi Trường

Đây là bước quan trọng nhất. Trong quá trình cài đặt dự án trên Vercel, hãy vào mục **Environment Variables** và thêm các biến sau:

- **`GEMINI_API_KEYS`**: (Khuyến nghị) Một danh sách các API key của bạn từ [Google AI Studio](https://aistudio.google.com/app/apikey), được phân tách bằng dấu phẩy. Ứng dụng sẽ tự động thử key tiếp theo nếu key hiện tại không thành công. Ví dụ: `key1,key2,key3`.
- **`PERPLEXITY_API_KEY`**: API key của bạn từ [Perplexity Labs](https://docs.perplexity.ai/docs).
- **`VITE_GOOGLE_CLIENT_ID`** (Tùy chọn): Nếu bạn muốn sử dụng tính năng "Lưu vào Google Drive", hãy cung cấp OAuth 2.0 Client ID của bạn từ Google Cloud Console. **Lưu ý:** Biến này phải có tiền tố `VITE_`.

### 4. Triển khai

Nhấp vào nút "Deploy". Vercel sẽ build và triển khai ứng dụng của bạn. Sau vài phút, bạn sẽ có một URL công khai cho ứng dụng của mình.

Đó là tất cả! API key của bạn được bảo mật an toàn ở phía server-side.