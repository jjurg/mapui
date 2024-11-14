from flask import Flask
from app.config import Config
from app.models.geo_data import db
from app.routes.map_routes import map_bp
from app.routes.api_routes import api_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize extensions
    db.init_app(app)
    
    # Register blueprints
    app.register_blueprint(map_bp)
    app.register_blueprint(api_bp, url_prefix='/api')
    
    return app
