# Đây là phiên bản models.py cuối cùng và chính xác
# Hãy copy toàn bộ nội dung file này và dán đè lên cả 2 file:
# 1. backend/app/models.py
# 2. worker/worker/models.py

from datetime import datetime
import uuid

# ----- Phần dành cho Backend (Flask-SQLAlchemy) -----
try:
    from . import db
    from werkzeug.security import generate_password_hash, check_password_hash
    Base = db.Model
    Column = db.Column
    Integer = db.Integer
    String = db.String
    Text = db.Text
    DateTime = db.DateTime
    Boolean = db.Boolean
    ForeignKey = db.ForeignKey
    Table = db.Table
    relationship = db.relationship
    backref = db.backref
# ----- Phần dành cho Worker (SQLAlchemy thuần) -----
except ImportError:
    from sqlalchemy.orm import declarative_base, relationship, backref
    from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Table
    Base = declarative_base()

# Bảng trung gian
class_members = Table('class_members', Base.metadata,
    Column('student_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('class_id', Integer, ForeignKey('classes.id'), primary_key=True)
)

class Role(Base):
    __tablename__ = 'roles'
    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)
    users = relationship('User', back_populates='role')

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey('roles.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    role = relationship('Role', back_populates='users')
    classes_taught = relationship('Class', back_populates='teacher', foreign_keys='Class.teacher_id')
    submissions = relationship('Submission', back_populates='student')
    classes_joined = relationship('Class', secondary=class_members, back_populates='students')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Class(Base):
    __tablename__ = 'classes'
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    course_code = Column(String(50), nullable=True)
    invite_code = Column(String(8), unique=True, nullable=False, default=lambda: str(uuid.uuid4())[:8])
    teacher_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    teacher = relationship('User', back_populates='classes_taught')
    problems = relationship('Problem', back_populates='class_obj', cascade="all, delete-orphan")
    students = relationship('User', secondary=class_members, back_populates='classes_joined')

class Problem(Base):
    __tablename__ = 'problems'
    id = Column(Integer, primary_key=True)
    class_id = Column(Integer, ForeignKey('classes.id'), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    difficulty = Column(String(20), default='medium')  # 'easy', 'medium', 'hard'
    grading_mode = Column(String(20), default='stdio')  # 'stdio', 'function'
    function_signature = Column(Text, nullable=True)  # For function grading mode
    time_limit_ms = Column(Integer, default=1000)
    memory_limit_kb = Column(Integer, default=256000)
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    class_obj = relationship('Class', back_populates='problems')
    test_cases = relationship('TestCase', back_populates='problem', cascade="all, delete-orphan")
    submissions = relationship('Submission', back_populates='problem', cascade="all, delete-orphan")

class TestCase(Base):
    __tablename__ = 'test_cases'
    id = Column(Integer, primary_key=True)
    problem_id = Column(Integer, ForeignKey('problems.id'), nullable=False)
    input_data = Column(Text)
    expected_output = Column(Text)
    is_hidden = Column(Boolean, default=False)
    points = Column(Integer, default=10)  # Points for this test case
    
    problem = relationship('Problem', back_populates='test_cases')
    results = relationship('SubmissionResult', back_populates='test_case')

class Submission(Base):
    __tablename__ = 'submissions'
    id = Column(Integer, primary_key=True)
    problem_id = Column(Integer, ForeignKey('problems.id'), nullable=False)
    student_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    source_code = Column(Text, nullable=False)
    language = Column(String(50), nullable=False, default='cpp')
    status = Column(String(50), default='Pending')
    is_test = Column(Boolean, default=False)  # NEW: True for test runs, False for actual submissions
    submitted_at = Column(DateTime, default=datetime.utcnow)
    
    problem = relationship('Problem', back_populates='submissions')
    student = relationship('User', back_populates='submissions')
    results = relationship('SubmissionResult', back_populates='submission', cascade="all, delete-orphan")

class SubmissionResult(Base):
    __tablename__ = 'submission_results'
    id = Column(Integer, primary_key=True)
    submission_id = Column(Integer, ForeignKey('submissions.id'), nullable=False)
    test_case_id = Column(Integer, ForeignKey('test_cases.id'), nullable=True)  # ✅ Allow NULL for compile errors
    status = Column(String(50), nullable=False)
    execution_time_ms = Column(Integer) # Đã sửa typo
    memory_used_kb = Column(Integer)    # Đã sửa tên
    output_received = Column(Text)
    error_message = Column(Text)
    
    submission = relationship('Submission', back_populates='results')
    test_case = relationship('TestCase', back_populates='results')