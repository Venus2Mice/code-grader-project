from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate # Import Migrate
from flask_cors import CORS
from .config import Config

db = SQLAlchemy()
migrate = Migrate()  # Khởi tạo Migrate instance

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS
    CORS(app)

    db.init_app(app)
    migrate.init_app(app, db)  # Khởi tạo Migrate với app và db

    from . import routes
    app.register_blueprint(routes.bp)

    #Import models for migrate to see changes
    from . import models

    from . import commands
    commands.init_app(app)

    return app