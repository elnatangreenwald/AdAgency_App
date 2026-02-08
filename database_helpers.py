"""
Database helper functions that replace JSON load/save functions
These functions maintain the same interface as the original JSON functions
but use PostgreSQL instead
"""
import os
import json
from werkzeug.security import generate_password_hash
from sqlalchemy.orm.attributes import flag_modified
from database import (
    get_db, User, Client, Supplier, Quote, Message, Event,
    Equipment, ChecklistTemplate, Form, Permission, UserActivity,
    TimeTrackingEntry, TimeTrackingActiveSession
)
from datetime import datetime

# This module is only imported when USE_DATABASE=true in app.py
# So we always use the database here

# Import file paths from app module (safe, no circular import)
def _get_file_paths():
    """Get file paths - avoids circular import"""
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    return {
        'USERS_FILE': os.path.join(BASE_DIR, 'users_db.json'),
        'DATA_FILE': os.path.join(BASE_DIR, 'agency_db.json'),
        'SUPPLIERS_FILE': os.path.join(BASE_DIR, 'suppliers_db.json'),
        'QUOTES_FILE': os.path.join(BASE_DIR, 'quotes_db.json'),
        'MESSAGES_FILE': os.path.join(BASE_DIR, 'messages_db.json'),
        'EVENTS_FILE': os.path.join(BASE_DIR, 'events_db.json'),
        'EQUIPMENT_BANK_FILE': os.path.join(BASE_DIR, 'equipment_bank.json'),
        'CHECKLIST_TEMPLATES_FILE': os.path.join(BASE_DIR, 'checklist_templates.json'),
        'FORMS_FILE': os.path.join(BASE_DIR, 'forms_db.json'),
    }

def load_users():
    """Load users from database"""
    db = get_db()
    try:
        users = {}
        db_users = db.query(User).all()
        for user in db_users:
            users[user.user_id] = {
                'password': user.password,
                'name': user.name,
                'role': user.role or 'עובד',
                'email': user.email,
                'google_id': user.google_id,
                'google_credentials': user.google_credentials,
                'email_password': user.email_password
            }
        
        # Ensure admin user exists
        if 'admin' not in users:
            admin = User(
                user_id='admin',
                password=generate_password_hash('1234'),
                name='מנהל המשרד',
                role='אדמין'
            )
            db.add(admin)
            db.commit()
            users['admin'] = {
                'password': admin.password,
                'name': admin.name,
                'role': admin.role
            }
        
        return users
    finally:
        db.close()

def save_users(users):
    """Save users to database"""
    db = get_db()
    try:
        for user_id, user_data in users.items():
            user = db.query(User).filter(User.user_id == user_id).first()
            if user:
                user.password = user_data.get('password', user.password)
                user.name = user_data.get('name', user.name)
                user.role = user_data.get('role', user.role)
                user.email = user_data.get('email')
                user.google_id = user_data.get('google_id')
                user.google_credentials = user_data.get('google_credentials')
                user.email_password = user_data.get('email_password')
            else:
                user = User(
                    user_id=user_id,
                    password=user_data.get('password', ''),
                    name=user_data.get('name', ''),
                    role=user_data.get('role', 'עובד'),
                    email=user_data.get('email'),
                    google_id=user_data.get('google_id'),
                    google_credentials=user_data.get('google_credentials'),
                    email_password=user_data.get('email_password')
                )
                db.add(user)
        db.commit()
    finally:
        db.close()

def delete_user_record(user_id):
    """Delete a user record from the database."""
    db = get_db()
    try:
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            return False
        db.delete(user)
        db.commit()
        return True
    finally:
        db.close()

