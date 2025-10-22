# Agent Guidelines / Hướng dẫn cho AI Agent

## Core Principles / Nguyên tắc cơ bản

### 1. Documentation Policy / Chính sách tài liệu
- **DO NOT** create reports or markdown documentation files unless explicitly requested by the user
- **KHÔNG** tạo file báo cáo hay tài liệu markdown nếu không được yêu cầu rõ ràng từ người dùng
- Focus on code implementation rather than excessive documentation
- Tập trung vào việc triển khai code thay vì tạo tài liệu dư thừa

### 2. Task Management / Quản lý công việc
- **ALWAYS** create a todo list after identifying tasks that need to be completed
- **LUÔN** tạo todo list sau khi xác định được các công việc cần hoàn tất
- Break down complex tasks into smaller, manageable items
- Phân tách công việc phức tạp thành các mục nhỏ hơn, dễ quản lý
- Use the todo list tool to track progress
- Sử dụng công cụ todo list để theo dõi tiến độ

### 3. Completion Reporting / Báo cáo hoàn thành
- **ALWAYS** provide a summary of completed work when all tasks are finished
- **LUÔN** báo cáo và tóm tắt những gì đã hoàn thành khi hoàn tất các công việc
- Include:
  - What was accomplished / Những gì đã hoàn thành
  - Files created/modified / Các file đã tạo/chỉnh sửa
  - Any important notes or warnings / Ghi chú hoặc cảnh báo quan trọng
  - Next steps (if applicable) / Các bước tiếp theo (nếu có)

## Workflow / Quy trình làm việc

1. **Understand** the user's request / Hiểu yêu cầu của người dùng
2. **Plan** by creating a todo list / Lập kế hoạch bằng cách tạo todo list
3. **Execute** tasks one by one / Thực hiện từng công việc
4. **Update** todo list as you progress / Cập nhật todo list trong quá trình làm việc
5. **Summarize** upon completion / Tóm tắt khi hoàn thành

## Best Practices / Thực hành tốt nhất

- Keep communication concise and focused on the task
- Giữ giao tiếp ngắn gọn và tập trung vào công việc
- Ask clarifying questions when requirements are unclear
- Đặt câu hỏi làm rõ khi yêu cầu chưa rõ ràng
- Test changes when possible before reporting completion
- Kiểm tra thay đổi khi có thể trước khi báo cáo hoàn thành
- Prioritize working code over documentation
- Ưu tiên code hoạt động hơn là tài liệu

## Design Principles / Nguyên tắc thiết kế

### SOLID Principles / Nguyên tắc SOLID
**MUST** follow SOLID principles in all code implementations:
**BẮT BUỘC** tuân thủ nguyên tắc SOLID trong mọi triển khai code:

#### 1. Single Responsibility Principle (SRP)
- Each module/class should have only one reason to change
- Mỗi module/class chỉ nên có một lý do để thay đổi
- Example: Separate grading logic, Docker operations, and database access
- Ví dụ: Tách biệt logic chấm bài, thao tác Docker, và truy cập database

#### 2. Open-Closed Principle (OCP)
- Open for extension, closed for modification
- Mở cho mở rộng, đóng cho sửa đổi
- Use interfaces and abstractions to allow new features without changing existing code
- Dùng interface và abstraction để thêm tính năng mới mà không sửa code cũ
- Example: Language handlers can be added without modifying grading service
- Ví dụ: Có thể thêm handler ngôn ngữ mới mà không sửa grading service

#### 3. Liskov Substitution Principle (LSP)
- Subtypes must be substitutable for their base types
- Subtype phải có thể thay thế cho base type
- All language handlers must implement the same interface correctly
- Tất cả language handler phải implement interface giống nhau đúng cách

#### 4. Interface Segregation Principle (ISP)
- Clients should not depend on interfaces they don't use
- Client không nên phụ thuộc vào interface mà không dùng
- Create focused, minimal interfaces rather than large general-purpose ones
- Tạo interface tập trung, tối giản thay vì interface lớn đa năng
- Example: Separate interfaces for stdio vs function-based grading
- Ví dụ: Tách interface cho stdio và function-based grading

#### 5. Dependency Inversion Principle (DIP)
- Depend on abstractions, not concretions
- Phụ thuộc vào abstraction, không phụ thuộc vào concrete
- High-level modules should not depend on low-level modules
- Module cấp cao không nên phụ thuộc vào module cấp thấp
- Example: Grading service depends on LanguageHandler interface, not concrete handlers
- Ví dụ: Grading service phụ thuộc vào LanguageHandler interface, không phải concrete handler

---

*This file serves as guidelines for AI agents working on this project.*
*File này phục vụ như hướng dẫn cho các AI agent làm việc trên dự án này.*
