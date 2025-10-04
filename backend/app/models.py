# backend/app/models.py

from . import db
from datetime import datetime
import bcrypt # Cần cài thêm: pip install bcrypt

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
    classes_taught = db.relationship('Class', backref='teacher', lazy=True)
    submissions = db.relationship('Submission', backref='student', lazy=True)

    def set_password(self, password):
        # Băm mật khẩu trước khi lưu
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

class Class(db.Model):
    __tablename__ = 'classes'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    course_code = db.Column(db.String(50), unique=True)
    teacher_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relations one to many (Class can have many problems, Class can have many students)
    problems = db.relationship('Problem', backref='class_obj', lazy=True, cascade="all, delete-orphan")
    students = db.relationship('User', secondary=class_members, lazy='subquery',
                               backref=db.backref('enrolled_classes', lazy=True))

class Problem(db.Model):
    __tablename__ = 'problems'
    id = db.Column(db.Integer, primary_key=True)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    time_limit_ms = db.Column(db.Integer, default=1000)
    memory_limit_kb = db.Column(db.Integer, default=256000)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'), nullable=False)
    
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
