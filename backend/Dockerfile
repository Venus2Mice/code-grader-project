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

# Lệnh để chạy ứng dụng khi container khởi động
# Sử dụng gunicorn cho production, nhưng flask run vẫn ổn cho dev
# --host=0.0.0.0 để có thể truy cập từ bên ngoài container
CMD ["python", "-m", "flask", "run", "--host=0.0.0.0"]