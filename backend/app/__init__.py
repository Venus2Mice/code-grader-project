from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from .config import Config

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Kích hoạt CORS
    CORS(app)

    db.init_app(app)

    from . import routes
    app.register_blueprint(routes.bp)

    return app