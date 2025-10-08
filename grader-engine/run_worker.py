# Import hàm main từ module worker.main
from worker.main import main
# Điều này giúp khởi động tiến trình worker để xử lý các yêu cầu chấm bài

# Điểm bắt đầu thực thi script
if __name__ == '__main__':
    try:
        # Gọi hàm main để bắt đầu tiến trình worker
        main()
    except KeyboardInterrupt:
        # Xử lý khi người dùng ngắt chương trình bằng Ctrl+C
        print('Worker interrupted by user.')