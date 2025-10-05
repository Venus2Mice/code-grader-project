from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate # Import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_swagger_ui import get_swaggerui_blueprint
from flask import send_from_directory
from .config import Config

db = SQLAlchemy()
migrate = Migrate()  # Khởi tạo Migrate instance
jwt = JWTManager() # Khởi tạo JWTManager instance

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS
    CORS(app)

    db.init_app(app)
    migrate.init_app(app, db)  # Khởi tạo Migrate với app và db
    jwt.init_app(app)

    # from . import routes
    # app.register_blueprint(routes.bp)

    from .auth_routes import auth_bp
    app.register_blueprint(auth_bp)

    #Import models for migrate to see changes
    from . import models

    from . import commands
    commands.init_app(app)

    ### Swagger UI Setup ###
    SWAGGER_URL = '/api/docs'  # URL để truy cập Swagger UI
    API_URL = '/static/swagger.json'  # Đường dẫn tới file swagger.json của bạn
    
    # Tạo Swagger UI blueprint
    swaggerui_blueprint = get_swaggerui_blueprint(
        SWAGGER_URL,
        API_URL,
        config={
            'app_name': "Code Grader API Docs"
        }
    )
    app.register_blueprint(swaggerui_blueprint)

    # Tạo một route để phục vụ file swagger.json
    # Điều này cần thiết vì blueprint trên cần fetch file này
    @app.route('/static/<path:path>')
    def send_static(path):
        return send_from_directory('static', path)
        
    ### End Swagger UI Setup ###

    return app