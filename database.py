"""
Database models and connection for PostgreSQL
Uses SQLAlchemy ORM with JSONB for complex nested data structures
"""
import os
import json
from datetime import datetime
from sqlalchemy import create_engine, Column, String, Integer, Text, DateTime, JSON, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.dialects.postgresql import JSONB
from dotenv import load_dotenv

load_dotenv()

Base = declarative_base()

# Database connection
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL and DATABASE_URL.startswith('postgres://'):
    # Railway uses postgres:// but SQLAlchemy needs postgresql://
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

if not DATABASE_URL:
    # Fallback to local PostgreSQL for development
    DATABASE_URL = os.environ.get('POSTGRES_URL', 'postgresql://localhost/adagency')

engine = create_engine(DATABASE_URL, pool_pre_ping=True, echo=False)
SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        return db
    finally:
        pass  # Don't close here, let the caller manage it

def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)

# Models
class User(Base):
    __tablename__ = 'users'
    
    user_id = Column(String, primary_key=True)
    password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default='עובד')
    email = Column(String)
    google_id = Column(String)
    google_credentials = Column(Text)  # Base64 encoded
    email_password = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Client(Base):
    __tablename__ = 'clients'
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    client_number = Column(Integer)
    retainer = Column(Integer, default=0)
    extra_charges = Column(JSONB)  # List of charges
    projects = Column(JSONB)  # List of projects with nested tasks
    assigned_user = Column(JSONB)  # Can be string or list
    files = Column(JSONB, default=[])
    contacts = Column(JSONB, default=[])
    logo_url = Column(String)
    active = Column(Boolean, default=True)
    archived = Column(Boolean, default=False)
    archived_at = Column(String, nullable=True)
    calculated_extra = Column(Integer, default=0)
    calculated_retainer = Column(Integer, default=0)
    calculated_total = Column(Integer, default=0)
    calculated_open_charges = Column(Integer, default=0)
    calculated_monthly_revenue = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Supplier(Base):
    __tablename__ = 'suppliers'
    
    id = Column(String, primary_key=True)
    data = Column(JSONB)  # Full supplier data as JSON
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Quote(Base):
    __tablename__ = 'quotes'
    
    id = Column(String, primary_key=True)
    data = Column(JSONB)  # Full quote data as JSON
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Message(Base):
    __tablename__ = 'messages'
    
    id = Column(String, primary_key=True)
    data = Column(JSONB)  # Full message data as JSON
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Event(Base):
    __tablename__ = 'events'
    
    id = Column(String, primary_key=True)
    data = Column(JSONB)  # Full event data as JSON
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Equipment(Base):
    __tablename__ = 'equipment'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ChecklistTemplate(Base):
    __tablename__ = 'checklist_templates'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    category = Column(String, nullable=False)
    items = Column(JSONB)  # List of items
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Form(Base):
    __tablename__ = 'forms'
    
    id = Column(String, primary_key=True)
    data = Column(JSONB)  # Full form data as JSON
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Permission(Base):
    __tablename__ = 'permissions'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False)
    permission_type = Column(String, nullable=False)
    resource_id = Column(String)
    granted = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserActivity(Base):
    __tablename__ = 'user_activity'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False)
    activity = Column(JSONB)  # Activity data as JSON
    created_at = Column(DateTime, default=datetime.utcnow)

class TimeTrackingEntry(Base):
    __tablename__ = 'time_tracking_entries'
    
    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=False)
    client_id = Column(String, nullable=False)
    project_id = Column(String)
    task_id = Column(String)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime)
    duration_hours = Column(String)  # Store as string to preserve decimal precision
    note = Column(Text)
    date = Column(String)  # YYYY-MM-DD format
    manual_entry = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class TimeTrackingActiveSession(Base):
    __tablename__ = 'time_tracking_active_sessions'
    
    user_id = Column(String, primary_key=True)
    session_id = Column(String, nullable=False)
    client_id = Column(String, nullable=False)
    project_id = Column(String)
    task_id = Column(String)
    start_time = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

