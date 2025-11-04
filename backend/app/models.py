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
    from sqlalchemy.dialects.postgresql import JSONB
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
    from sqlalchemy.dialects.postgresql import JSONB
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
    uuid = Column(String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))  # Public identifier
    public_token = Column(String(255), unique=True, nullable=True)  # Opaque token for API access
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey('roles.id'), nullable=False)
    language = Column(String(5), nullable=False, default='en')  # User's preferred language: 'en' or 'vi'
    created_at = Column(DateTime, default=datetime.utcnow)
    
    role = relationship('Role', back_populates='users')
    classes_taught = relationship('Class', back_populates='teacher', foreign_keys='Class.teacher_id')
    submissions = relationship('Submission', back_populates='student', foreign_keys='Submission.student_id')
    graded_submissions = relationship('Submission', back_populates='graded_by_teacher', foreign_keys='Submission.graded_by_teacher_id')
    classes_joined = relationship('Class', secondary=class_members, back_populates='students')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Class(Base):
    __tablename__ = 'classes'
    id = Column(Integer, primary_key=True)
    uuid = Column(String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))  # Public identifier
    public_token = Column(String(255), unique=True, nullable=True)  # Opaque token for API access
    name = Column(String(255), nullable=False)
    course_code = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)  # NEW: Class description
    invite_code = Column(String(8), unique=True, nullable=False, default=lambda: str(uuid.uuid4())[:8])
    teacher_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    teacher = relationship('User', back_populates='classes_taught')
    problems = relationship('Problem', back_populates='class_obj', cascade="all, delete-orphan")
    students = relationship('User', secondary=class_members, back_populates='classes_joined')

