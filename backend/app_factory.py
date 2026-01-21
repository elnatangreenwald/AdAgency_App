"""
Flask Application Factory
Creates and configures the Flask application using the modular blueprint structure.

Usage:
    # For production (Railway)
    from backend.app_factory import create_app
    app = create_app()
    
    # For development
    if __name__ == '__main__':
        app = create_app()
        app.run(debug=True)
"""
import os
import sys
from flask import Flask, redirect, send_from_directory

# Fix encoding for Windows
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except:
        pass


def create_app(config_name=None):
    """Application factory for creating Flask app instances"""
    
    # Create Flask app
    app = Flask(__name__, 
                static_folder='../static',
                template_folder='../templates')
    
    # Load configuration
    from backend.config import config, BASE_DIR, IS_PRODUCTION
    
    app.config.from_object(config)
    app.secret_key = config.SECRET_KEY
    
    # Configure upload folder
    app.config['UPLOAD_FOLDER'] = config.UPLOAD_FOLDER
    
    # Ensure required directories exist
    directories = [
        config.STATIC_FOLDER,
        config.LOGOS_FOLDER,
        config.DOCUMENTS_FOLDER,
        config.UPLOAD_FOLDER,
        config.FORMS_UPLOAD_FOLDER,
        config.CHAT_FILES_FOLDER,
        config.SUPPLIER_FILES_FOLDER,
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
    
    # Initialize extensions
    from backend.extensions import init_extensions, login_manager
    init_extensions(app)
    
    # Setup user loader
    from backend.models import setup_user_loader
    setup_user_loader(login_manager)
    
    # Register blueprints
    from backend.blueprints import register_blueprints
    register_blueprints(app)
    
    # React build directory
    REACT_BUILD_DIR = os.path.join(BASE_DIR, 'static', 'dist')
    
    # Serve React assets
    @app.route('/assets/<path:filename>')
    def serve_react_assets(filename):
        return send_from_directory(os.path.join(REACT_BUILD_DIR, 'assets'), filename)
    
    # Serve React app
    @app.route('/app')
    @app.route('/app/<path:path>')
    def serve_react_app(path=''):
        return send_from_directory(REACT_BUILD_DIR, 'index.html')
    
    # Home route - redirect to React app
    @app.route('/')
    def home():
        return redirect('/app')
    
    # Context processor for sidebar data
    @app.context_processor
    def inject_sidebar_data():
        from backend.utils.helpers import load_users
        users = load_users()
        sorted_users = dict(sorted(users.items(), key=lambda item: item[1]['name']))
        return dict(sidebar_users=sorted_users)
    
    return app


# For direct running
if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