def load_data():
    """Load clients data from database"""
    db = get_db()
    try:
        clients = []
        db_clients = db.query(Client).all()
        for client in db_clients:
            client_dict = {
                'id': client.id,
                'name': client.name,
                'client_number': client.client_number,
                'retainer': client.retainer or 0,
                'extra_charges': client.extra_charges or [],
                'projects': client.projects or [],
                'assigned_user': client.assigned_user,
                'files': client.files or [],
                'contacts': client.contacts or [],
                'logo_url': client.logo_url,
                'active': client.active if client.active is not None else True,
                'archived': client.archived if client.archived is not None else False,
                'archived_at': client.archived_at,
                'calculated_extra': client.calculated_extra or 0,
                'calculated_retainer': client.calculated_retainer or 0,
                'calculated_total': client.calculated_total or 0,
                'calculated_open_charges': client.calculated_open_charges or 0,
                'calculated_monthly_revenue': client.calculated_monthly_revenue or 0
            }
            clients.append(client_dict)
        
        # Ensure client numbers are assigned (if any are missing)
        needs_update = False
        for client in clients:
            if 'client_number' not in client or not client.get('client_number'):
                needs_update = True
                break
        
        if needs_update:
            # Assign client numbers
            max_number = 0
            for client in clients:
                if 'client_number' in client and client.get('client_number'):
                    try:
                        num = int(client['client_number'])
                        if num > max_number:
                            max_number = num
                    except:
                        pass
            
            current_number = max_number + 1
            for client in clients:
                if 'client_number' not in client or not client.get('client_number'):
                    client['client_number'] = current_number
                    # Update in database
                    db_client = db.query(Client).filter(Client.id == client['id']).first()
                    if db_client:
                        db_client.client_number = current_number
                    current_number += 1
            
            if needs_update:
                db.commit()
        
        return clients
    finally:
        db.close()

def save_data(data):
    """Save clients data to database"""
    db = get_db()
    try:
        for client_data in data:
            client_id = client_data.get('id')
            if not client_id:
                continue
            
            client = db.query(Client).filter(Client.id == client_id).first()
            if client:
                client.name = client_data.get('name', client.name)
                client.client_number = client_data.get('client_number')
                client.retainer = client_data.get('retainer', 0)
                client.extra_charges = client_data.get('extra_charges', [])
                client.projects = client_data.get('projects', [])
                client.assigned_user = client_data.get('assigned_user')
                client.files = client_data.get('files', [])
                client.contacts = client_data.get('contacts', [])
                client.logo_url = client_data.get('logo_url')
                client.active = client_data.get('active', True)
                client.archived = client_data.get('archived', False)
                client.archived_at = client_data.get('archived_at')
                client.calculated_extra = client_data.get('calculated_extra', 0)
                client.calculated_retainer = client_data.get('calculated_retainer', 0)
                client.calculated_total = client_data.get('calculated_total', 0)
                client.calculated_open_charges = client_data.get('calculated_open_charges', 0)
                client.calculated_monthly_revenue = client_data.get('calculated_monthly_revenue', 0)
                # Flag JSONB fields so SQLAlchemy detects in-place changes (e.g. deletions)
                flag_modified(client, 'extra_charges')
                flag_modified(client, 'projects')
                flag_modified(client, 'assigned_user')
                flag_modified(client, 'files')
                flag_modified(client, 'contacts')
            else:
                client = Client(
                    id=client_id,
                    name=client_data.get('name', ''),
                    client_number=client_data.get('client_number'),
                    retainer=client_data.get('retainer', 0),
                    extra_charges=client_data.get('extra_charges', []),
                    projects=client_data.get('projects', []),
                    assigned_user=client_data.get('assigned_user'),
                    files=client_data.get('files', []),
                    contacts=client_data.get('contacts', []),
                    logo_url=client_data.get('logo_url'),
                    active=client_data.get('active', True),
                    archived=client_data.get('archived', False),
                    archived_at=client_data.get('archived_at'),
                    calculated_extra=client_data.get('calculated_extra', 0),
                    calculated_retainer=client_data.get('calculated_retainer', 0),
                    calculated_total=client_data.get('calculated_total', 0),
                    calculated_open_charges=client_data.get('calculated_open_charges', 0),
                    calculated_monthly_revenue=client_data.get('calculated_monthly_revenue', 0)
                )
                db.add(client)
        db.commit()
    finally:
        db.close()

def load_suppliers():
    """Load suppliers from database"""
    db = get_db()
    try:
        suppliers = []
        db_suppliers = db.query(Supplier).all()
        for supplier in db_suppliers:
            suppliers.append(supplier.data)
        return suppliers
    finally:
        db.close()

def save_suppliers(suppliers):
    """Save suppliers to database"""
    db = get_db()
    try:
        for supplier_data in suppliers:
            supplier_id = supplier_data.get('id')
            if not supplier_id:
                continue
            
            supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
            if supplier:
                supplier.data = supplier_data
            else:
                supplier = Supplier(id=supplier_id, data=supplier_data)
                db.add(supplier)
        db.commit()
    finally:
        db.close()

def load_quotes():
    """Load quotes from database"""
    db = get_db()
    try:
        quotes = []
        db_quotes = db.query(Quote).all()
        for quote in db_quotes:
            quotes.append(quote.data)
        return quotes
    finally:
        db.close()

