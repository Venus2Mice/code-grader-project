# /grader-engine/worker/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from .config import Config

# Tạo engine kết nối tới CSDL
engine = create_engine(Config.DATABASE_URL)

# Tạo một session factory
# scoped_session đảm bảo mỗi thread có một session riêng, an toàn hơn
session_factory = sessionmaker(bind=engine)
Session = scoped_session(session_factory)

def get_db_session():
    """Hàm helper để lấy một session CSDL."""
    return Session()