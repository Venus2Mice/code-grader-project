# Routes package
from .auth_routes import auth_bp
from .class_routes import class_bp
from .problem_routes import problem_bp
from .submission_routes import submission_bp
from .internal_routes import internal_bp
from .student_routes import student_bp
from .health_routes import bp as health_bp
from .resource_routes import resource_bp

__all__ = [
    'auth_bp',
    'class_bp',
    'problem_bp',
    'submission_bp',
    'internal_bp',
    'student_bp',
    'health_bp',
    'resource_bp'
]
