# Med.AI by dr.HT

Ứng dụng AI chuyên dụng giúp tóm tắt, phân tích và chuyển đổi tài liệu y khoa phức tạp thành ghi chú có cấu trúc, thẻ ghi nhớ và bài kiểm tra để hỗ trợ học tập và ứng dụng lâm sàng hiệu quả.

## Chế độ hoạt động

Ứng dụng này có hai chế độ hoạt động tự động:

1.  **Chế độ Online (Vercel/Production):**
    *   Hỗ trợ đăng nhập bằng tài khoản Google hoặc Email/Mật khẩu.
    *   Sử dụng **Supabase (Postgres)** để lưu trữ và đồng bộ hóa dữ liệu trên các thiết bị.
    *   Cần cấu hình các biến môi trường Supabase trên Vercel để hoạt động.

2.  **Chế độ Offline (AI Studio/Local):**
    *   **Không** yêu cầu đăng nhập.
    *   Sử dụng **bộ nhớ cục bộ của trình duyệt (`localStorage`)** để lưu trữ tất cả dữ liệu.
    *   Hoạt động ngay lập tức mà không cần cấu hình.

## Hướng dẫn triển khai lên Vercel với Supabase

Để kích hoạt chế độ online, vui lòng làm theo các bước sau một cách cẩn thận.

### Phần 1: Tạo và Cấu hình Dự án trên Supabase

**Bước 1.1: Tạo Dự án Supabase**
1.  Truy cập [Supabase](https://supabase.com/) và đăng nhập.
2.  Trên trang tổng quan, nhấp vào **"New project"**.
3.  Chọn tổ chức của bạn, đặt tên cho dự án (ví dụ: `med-ai-app`), tạo mật khẩu cơ sở dữ liệu (lưu lại ở nơi an toàn), và chọn khu vực gần bạn nhất.
4.  Nhấp **"Create new project"** và đợi dự án được khởi tạo.

**Bước 1.2: Lấy thông tin cấu hình (URL & Anon Key)**
1.  Sau khi dự án được tạo, đi đến **Project Settings** (biểu tượng bánh răng ⚙️ ở menu bên trái).
2.  Chọn mục **API**.
3.  Trong phần **Project API keys**, bạn sẽ thấy hai giá trị quan trọng:
    *   **URL**
    *   **anon public key**
4.  **Giữ nguyên tab này**, chúng ta sẽ cần hai giá trị này cho Vercel.

**Bước 1.3: Cấu hình Xác thực (Authentication)**
1.  Trong menu bên trái, đi đến **Authentication > Providers**.
2.  Bạn sẽ thấy một danh sách các nhà cung cấp.
3.  **Email:** Mặc định đã được bật. Bạn không cần làm gì thêm.
4.  **Google:**
    *   Nhấp vào **Google** để mở cấu hình.
    *   Làm theo hướng dẫn của Supabase để tạo thông tin xác thực OAuth trên [Google Cloud Console](https://console.cloud.google.com/).
    *   Bạn sẽ cần cung cấp **Client ID** và **Client Secret** vào các trường tương ứng trên Supabase.
    *   **QUAN TRỌNG:** Sao chép **Redirect URI** từ trang Supabase và dán nó vào phần "Authorized redirect URIs" trong cấu hình OAuth Client ID của bạn trên Google Cloud.
    *   Sau khi điền xong, bật công tắc và nhấp **Save**.

**Bước 1.4: Thiết lập Cơ sở dữ liệu (SQL)**
1.  Trong menu bên trái, đi đến **SQL Editor**.
2.  Nhấp vào **"+ New query"**.
3.  Sao chép toàn bộ nội dung SQL dưới đây, dán vào trình soạn thảo, và nhấp **"RUN"**. Đoạn mã này sẽ tạo các bảng cần thiết và thiết lập quy tắc bảo mật.
4.  **⚠️ QUAN TRỌNG:** Sau khi chạy, bạn sẽ thấy thông báo **"Success. No rows returned"**. Đảm bảo rằng bạn không thấy bất kỳ thông báo lỗi màu đỏ nào. Đây là bước xác nhận rằng cơ sở dữ liệu của bạn đã được thiết lập đúng.

```sql
-- 1. Tạo bảng `sessions` để lưu trữ siêu dữ liệu của mỗi phiên
CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title text,
    summary jsonb,
    messages jsonb,
    sources jsonb,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    file_name text,
    input_type text,
    url text,
    youtube_video_id text,
    transcript text,
    output_format text,
    suggested_questions jsonb,
    flashcards jsonb,
    quiz jsonb,
    original_document_toc text
);
-- Bật Row Level Security (RLS) cho bảng sessions
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
-- Tạo chính sách: Người dùng chỉ có thể xem và sửa các phiên của chính họ
CREATE POLICY "Enable access for authenticated users only" ON public.sessions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- 2. Tạo bảng `session_contents` để lưu trữ nội dung tệp lớn
CREATE TABLE public.session_contents (
    session_id uuid NOT NULL PRIMARY KEY REFERENCES public.sessions(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content text
);
-- Bật Row Level Security (RLS) cho bảng session_contents
ALTER TABLE public.session_contents ENABLE ROW LEVEL SECURITY;
-- Tạo chính sách: Người dùng chỉ có thể xem và sửa nội dung tệp của chính họ
CREATE POLICY "Enable access for authenticated users only" ON public.session_contents
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

```

**Bước 1.5: Cấu hình CORS (QUAN TRỌNG)**
1.  Để cho phép ứng dụng của bạn (trên Vercel và máy tính) giao tiếp với Supabase, bạn cần cấu hình Cross-Origin Resource Sharing (CORS). **Nếu bỏ qua bước này, bạn sẽ gặp lỗi mạng.**
2.  Trong trang quản lý dự án Supabase, đi đến **Project Settings** (biểu tượng bánh răng ⚙️) > **Data API**.
3.  **Cuộn xuống dưới cùng** của trang `Data API` cho đến khi bạn thấy mục **"CORS configuration"**.
4.  Trong ô **"Allowed Origins (CORS)"**, thêm các URL sau (mỗi URL trên một dòng):
    *   URL triển khai Vercel của bạn (ví dụ: `https://your-app-name.vercel.app`)
    *   URL phát triển cục bộ (ví dụ: `http://localhost:5173`, hoặc cổng bạn đang dùng)
    *   *Tùy chọn:* Để cho phép tất cả các bản xem trước (preview) trên Vercel: `https://*.vercel.app`
5.  Nhấp **Save**.

### Phần 2: Cấu hình trên Vercel

**Bước 2.1: Thêm Biến Môi trường**
1.  Trong trang cài đặt dự án của bạn trên Vercel, đi đến tab **Settings > Environment Variables**.
2.  Thêm hai biến sau, sử dụng các giá trị bạn đã lấy ở **Bước 1.2**:

| Tên Biến trên Vercel | Giá trị | Ghi chú |
|---|---|---|
| `VITE_SUPABASE_URL` | Giá trị `URL` từ Supabase | URL của dự án Supabase |
| `VITE_SUPABASE_ANON_KEY`| Giá trị `anon public key` từ Supabase | Khóa công khai an toàn |

3.  Đảm bảo các biến được áp dụng cho môi trường **Production, Preview, và Development**. Sau đó, nhấp **Save**.

### Phần 3: Triển khai

Bây giờ bạn chỉ cần **trigger một lần triển khai mới** (Redeploy) trên Vercel. Sau khi hoàn tất, ứng dụng của bạn sẽ sử dụng Supabase cho việc đăng nhập và lưu trữ dữ liệu.