def save_quotes(quotes):
    """Save quotes to database"""
    db = get_db()
    try:
        for quote_data in quotes:
            quote_id = quote_data.get('id')
            if not quote_id:
                continue
            
            quote = db.query(Quote).filter(Quote.id == quote_id).first()
            if quote:
                quote.data = quote_data
            else:
                quote = Quote(id=quote_id, data=quote_data)
                db.add(quote)
        db.commit()
    finally:
        db.close()

def load_messages():
    """Load messages from database"""
    db = get_db()
    try:
        messages = []
        db_messages = db.query(Message).all()
        for message in db_messages:
            messages.append(message.data)
        return messages
    finally:
        db.close()

def save_messages(messages):
    """Save messages to database"""
    db = get_db()
    try:
        for message_data in messages:
            message_id = message_data.get('id')
            if not message_id:
                continue
            
            message = db.query(Message).filter(Message.id == message_id).first()
            if message:
                message.data = message_data
            else:
                message = Message(id=message_id, data=message_data)
                db.add(message)
        db.commit()
    finally:
        db.close()

def load_events():
    """Load events from database"""
    db = get_db()
    try:
        events = []
        db_events = db.query(Event).all()
        for event in db_events:
            events.append(event.data)
        return events
    finally:
        db.close()

def save_events(events):
    """Save events to database"""
    db = get_db()
    try:
        for event_data in events:
            event_id = event_data.get('id')
            if not event_id:
                continue
            
            event = db.query(Event).filter(Event.id == event_id).first()
            if event:
                event.data = event_data
            else:
                event = Event(id=event_id, data=event_data)
                db.add(event)
        db.commit()
    finally:
        db.close()

def load_equipment_bank():
    """Load equipment from database"""
    db = get_db()
    try:
        equipment = []
        db_equipment = db.query(Equipment).all()
        if not db_equipment:
            # Create default equipment
            default_equipment = [
                'מקרן', 'הגברה', 'מיקרופון', 'מסך/פליפ-צ\'ארט', 'שולחן', 'כסאות', 
                'מתנות לאורחים', 'רול-אפים', 'באנרים', 'פלטה/במה', 'תאורה', 'שולחן עגול'
            ]
            for name in default_equipment:
                eq = Equipment(name=name)
                db.add(eq)
            db.commit()
            return default_equipment
        
        for eq in db_equipment:
            equipment.append(eq.name)
        return equipment
    finally:
        db.close()

def save_equipment_bank(equipment):
    """Save equipment to database"""
    db = get_db()
    try:
        # Clear existing equipment
        db.query(Equipment).delete()
        # Add new equipment
        for name in equipment:
            eq = Equipment(name=name)
            db.add(eq)
        db.commit()
    finally:
        db.close()

def load_checklist_templates():
    """Load checklist templates from database"""
    db = get_db()
    try:
        templates = {}
        db_templates = db.query(ChecklistTemplate).all()
        if not db_templates:
            # Create default templates
            from app import load_checklist_templates as json_load_templates
            default_templates = json_load_templates()
            for category, items in default_templates.items():
                template = ChecklistTemplate(category=category, items=items)
                db.add(template)
            db.commit()
            return default_templates
        
        for template in db_templates:
            templates[template.category] = template.items
        return templates
    finally:
        db.close()

def save_checklist_templates(templates):
    """Save checklist templates to database"""
    db = get_db()
    try:
        for category, items in templates.items():
            template = db.query(ChecklistTemplate).filter(ChecklistTemplate.category == category).first()
            if template:
                template.items = items
            else:
                template = ChecklistTemplate(category=category, items=items)
                db.add(template)
        db.commit()
    finally:
        db.close()

def load_forms():
    """Load forms from database"""
    db = get_db()
    try:
        forms = []
        db_forms = db.query(Form).all()
        for form in db_forms:
            forms.append(form.data)
        return forms
    finally:
        db.close()

def save_forms(forms):
    """Save forms to database"""
    db = get_db()
    try:
        for form_data in forms:
            form_id = form_data.get('id') or form_data.get('token')
            if not form_id:
                continue
            
            form = db.query(Form).filter(Form.id == form_id).first()
            if form:
                form.data = form_data
            else:
                form = Form(id=form_id, data=form_data)
                db.add(form)
        db.commit()
    finally:
        db.close()

