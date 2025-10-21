<<<<<<< HEAD
<<<<<<< HEAD
# /app/routes/__init__.py

def register_routes(app):
    """Hàm để đăng ký tất cả các blueprint route với ứng dụng Flask."""
    from .auth import auth_bp
    from .classes import class_bp
    from .problems import problem_bp
    from .submissions import submission_bp
    from .internal import internal_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(class_bp)
    app.register_blueprint(problem_bp)
    app.register_blueprint(submission_bp)
    app.register_blueprint(internal_bp)
=======
=======
>>>>>>> git-codespace
# Routes package
from .auth_routes import auth_bp
from .class_routes import class_bp
from .problem_routes import problem_bp
from .submission_routes import submission_bp
from .internal_routes import internal_bp
from .student_routes import student_bp
from .health_routes import bp as health_bp

__all__ = [
    'auth_bp',
    'class_bp',
    'problem_bp',
    'submission_bp',
    'internal_bp',
    'student_bp',
    'health_bp'
]
<<<<<<< HEAD
>>>>>>> git-codespace
=======
>>>>>>> git-codespace
