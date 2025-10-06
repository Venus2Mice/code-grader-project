# backend/app/models.py

from . import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import uuid

# Bảng trung gian cho relations many to many (N-N) giữa User và Class
class_members = db.Table('class_members',
    db.Column('student_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('class_id', db.Integer, db.ForeignKey('classes.id'), primary_key=True)
)

class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False) # 'teacher', 'student'
    users = db.relationship('User', backref='role', lazy=True)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relations one to many (Techer can taught many classes, Student can submit many problems)
    classes_taught = db.relationship('Class', back_populates='teacher', lazy=True, foreign_keys='Class.teacher_id')
    submissions = db.relationship('Submission', back_populates='student', lazy=True)
    #Relations many to many from user
    classes_joined = db.relationship('Class', secondary=class_members, lazy='subquery', back_populates='students')

    def set_password(self, password):
        """Tạo hash từ mật khẩu và lưu vào password_hash."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Kiểm tra mật khẩu người dùng nhập có khớp với hash đã lưu không."""
        return check_password_hash(self.password_hash, password)

class Class(db.Model):
    __tablename__ = 'classes'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    # course_code: Mã học phần chính thức (ví dụ: IT4409, CS101).
    # - Tác dụng: Dùng để định danh, hiển thị và quản lý lớp học theo mã của trường/tổ chức.
    # - Ví dụ: Giúp giáo viên và sinh viên dễ dàng nhận biết lớp học này tương ứng với học phần nào
    #   trong chương trình đào tạo chính quy.
    # - Đây là thông tin mang tính "metadata", không dùng cho cơ chế tham gia lớp.
    course_code = db.Column(db.String(50), nullable=True)

    # invite_code: Mã mời tham gia lớp học.
    # - Tác dụng: Là "chìa khóa" bí mật, ngắn gọn, ngẫu nhiên để sinh viên có thể tự tham gia vào lớp.
    # - Đảm bảo chỉ những người có mã mời mới có thể vào lớp, tăng tính bảo mật và tự động hóa.
    # - Mỗi lớp có một mã mời duy nhất, không trùng lặp.
    invite_code = db.Column(db.String(8), unique=True, nullable=False, default=lambda: str(uuid.uuid4())[:8])

    teacher_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    # Mối quan hệ: Một lớp được dạy bởi một teacher
    teacher = db.relationship('User', back_populates='classes_taught', lazy=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relations one to many (Class can have many problems, Class can have many students)
    problems = db.relationship('Problem', back_populates='class_obj', lazy=True, cascade="all, delete-orphan")
    students = db.relationship('User', secondary=class_members, lazy='subquery',
                               back_populates='classes_joined')

class Problem(db.Model):
    __tablename__ = 'problems'
    id = db.Column(db.Integer, primary_key=True)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    time_limit_ms = db.Column(db.Integer, default=1000)
    memory_limit_kb = db.Column(db.Integer, default=256000)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'), nullable=False)
    class_obj = db.relationship('Class', back_populates='problems')
    
    # Relations one to many (Problem can have many test cases, Problem can have many submissions)
    test_cases = db.relationship('TestCase', backref='problem', lazy=True, cascade="all, delete-orphan")
    submissions = db.relationship('Submission', backref='problem', lazy=True, cascade="all, delete-orphan")

class TestCase(db.Model):
    __tablename__ = 'test_cases'
    id = db.Column(db.Integer, primary_key=True)
    problem_id = db.Column(db.Integer, db.ForeignKey('problems.id'), nullable=False)
    input_data = db.Column(db.Text, nullable=False)
    expected_output = db.Column(db.Text, nullable=False)
    is_hidden = db.Column(db.Boolean, default=False)

class Submission(db.Model):
    __tablename__ = 'submissions'
    id = db.Column(db.Integer, primary_key=True)
    problem_id = db.Column(db.Integer, db.ForeignKey('problems.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    source_code = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), nullable=False)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    student = db.relationship('User', back_populates='submissions')
    
    # Relations one to many (Submission can have many submission results)
    results = db.relationship('SubmissionResult', backref='submission', lazy=True, cascade="all, delete-orphan")

class SubmissionResult(db.Model):
    __tablename__ = 'submission_results'
    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(db.Integer, db.ForeignKey('submissions.id'), nullable=False)
    test_case_id = db.Column(db.Integer, db.ForeignKey('test_cases.id'), nullable=False)
    status = db.Column(db.String(50), nullable=False)
    excution_time_ms = db.Column(db.Integer)
    memory_usage_kb = db.Column(db.Integer)
    output_received = db.Column(db.Text)
    error_message = db.Column(db.Text)

    # Relations one to many (SubmissionResult can have many test cases)
    test_case = db.relationship('TestCase', backref=db.backref('results', lazy=True))