# ============ Time Tracking Functions ============

def _parse_datetime(dt_str):
    """Parse datetime string to datetime object"""
    if not dt_str:
        return None
    if isinstance(dt_str, datetime):
        return dt_str
    # Try different formats
    for fmt in ['%Y-%m-%dT%H:%M:%S.%fZ', '%Y-%m-%dT%H:%M:%S.%f', '%Y-%m-%dT%H:%M:%SZ', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%dT%H:%M']:
        try:
            return datetime.strptime(dt_str.replace('+00:00', '').replace('Z', ''), fmt.replace('Z', ''))
        except:
            continue
    return None

def load_time_tracking():
    """Load time tracking data from database"""
    db = get_db()
    try:
        result = {'entries': [], 'active_sessions': {}}
        
        # Load entries
        db_entries = db.query(TimeTrackingEntry).all()
        for entry in db_entries:
            entry_dict = {
                'id': entry.id,
                'user_id': entry.user_id,
                'client_id': entry.client_id,
                'project_id': entry.project_id,
                'task_id': entry.task_id,
                'start_time': entry.start_time.isoformat() if entry.start_time else None,
                'end_time': entry.end_time.isoformat() if entry.end_time else None,
                'duration_hours': float(entry.duration_hours) if entry.duration_hours else 0,
                'note': entry.note or '',
                'date': entry.date,
                'manual_entry': entry.manual_entry or False
            }
            result['entries'].append(entry_dict)
        
        # Load active sessions
        db_sessions = db.query(TimeTrackingActiveSession).all()
        for session in db_sessions:
            result['active_sessions'][session.user_id] = {
                'id': session.session_id,
                'user_id': session.user_id,
                'client_id': session.client_id,
                'project_id': session.project_id,
                'task_id': session.task_id,
                'start_time': session.start_time.isoformat() if session.start_time else None
            }
        
        return result
    finally:
        db.close()

def save_time_tracking(data):
    """Save time tracking data to database"""
    db = get_db()
    try:
        # Save entries
        entries = data.get('entries', [])
        existing_ids = set()
        
        for entry_data in entries:
            entry_id = entry_data.get('id')
            if not entry_id:
                continue
            existing_ids.add(entry_id)
            
            entry = db.query(TimeTrackingEntry).filter(TimeTrackingEntry.id == entry_id).first()
            
            start_time = _parse_datetime(entry_data.get('start_time'))
            end_time = _parse_datetime(entry_data.get('end_time'))
            
            if entry:
                entry.user_id = entry_data.get('user_id', entry.user_id)
                entry.client_id = entry_data.get('client_id', entry.client_id)
                entry.project_id = entry_data.get('project_id')
                entry.task_id = entry_data.get('task_id')
                entry.start_time = start_time
                entry.end_time = end_time
                entry.duration_hours = str(entry_data.get('duration_hours', 0))
                entry.note = entry_data.get('note', '')
                entry.date = entry_data.get('date')
                entry.manual_entry = entry_data.get('manual_entry', False)
            else:
                entry = TimeTrackingEntry(
                    id=entry_id,
                    user_id=entry_data.get('user_id'),
                    client_id=entry_data.get('client_id'),
                    project_id=entry_data.get('project_id'),
                    task_id=entry_data.get('task_id'),
                    start_time=start_time,
                    end_time=end_time,
                    duration_hours=str(entry_data.get('duration_hours', 0)),
                    note=entry_data.get('note', ''),
                    date=entry_data.get('date'),
                    manual_entry=entry_data.get('manual_entry', False)
                )
                db.add(entry)
        
        # Delete entries that are no longer in the data
        db_entries = db.query(TimeTrackingEntry).all()
        for db_entry in db_entries:
            if db_entry.id not in existing_ids:
                db.delete(db_entry)
        
        # Save active sessions
        active_sessions = data.get('active_sessions', {})
        
        # Clear all existing sessions first
        db.query(TimeTrackingActiveSession).delete()
        
        # Add current sessions
        for user_id, session_data in active_sessions.items():
            start_time = _parse_datetime(session_data.get('start_time'))
            session = TimeTrackingActiveSession(
                user_id=user_id,
                session_id=session_data.get('id', ''),
                client_id=session_data.get('client_id'),
                project_id=session_data.get('project_id'),
                task_id=session_data.get('task_id'),
                start_time=start_time
            )
            db.add(session)
        
        db.commit()
    finally:
        db.close()

