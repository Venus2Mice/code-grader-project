# /app/app/__init__.py

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_swagger_ui import get_swaggerui_blueprint
from flask import send_from_directory
from .config import Config

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Khởi tạo các extension
    CORS(app)
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Bắt đầu phần sửa lỗi
    with app.app_context():
        # Bước 1: Import tất cả các file chứa route của bạn ở đây.
        # Điều này đảm bảo tất cả các decorator @bp.route đều được chạy
        # và "đính" vào các biến blueprint tương ứng.
        from . import auth_routes
        from . import class_routes
        from . import problem_routes 
        from . import submission_routes 
        from . import internal_routes
        
        # Bước 2: Sau khi tất cả các route đã được định nghĩa và đính vào,
        # bây giờ mới đăng ký các blueprint với ứng dụng.
        app.register_blueprint(auth_routes.auth_bp)
        app.register_blueprint(class_routes.class_bp)
        app.register_blueprint(problem_routes.problem_bp)
        app.register_blueprint(submission_routes.submission_bp)
        app.register_blueprint(internal_routes.internal_bp)

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