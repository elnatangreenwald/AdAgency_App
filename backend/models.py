"""
Database Models
Contains the User class and user loader for Flask-Login
"""
from flask_login import UserMixin


class User(UserMixin):
    """User model for Flask-Login"""
    
    def __init__(self, id):
        from backend.utils.helpers import load_users
        self.id = id
        users = load_users()
        self.name = users[id]['name'] if id in users else "Unknown"
        self.role = users[id].get('role', 'עובד') if id in users else 'עובד'


def load_user(user_id):
    """Load user by ID for Flask-Login - used by login_manager"""
    from backend.utils.helpers import load_users
    users = load_users()
    return User(user_id) if user_id in users else None


def setup_user_loader(login_manager):
    """Setup the user loader with the login manager"""
    @login_manager.user_loader
    def user_loader(user_id):
        return load_user(user_id)
