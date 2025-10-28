# Med.AI by dr.HT

Ứng dụng AI chuyên dụng giúp tóm tắt, phân tích và chuyển đổi tài liệu y khoa phức tạp thành ghi chú có cấu trúc, thẻ ghi nhớ và bài kiểm tra để hỗ trợ học tập và ứng dụng lâm sàng hiệu quả.

## Chế độ hoạt động

Ứng dụng này có hai chế độ hoạt động tự động:

1.  **Chế độ Online (Vercel/Production):**
    *   Hỗ trợ đăng nhập bằng tài khoản Google hoặc Email/Mật khẩu.
    *   Sử dụng **Firebase/Firestore** để lưu trữ và đồng bộ hóa dữ liệu trên các thiết bị.
    *   Cần cấu hình các biến môi trường Firebase trên Vercel để hoạt động.

2.  **Chế độ Offline (AI Studio/Local):**
    *   **Không** yêu cầu đăng nhập.
    *   Sử dụng **bộ nhớ cục bộ của trình duyệt (`localStorage`)** để lưu trữ tất cả dữ liệu.
    *   Hoạt động ngay lập tức mà không cần cấu hình.

## Hướng dẫn triển khai lên Vercel với Firebase

Để kích hoạt chế độ online, vui lòng làm theo các bước sau một cách cẩn thận.

### Phần 1: Tạo và Cấu hình Dự án trên Firebase

Đây là bước quan trọng nhất. Nếu bạn chưa có, hãy tạo một tài khoản Firebase miễn phí.

