# Hướng dẫn Kiểm thử API (API Testing Guide)

Tài liệu này cung cấp một kịch bản kiểm thử chi tiết từ đầu đến cuối (end-to-end) cho hệ thống **Code Grader**, sử dụng giao diện Swagger UI.

## A. Chuẩn bị

Trước khi bắt đầu, hãy đảm bảo bạn đã hoàn thành các bước sau:

1.  **Hệ thống đã được khởi chạy:** Chạy script `./setup.sh` thành công.
2.  **Truy cập Swagger UI:** Mở trình duyệt web của bạn và điều hướng đến:
    > **[http://localhost:5000/api/docs](http://localhost:5000/api/docs)**

3.  **Mở Log Worker:** Giữ cửa sổ terminal nơi bạn đã chạy `./setup.sh` để có thể theo dõi log của Worker trong thời gian thực.
4.  **Tài khoản Test:** Script cài đặt đã tạo sẵn các tài khoản sau:
    -   **Giáo viên:** `teacher.dev@example.com` / Mật khẩu: `password`
    -   **Học sinh:** `student.dev@example.com` / Mật khẩu: `password`

## B. Quy trình Kiểm thử End-to-End

Quy trình này mô phỏng luồng hoạt động tự nhiên của ứng dụng, từ việc thiết lập lớp học đến khi chấm xong một bài nộp.

---

### **Phần 1: Vai trò Giáo viên - Thiết lập Lớp học và Bài tập**

#### **Bước 1.1: Đăng nhập với vai trò Giáo viên**

1.  Trên Swagger UI, tìm và mở rộng endpoint `POST /api/auth/login`.
2.  Nhấn nút **"Try it out"**.
3.  Trong ô `Request body`, nhập thông tin đăng nhập của giáo viên:
    ```json
    {
      "email": "teacher.dev@example.com",
      "password": "password"
    }
    ```
4.  Nhấn **"Execute"**.
5.  **Kết quả:** Bạn sẽ nhận được một `access_token` trong `Response body`.
6.  **Hành động:**
    -   **Copy** toàn bộ chuỗi token (bao gồm cả dấu ngoặc kép).
    -   Nhấn vào nút **"Authorize"** màu xanh ở góc trên bên phải.
    -   Trong popup hiện ra, **paste** token vào ô `Value`.
    -   Nhấn **"Authorize"** rồi **"Close"**.
    -   *Xác minh:* Biểu tượng ổ khóa trên nút "Authorize" giờ đã được đóng lại.

#### **Bước 1.2: Tạo một Lớp học mới**

1.  Mở rộng endpoint `POST /api/classes`.
2.  Nhấn **"Try it out"**.
3.  Trong `Request body`, nhập tên lớp học:
    ```json
    {
      "name": "Nhập môn Lập trình C++ 2025",
      "course_code": "CS101"
    }
    ```
4.  Nhấn **"Execute"**.
5.  **Kết quả:** Bạn sẽ nhận được thông tin chi tiết của lớp học vừa tạo, bao gồm `id` và `invite_code`.
6.  **Hành động:** **Ghi lại giá trị `invite_code`** (ví dụ: `a1b2c3d4`) và `id` của lớp học (ví dụ: `1`) để sử dụng ở các bước sau.

#### **Bước 1.3: Tạo Bài tập trong Lớp học**

1.  Mở rộng endpoint `POST /api/classes/{class_id}/problems`.
2.  Nhấn **"Try it out"**.
3.  Trong ô `class_id`, nhập `id` của lớp học bạn vừa ghi lại (ví dụ: `1`).
4.  Trong `Request body`, nhập thông tin bài tập. Hãy sử dụng bài "Tổng hai số" để dễ kiểm tra:
    ```json
    {
      "title": "Problem A: Tổng hai số",
      "description": "Nhập vào 2 số nguyên a, b. In ra tổng của chúng.",
      "test_cases": [
        { "input": "5 10", "output": "15" },
        { "input": "-1 -2", "output": "-3" }
      ]
    }
    ```
5.  Nhấn **"Execute"**.
6.  **Kết quả:** Bạn nhận được thông tin bài tập vừa tạo.
7.  **Hành động:** **Ghi lại giá trị `id`** của bài tập này (ví dụ: `1`).

---

### **Phần 2: Vai trò Học sinh - Tham gia và Nộp bài**

#### **Bước 2.1: Đăng nhập với vai trò Học sinh**

1.  **Đăng xuất Giáo viên:** Nhấn nút **"Authorize"** và chọn **"Logout"** để xóa token cũ.
2.  **Đăng nhập Học sinh:** Lặp lại **Bước 1.1**, nhưng lần này sử dụng thông tin của học sinh:
    ```json
    {
      "email": "student.dev@example.com",
      "password": "password"
    }
    ```
3.  **Authorize** lại bằng token mới của học sinh.

#### **Bước 2.2: Tham gia Lớp học**

1.  Mở rộng endpoint `POST /api/classes/join`.
2.  Nhấn **"Try it out"**.
3.  Trong `Request body`, nhập `invite_code` mà bạn đã ghi lại từ **Bước 1.2**:
    ```json
    {
      "invite_code": "a1b2c3d4"
    }
    ```4.  Nhấn **"Execute"**.
5.  **Kết quả:** Bạn sẽ nhận được thông báo tham gia lớp học thành công.

#### **Bước 2.3: Nộp bài làm**

1.  Mở rộng endpoint `POST /api/submissions`.
2.  Nhấn **"Try it out"**.
3.  Trong `Request body`, nhập `problem_id` bạn đã ghi lại ở **Bước 1.3** và một đoạn mã nguồn C++ đúng:
    ```json
    {
      "problem_id": 1,
      "source_code": "#include <iostream>\n\nint main() {\n    int a, b;\n    std::cin >> a >> b;\n    std::cout << a + b;\n    return 0;\n}"
    }
    ```
4.  Nhấn **"Execute"**.
5.  **Kết quả:** Bạn sẽ nhận được `submission_id` và trạng thái `"status": "Pending"`.
6.  **Hành động:** **Ghi lại giá trị `submission_id`** (ví dụ: `1`).
7.  **Quan sát Log:** Nhìn sang cửa sổ terminal đang chạy Worker. Bạn sẽ thấy các dòng log xuất hiện, báo hiệu Worker đã nhận và đang xử lý bài nộp của bạn.

---

### **Phần 3: Kiểm tra Kết quả**

#### **Bước 3.1: Lấy kết quả bài nộp**

1.  **Đợi khoảng 5-10 giây** để Worker hoàn thành việc chấm bài.
2.  Mở rộng endpoint `GET /api/submissions/{submission_id}`.
3.  Nhấn **"Try it out"**.
4.  Trong ô `submission_id`, nhập `id` bạn đã ghi lại ở **Bước 2.3**.
5.  Nhấn **"Execute"**.
6.  **Kết quả mong đợi:** `Response body` sẽ hiển thị kết quả cuối cùng:
    ```json
    {
      "id": 1,
      "problem_id": 1,
      "status": "Accepted", // Trạng thái tổng thể
      "submitted_at": "...",
      "results": [
        {
          "test_case_id": 1,
          "status": "Accepted", // Kết quả của từng test case
          // ...
        },
        {
          "test_case_id": 2,
          "status": "Accepted",
          // ...
        }
      ]
    }
    ```

---

### **Các Kịch bản Kiểm thử Khác (Tùy chọn)**

Sau khi hoàn thành luồng chính, bạn có thể lặp lại **Bước 2.3** với các đoạn code khác nhau để kiểm tra các trạng thái lỗi:

-   **Wrong Answer:** Nộp code sai logic (ví dụ: `std::cout << a - b;`).
-   **Compile Error:** Nộp code thiếu dấu `;`.
-   **Time Limit Exceeded:** Nộp code có vòng lặp vô tận (`while(true) {}`).
-   **Runtime Error:** Nộp code chia cho 0 (`int x = 1/0;`).

Với mỗi lần nộp, hãy lặp lại **Bước 3.1** để kiểm tra xem hệ thống có trả về đúng trạng thái lỗi hay không.

Chúc mừng! Bạn đã hoàn thành việc kiểm thử toàn bộ các chức năng cốt lõi của hệ thống.