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