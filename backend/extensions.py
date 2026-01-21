"""
Flask Extensions
Contains all Flask extension instances that are initialized with the app
"""
from flask_login import LoginManager
from flask_wtf.csrf import CSRFProtect
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Login manager
login_manager = LoginManager()
login_manager.login_view = 'auth.login'

# CSRF protection
csrf = CSRFProtect()

# Rate limiter
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)


def init_extensions(app):
    """Initialize all extensions with the Flask app"""
    login_manager.init_app(app)
    csrf.init_app(app)
    limiter.init_app(app)