class Problem(Base):
    __tablename__ = 'problems'
    __table_args__ = (
        # Ensure language field only accepts valid programming languages
        # This prevents invalid language values at the database level
        db.CheckConstraint(
            "language IN ('cpp', 'python', 'java')",
            name='valid_language_check'
        ),
    )
    
    id = Column(Integer, primary_key=True)
    uuid = Column(String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))  # Public identifier
    public_token = Column(String(255), unique=True, nullable=True)  # Opaque token for API access
    class_id = Column(Integer, ForeignKey('classes.id'), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    markdown_content = Column(Text, nullable=True)  # NEW: Markdown description (optional)
    # Vietnamese translations for i18n support
    title_vi = Column(String(255), nullable=True)  # Vietnamese title
    description_vi = Column(Text, nullable=True)  # Vietnamese description
    markdown_content_vi = Column(Text, nullable=True)  # Vietnamese markdown content
    difficulty = Column(String(20), default='medium')  # 'easy', 'medium', 'hard'
    language = Column(String(50), nullable=False, default='cpp')  # Target language for this problem
    function_signature = Column(Text, nullable=True)  # Optional - kept for backward compatibility
    function_name = Column(String(100), nullable=False)  # Teacher-defined function name
    return_type = Column(String(100), nullable=False, default='int')  # NEW: Return type (e.g., "int", "int[]", "string")
    parameters = Column(JSONB, nullable=False, default=list)  # NEW: [{"name": "param1", "type": "int[]"}, {...}]
    time_limit_ms = Column(Integer, default=1000)
    memory_limit_kb = Column(Integer, default=256000)
    language_limits = Column(JSONB, nullable=True)  # Language-specific limits {"cpp": {"timeMs": 1000, "memoryKb": 65536}}
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    class_obj = relationship('Class', back_populates='problems')
    test_cases = relationship('TestCase', back_populates='problem', cascade="all, delete-orphan")
    submissions = relationship('Submission', back_populates='problem', cascade="all, delete-orphan")

    def get_limit_for_language(self, language):
        """Get time and memory limits for specific language with fallback to defaults"""
        if self.language_limits and language in self.language_limits:
            lang_limits = self.language_limits[language]
            time_ms = lang_limits.get('timeMs', self.time_limit_ms)
            memory_kb = lang_limits.get('memoryKb', self.memory_limit_kb)
            return time_ms, memory_kb
        return self.time_limit_ms, self.memory_limit_kb
    
    def get_title(self, lang='en'):
        """Get problem title in the requested language with fallback to English"""
        if lang == 'vi' and self.title_vi:
            return self.title_vi
        return self.title
    
    def get_description(self, lang='en'):
        """Get problem description in the requested language with fallback to English"""
        if lang == 'vi' and self.description_vi:
            return self.description_vi
        return self.description
    
    def get_markdown_content(self, lang='en'):
        """Get problem markdown content in the requested language with fallback to English"""
        if lang == 'vi' and self.markdown_content_vi:
            return self.markdown_content_vi
        return self.markdown_content

class TestCase(Base):
    __tablename__ = 'test_cases'
    id = Column(Integer, primary_key=True)
    problem_id = Column(Integer, ForeignKey('problems.id'), nullable=False)
    inputs = Column(JSONB, nullable=False)  # NEW: Array of {type, value} objects
    expected_output = Column(JSONB, nullable=False)  # NEW: {type, value} object
    is_hidden = Column(Boolean, default=False)
    points = Column(Integer, default=10)  # Points for this test case
    
    problem = relationship('Problem', back_populates='test_cases')
    results = relationship('SubmissionResult', back_populates='test_case')

class Submission(Base):
    __tablename__ = 'submissions'
    id = Column(Integer, primary_key=True)
    uuid = Column(String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))  # Public identifier
    public_token = Column(String(255), unique=True, nullable=True)  # Opaque token for API access
    problem_id = Column(Integer, ForeignKey('problems.id'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    source_code = Column(Text, nullable=False)
    language = Column(String(50), nullable=False, default='cpp')
    status = Column(String(50), default='Pending')
    is_test = Column(Boolean, default=False)  # NEW: True for test runs, False for actual submissions
    is_late = Column(Boolean, default=False)  # NEW: True if submitted after due date
    submitted_at = Column(DateTime, default=datetime.utcnow)
    cached_score = Column(Integer, nullable=True, default=0)  # Auto-calculated score from test results (used as fallback when manual_score is None)
    
    # Manual grading fields (teacher has full control)
    manual_score = Column(Integer, nullable=True)  # Teacher-assigned score (overrides cached_score)
    graded_by_teacher_id = Column(Integer, ForeignKey('users.id'), nullable=True)  # Teacher who graded
    graded_at = Column(DateTime, nullable=True)  # When teacher graded
    teacher_comment = Column(Text, nullable=True)  # Teacher's feedback comment
    
    problem = relationship('Problem', back_populates='submissions')
    student = relationship('User', back_populates='submissions', foreign_keys=[student_id])
    results = relationship('SubmissionResult', back_populates='submission', cascade="all, delete-orphan")
    graded_by_teacher = relationship('User', back_populates='graded_submissions', foreign_keys=[graded_by_teacher_id])

class SubmissionResult(Base):
    __tablename__ = 'submission_results'
    id = Column(Integer, primary_key=True)
    submission_id = Column(Integer, ForeignKey('submissions.id'), nullable=False)
    test_case_id = Column(Integer, ForeignKey('test_cases.id'), nullable=True)  # Allow NULL for compile errors
    status = Column(String(50), nullable=False)
    execution_time_ms = Column(Integer) # Đã sửa typo
    memory_used_kb = Column(Integer)    # Đã sửa tên
    output_received = Column(Text)
    error_message = Column(Text)
    
    submission = relationship('Submission', back_populates='results')
    test_case = relationship('TestCase', back_populates='results')

class Resource(Base):
    """Resources attached to problems (files, links, drive links)"""
    __tablename__ = 'resources'
    id = Column(Integer, primary_key=True)
    problem_id = Column(Integer, ForeignKey('problems.id'), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_url = Column(String(1000), nullable=False)  # URL or file path
    file_size = Column(Integer, nullable=True)  # Size in bytes
    file_type = Column(String(100), nullable=True)  # MIME type
    resource_type = Column(String(50), nullable=False)  # 'file', 'drive_link', 'external_link'
    drive_link = Column(String(1000), nullable=True)  # Google Drive link if applicable
    description = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    uploaded_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    problem = relationship('Problem', backref=backref('resources', cascade='all, delete-orphan'))
    uploader = relationship('User', backref='uploaded_resources')