**Bước 1.1: Tạo Dự án Firebase**
1.  Truy cập [Bảng điều khiển Firebase](https://console.firebase.google.com/).
2.  Nhấp vào **"Add project"** (Thêm dự án) và đặt tên cho dự án của bạn (ví dụ: `med-ai-app`).
3.  Tiếp tục các bước để tạo dự án. Bạn có thể bỏ qua việc bật Google Analytics nếu không cần.

**Bước 1.2: Kích hoạt Xác thực bằng Google**
1.  Trong bảng điều khiển dự án của bạn, đi đến mục **Build > Authentication**.
2.  Nhấp vào **"Get started"** (Bắt đầu).
3.  Trong tab **"Sign-in method"** (Phương thức đăng nhập), chọn **Google** từ danh sách nhà cung cấp.
4.  **Bật (Enable)** nó lên và chọn một địa chỉ email hỗ trợ dự án. Sau đó nhấp **Save**.

**Bước 1.2.1: (QUAN TRỌNG) Kích hoạt Xác thực bằng Email/Mật khẩu**
1.  Vẫn trong tab **"Sign-in method"**, nhấp vào **"Add new provider"** (Thêm nhà cung cấp mới).
2.  Chọn **Email/Password** từ danh sách.
3.  **Bật (Enable)** tùy chọn đầu tiên ("Email/Password").
4.  Nhấp **Save**.

**Bước 1.3: Kích hoạt Cơ sở dữ liệu Firestore**
1.  Đi đến mục **Build > Firestore Database**.
2.  Nhấp vào **"Create database"** (Tạo cơ sở dữ liệu).
3.  Chọn bắt đầu ở **chế độ Production** (Start in production mode).
4.  Chọn một vị trí (location) cho cơ sở dữ liệu của bạn (nên chọn vị trí gần bạn nhất, ví dụ `asia-southeast1`).
5.  Nhấp **Enable** (Bật).
6.  **QUAN TRỌNG:** Sau khi tạo xong, đi đến tab **"Rules"** (Quy tắc). Xóa nội dung cũ và dán nội dung sau vào, sau đó nhấp **Publish** (Xuất bản).
    *Quy tắc này đảm bảo rằng mỗi người dùng chỉ có thể đọc và ghi dữ liệu của chính họ, giúp bảo mật thông tin.*
    ```
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        // Chỉ cho phép người dùng đã đăng nhập đọc và ghi các phiên của chính họ
        match /sessions/{userId}/sessions/{sessionId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
        match /sessionContents/{userId}/contents/{sessionId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
    ```

**Bước 1.4: Lấy thông tin cấu hình (API Keys)**
1.  Quay lại trang chính của dự án, nhấp vào biểu tượng bánh răng ⚙️ bên cạnh chữ "Project Overview" và chọn **Project settings** (Cài đặt dự án).
2.  Trong tab **General** (Chung), cuộn xuống phần "Your apps" (Ứng dụng của bạn).
3.  Nhấp vào biểu tượng web **`</>`** để đăng ký một ứng dụng web mới.
4.  Đặt tên cho ứng dụng (ví dụ: `Med.AI Web App`) và nhấp **"Register app"** (Đăng ký ứng dụng).
5.  Firebase sẽ hiển thị cho bạn một đối tượng tên là `firebaseConfig`. **Hãy giữ nguyên cửa sổ này**, chúng ta sẽ cần các giá trị trong đó cho phần tiếp theo.

### Phần 2: Cấu hình trên Vercel

**Bước 2.1: Import Dự án**
1.  Đăng nhập vào [Vercel](https://vercel.com/).
2.  Nhấp **"Add New..." -> "Project"** và import dự án của bạn từ tài khoản GitHub.

**Bước 2.2: Thêm Biến Môi trường**
1.  Trong trang cài đặt dự án trên Vercel, đi đến tab **Settings > Environment Variables**.
2.  Bây giờ, hãy sao chép các giá trị từ đối tượng `firebaseConfig` (ở Bước 1.4) và thêm chúng vào Vercel. **LƯU Ý:** Tên biến trên Vercel phải bắt đầu bằng `VITE_`.

| Tên Biến trên Vercel | Giá trị lấy từ `firebaseConfig` |
|---|---|
| `VITE_FIREBASE_API_KEY` | giá trị của `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | giá trị của `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | giá trị của `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | giá trị của `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | giá trị của `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | giá trị của `appId` |

3.  Sau khi thêm tất cả các biến, nhấp **Save**.

### Phần 3: Triển khai

Bây giờ bạn chỉ cần nhấp vào nút **Deploy** trên Vercel. Vercel sẽ tự động build và triển khai ứng dụng của bạn. Sau khi hoàn tất, ứng dụng sẽ có đầy đủ tính năng đăng nhập và lưu trữ dữ liệu trên Firebase.

## Gỡ lỗi (Troubleshooting)

### Vấn đề: Ứng dụng bị kẹt ở màn hình "Đang tải ứng dụng..." trên Vercel

Đây là vấn đề phổ biến nhất và gần như luôn luôn liên quan đến việc cấu hình sai các biến môi trường trên Vercel. Ứng dụng không tìm thấy các khóa API của bạn, không thể khởi tạo Firebase và bị kẹt lại.

**Làm thế nào để chẩn đoán:**

1.  Mở URL ứng dụng Vercel của bạn trong trình duyệt.
2.  Thêm `?debug=true` vào cuối URL và nhấn Enter. Ví dụ: `https://your-app-name.vercel.app/?debug=true`.
3.  Một **bảng gỡ lỗi (Debug Panel)** màu đen sẽ xuất hiện ở góc dưới cùng bên phải màn hình.

**Phân tích kết quả:**

*   **Trường hợp 1: Hoạt động đúng**
    Trong bảng gỡ lỗi, bạn sẽ thấy mục `All 'import.meta.env' Vars` liệt kê tất cả các biến `VITE_FIREBASE_...` của bạn. Giá trị `isConfigured` sẽ là `true`.
    Nếu bạn thấy điều này mà ứng dụng vẫn bị kẹt, có thể có sự cố mạng giữa Vercel và Firebase. Hãy thử triển khai lại (Redeploy).

*   **Trường hợp 2: Cấu hình sai (Lỗi phổ biến nhất)**
    Trong bảng gỡ lỗi, mục `All 'import.meta.env' Vars` sẽ là một đối tượng rỗng (`{}`) hoặc không có bất kỳ biến `VITE_FIREBASE_...` nào. Giá trị `isConfigured` sẽ là `false`.

    **Cách khắc phục:**
    1.  **Đăng nhập vào Vercel** và đi đến dự án của bạn.
    2.  Vào **Settings -> Environment Variables**.
    3.  **Kiểm tra kỹ từng biến một:**
        *   **Chính tả:** Tên biến phải khớp **chính xác 100%**, bao gồm cả tiền tố `VITE_`. Ví dụ: `VITE_FIREBASE_API_KEY`.
        *   **Giá trị:** Đảm bảo bạn đã sao chép và dán đúng giá trị từ `firebaseConfig` mà không có thêm khoảng trắng hay ký tự lạ.
        *   **Phạm vi (Scope):** Đảm bảo các biến được áp dụng cho môi trường **Production**. Nếu bạn cũng muốn nó hoạt động trên các bản xem trước (preview deployments), hãy chọn cả **Preview**.
    4.  Sau khi kiểm tra và sửa lỗi, hãy **trigger một lần triển khai mới** (Redeploy) trên Vercel để các thay đổi có hiệu lực.