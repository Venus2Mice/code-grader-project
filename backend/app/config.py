import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv() # Load các biến từ file .env

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Configuration - Tăng thời gian token lên 1 giờ
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)  # Token hết hạn sau 1 giờ