# Sử dụng image Python chính thức
FROM python:3.10-slim

# Thiết lập thư mục làm việc
WORKDIR /app

# Sao chép file requirements và cài đặt thư viện
# Tách ra làm 2 bước để tận dụng cache của Docker
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Sao chép toàn bộ code của backend vào thư mục làm việc
COPY . .

# Expose cổng 5000 để bên ngoài có thể truy cập
EXPOSE 5000

# Startup script - tự động chạy migrations và seed dữ liệu
CMD ["python", "startup.py"]