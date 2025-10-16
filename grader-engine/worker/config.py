# /grader-engine/worker/config.py
import os
from dotenv import load_dotenv

load_dotenv() # Tải các biến từ file .env (nếu có, tiện cho local dev)

class Config:
    DATABASE_URL = os.environ.get('DATABASE_URL')
    RABBITMQ_HOST = os.environ.get('RABBITMQ_HOST', 'localhost')
    BACKEND_API_URL = os.environ.get('BACKEND_API_URL', 'http://localhost:5000')
    DOCKER_IMAGE_NAME = "cpp-grader-env" # Tên image môi trường chấm C++
    # Thư mục tạm trong container/máy local
    GRADER_TEMP_DIR = os.environ.get('GRADER_TEMP_DIR', '/tmp/grader_submissions')
    # Đường dẫn thực tế trên host để Docker daemon có thể truy cập
    # Khi chạy worker ngoài Docker, cả 2 đường dẫn này giống nhau
    HOST_GRADER_TEMP_DIR = os.environ.get('HOST_GRADER_TEMP_DIR', GRADER_TEMP_DIR)