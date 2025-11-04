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

    # Setup logging first (before any other operations)
    from .logging_config import setup_logging
    setup_logging(app)

    # Enable compression for faster response
    compress.init_app(app)
    
    # Initialize extensions with CORS configuration
    CORS(app, 
         resources={r"/api/*": {"origins": "*"}},
         allow_headers=["Content-Type", "Authorization"],
         methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # Register error handlers
    from .error_handlers import register_error_handlers
    register_error_handlers(app)

    with app.app_context():
        # Import all blueprints
        from .routes import (
            auth_bp,
            class_bp,
            problem_bp,
            submission_bp,
            internal_bp,
            student_bp,
            health_bp,
            resource_bp,
            language_bp
        )
        from .routes.config_routes import config_bp
        
        # Register blueprints
        app.register_blueprint(auth_bp)
        app.register_blueprint(class_bp)
        app.register_blueprint(problem_bp)
        app.register_blueprint(submission_bp)
        app.register_blueprint(internal_bp)
        app.register_blueprint(student_bp)
        app.register_blueprint(health_bp)
        app.register_blueprint(resource_bp)
        app.register_blueprint(language_bp)
        app.register_blueprint(config_bp)

        # Import models for migration
        from . import models

        # Register CLI commands
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