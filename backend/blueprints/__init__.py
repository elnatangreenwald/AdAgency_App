# Blueprints package
from .auth import auth_bp
from .api import api_bp
from .clients import clients_bp
from .finance import finance_bp
from .events import events_bp
from .suppliers import suppliers_bp
from .quotes import quotes_bp
from .chat import chat_bp
from .admin import admin_bp
from .time_tracking import time_tracking_bp

__all__ = [
    'auth_bp',
    'api_bp',
    'clients_bp',
    'finance_bp',
    'events_bp',
    'suppliers_bp',
    'quotes_bp',
    'chat_bp',
    'admin_bp',
    'time_tracking_bp',
]


def register_blueprints(app):
    """Register all blueprints with the Flask app"""
    app.register_blueprint(auth_bp)
    app.register_blueprint(api_bp)
    app.register_blueprint(clients_bp)
    app.register_blueprint(finance_bp)
    app.register_blueprint(events_bp)
    app.register_blueprint(suppliers_bp)
    app.register_blueprint(quotes_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(time_tracking_bp)
