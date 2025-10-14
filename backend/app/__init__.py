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
        # Import models
        from . import models

        # Đăng ký các lệnh cli
        from . import commands
        commands.init_app(app)

        # Đăng ký các routes
        from .routes import register_routes
        register_routes(app)        

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