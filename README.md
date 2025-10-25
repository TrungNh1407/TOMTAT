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

#### Biến Môi trường Backend (Server-side)
Các biến này được sử dụng bởi các serverless functions (trong thư mục `api/`) và được giữ bí mật.

- **`GEMINI_API_KEYS`**: (Khuyến nghị) Một danh sách các API key của bạn từ [Google AI Studio](https://aistudio.google.com/app/apikey), được phân tách bằng dấu phẩy. Ứng dụng sẽ tự động thử key tiếp theo nếu key hiện tại không thành công. Ví dụ: `key1,key2,key3`.
- **`PERPLEXITY_API_KEY`**: API key của bạn từ [Perplexity Labs](https://docs.perplexity.ai/docs).

#### Biến Môi trường Frontend (Client-side)
Các biến này **bắt buộc phải có tiền tố `VITE_`** để Vercel (thông qua Vite) có thể truy cập chúng từ phía client.

- **`VITE_FIREBASE_API_KEY`**: API Key từ cài đặt dự án Firebase của bạn.
- **`VITE_FIREBASE_AUTH_DOMAIN`**: Auth Domain từ cài đặt dự án Firebase.
- **`VITE_FIREBASE_PROJECT_ID`**: Project ID từ cài đặt dự án Firebase.
- **`VITE_FIREBASE_STORAGE_BUCKET`**: Storage Bucket từ cài đặt dự án Firebase.
- **`VITE_FIREBASE_MESSAGING_SENDER_ID`**: Messaging Sender ID từ cài đặt dự án Firebase.
- **`VITE_FIREBASE_APP_ID`**: App ID từ cài đặt dự án Firebase.
- **`VITE_GOOGLE_CLIENT_ID`** (Tùy chọn): Nếu bạn muốn sử dụng tính năng "Lưu vào Google Drive", hãy cung cấp OAuth 2.0 Client ID của bạn từ Google Cloud Console.

> **Cách lấy thông tin cấu hình Firebase:**
> 1.  Truy cập [Firebase Console](https://console.firebase.google.com/) và chọn dự án của bạn.
> 2.  Đi đến **Cài đặt dự án** (biểu tượng ⚙️) > tab **Chung**.
> 3.  Trong phần "Ứng dụng của bạn", tìm đối tượng `firebaseConfig`. Các giá trị bạn cần nằm ở đó.

### 4. Triển khai

Nhấp vào nút "Deploy". Vercel sẽ build và triển khai ứng dụng của bạn. Sau vài phút, bạn sẽ có một URL công khai cho ứng dụng của mình.

Đó là tất cả! API key của bạn được bảo mật an toàn ở phía server-side.