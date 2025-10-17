# /app/app/__init__.py

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_swagger_ui import get_swaggerui_blueprint
from flask_compress import Compress
from flask import send_from_directory
from .config import Config

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
compress = Compress()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable compression for faster response
    compress.init_app(app)
    
    # Khởi tạo các extension
    CORS(app)
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Bắt đầu phần sửa lỗi
    with app.app_context():
        # Import tất cả các blueprint từ thư mục routes
        from .routes import (
            auth_bp,
            class_bp,
            problem_bp,
            submission_bp,
            internal_bp,
            student_bp,
            health_bp
        )
        
        # Đăng ký các blueprint với ứng dụng
        app.register_blueprint(auth_bp)
        app.register_blueprint(class_bp)
        app.register_blueprint(problem_bp)
        app.register_blueprint(submission_bp)
        app.register_blueprint(internal_bp)
        app.register_blueprint(student_bp)
        app.register_blueprint(health_bp)

        # Import models để migrate có thể "thấy" chúng
        from . import models

        # Đăng ký các lệnh cli
        from . import commands
        commands.init_app(app)

    ### Swagger UI Setup ###
    SWAGGER_URL = '/api/docs'
    API_URL = '/static/swagger.json'
    swaggerui_blueprint = get_swaggerui_blueprint(
        SWAGGER_URL,
        API_URL,
        config={'app_name': "Code Grader API Docs"}
    )
    app.register_blueprint(swaggerui_blueprint)

    @app.route('/static/<path:path>')
    def send_static(path):
        return send_from_directory('static', path)
    ### End Swagger UI Setup ###

    return app