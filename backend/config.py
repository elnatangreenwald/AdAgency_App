"""
Application Configuration
Contains all configuration settings for the Flask application
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Base directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Check if running in production (Railway)
IS_PRODUCTION = bool(os.environ.get('RAILWAY_ENVIRONMENT') or os.environ.get('PORT'))

# Use database helpers if USE_DATABASE is enabled
USE_DATABASE = os.environ.get('USE_DATABASE', 'false').lower() == 'true'


class Config:
    """Base configuration"""
    
    # Flask core
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'vatkin_master_final_v100_CHANGE_IN_PRODUCTION'
    
    # Session configuration
    PERMANENT_SESSION_LIFETIME = timedelta(hours=24)
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_SECURE = IS_PRODUCTION
    
    # File paths
    STATIC_FOLDER = os.path.join(BASE_DIR, 'static')
    LOGOS_FOLDER = os.path.join(BASE_DIR, 'static', 'logos')
    DOCUMENTS_FOLDER = os.path.join(BASE_DIR, 'static', 'documents')
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'client_docs')
    FORMS_UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'forms_uploads')
    CHAT_FILES_FOLDER = os.path.join(BASE_DIR, 'static', 'chat_files')
    SUPPLIER_FILES_FOLDER = os.path.join(BASE_DIR, 'static', 'supplier_files')
    
    # Data files
    DATA_FILE = os.path.join(BASE_DIR, 'agency_db.json')
    USERS_FILE = os.path.join(BASE_DIR, 'users_db.json')
    SUPPLIERS_FILE = os.path.join(BASE_DIR, 'suppliers_db.json')
    QUOTES_FILE = os.path.join(BASE_DIR, 'quotes_db.json')
    MESSAGES_FILE = os.path.join(BASE_DIR, 'messages_db.json')
    EVENTS_FILE = os.path.join(BASE_DIR, 'events_db.json')
    EQUIPMENT_BANK_FILE = os.path.join(BASE_DIR, 'equipment_bank.json')
    CHECKLIST_TEMPLATES_FILE = os.path.join(BASE_DIR, 'checklist_templates.json')
    FORMS_FILE = os.path.join(BASE_DIR, 'forms_db.json')
    PERMISSIONS_FILE = os.path.join(BASE_DIR, 'permissions_db.json')
    USER_ACTIVITY_FILE = os.path.join(BASE_DIR, 'user_activity.json')
    ACTIVITY_LOGS_FILE = os.path.join(BASE_DIR, 'activity_logs.json')
    TIME_TRACKING_FILE = os.path.join(BASE_DIR, 'time_tracking.json')
    NOTIFICATIONS_FILE = os.path.join(BASE_DIR, 'notifications_db.json')
    
    # Rate limiting
    RATELIMIT_DEFAULT = ["200 per day", "50 per hour"]
    RATELIMIT_STORAGE_URI = "memory://"
    
    # Email configuration
    SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
    SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
    SMTP_USERNAME = os.environ.get('SMTP_USERNAME')
    SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD')


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    SESSION_COOKIE_SECURE = False


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    SESSION_COOKIE_SECURE = True


# Select config based on environment
config = ProductionConfig if IS_PRODUCTION else DevelopmentConfig
