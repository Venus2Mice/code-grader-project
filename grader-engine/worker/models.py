from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Table
from datetime import datetime

# Tạo một Base class cho tất cả các model
Base = declarative_base()

# Định nghĩa lại bảng trung gian class_members
class_members = Table('class_members', Base.metadata,
    Column('class_id', Integer, ForeignKey('classes.id'), primary_key=True),
    Column('student_id', Integer, ForeignKey('users.id'), primary_key=True)
)

# Thay thế tất cả 'db.Model' bằng 'Base'
# Thay thế tất cả 'db.Column' bằng 'Column'
# Thay thế tất cả 'db.ForeignKey' bằng 'ForeignKey'
# v.v...

class Role(Base):
    __tablename__ = 'roles'
    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)
    users = relationship('User', back_populates='role', lazy=True)

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey('roles.id'), nullable=False)
    
    role = relationship('Role', back_populates='users', lazy=True)
    classes_taught = relationship('Class', back_populates='teacher', lazy=True, foreign_keys='Class.teacher_id')
    submissions = relationship('Submission', back_populates='student', lazy=True)
    classes_joined = relationship('Class', secondary=class_members, lazy='subquery', back_populates='students')

class Class(Base):
    __tablename__ = 'classes'
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    course_code = Column(String(50), nullable=True)
    teacher_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    invite_code = Column(String(36), unique=True, nullable=False)

    teacher = relationship('User', back_populates='classes_taught', lazy=True)
    problems = relationship('Problem', back_populates='class_obj', lazy=True, cascade="all, delete-orphan")
    students = relationship('User', secondary=class_members, lazy='subquery', back_populates='classes_joined')

class Problem(Base):
    __tablename__ = 'problems'
    id = Column(Integer, primary_key=True)
    class_id = Column(Integer, ForeignKey('classes.id'), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    time_limit_ms = Column(Integer, default=1000)
    memory_limit_kb = Column(Integer, default=256000)
    due_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    class_obj = relationship('Class', back_populates='problems')
    test_cases = relationship('TestCase', back_populates='problem', lazy=True, cascade="all, delete-orphan")
    submissions = relationship('Submission', back_populates='problem', lazy=True, cascade="all, delete-orphan")

class TestCase(Base):
    __tablename__ = 'test_cases'
    id = Column(Integer, primary_key=True)
    problem_id = Column(Integer, ForeignKey('problems.id'), nullable=False)
    input_data = Column(Text)
    expected_output = Column(Text)
    is_hidden = Column(Boolean, default=False)
    
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
    submitted_at = Column(DateTime, default=datetime.utcnow)
    
    problem = relationship('Problem', back_populates='submissions')
    student = relationship('User', back_populates='submissions')
    results = relationship('SubmissionResult', back_populates='submission', lazy=True, cascade="all, delete-orphan")

class SubmissionResult(Base):
    __tablename__ = 'submission_results'
    id = Column(Integer, primary_key=True)
    submission_id = Column(Integer, ForeignKey('submissions.id'), nullable=False)
    test_case_id = Column(Integer, ForeignKey('test_cases.id'), nullable=False)
    status = Column(String(50), nullable=False)
    execution_time_ms = Column(Integer)
    memory_used_kb = Column(Integer)
    output_received = Column(Text)
    
    submission = relationship('Submission', back_populates='results')
    test_case = relationship('TestCase', back_populates='results')