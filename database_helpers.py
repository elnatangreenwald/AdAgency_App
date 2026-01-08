"""
Database helper functions that replace JSON load/save functions
These functions maintain the same interface as the original JSON functions
but use PostgreSQL instead
"""
import os
import json
from werkzeug.security import generate_password_hash
from database import (
    get_db, User, Client, Supplier, Quote, Message, Event,
    Equipment, ChecklistTemplate, Form, Permission, UserActivity
)

# Check if we should use database or JSON files
USE_DATABASE = os.environ.get('USE_DATABASE', 'false').lower() == 'true'

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
    """Load users from database or JSON file"""
    if not USE_DATABASE:
        # Fallback to JSON (original behavior)
        files = _get_file_paths()
        USERS_FILE = files['USERS_FILE']
        if not os.path.exists(USERS_FILE):
            u = {'admin': {'password': generate_password_hash('1234'), 'name': 'מנהל המשרד', 'role': 'אדמין'}}
            with open(USERS_FILE, 'w', encoding='utf-8') as f:
                json.dump(u, f, ensure_ascii=False, indent=4)
            return u
        users = {}
        with open(USERS_FILE, 'r', encoding='utf-8') as f:
            users = json.load(f)
        # Ensure roles exist
        needs_update = False
        for uid, user_info in users.items():
            if 'role' not in user_info:
                user_info['role'] = 'עובד' if uid != 'admin' else 'אדמין'
                needs_update = True
        if needs_update:
            save_users(users)
        return users
    
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
    """Save users to database or JSON file"""
    if not USE_DATABASE:
        files = _get_file_paths()
        USERS_FILE = files['USERS_FILE']
        with open(USERS_FILE, 'w', encoding='utf-8') as f:
            json.dump(users, f, ensure_ascii=False, indent=4)
        return
    
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

def load_data():
    """Load clients data from database or JSON file"""
    if not USE_DATABASE:
        files = _get_file_paths()
        DATA_FILE = files['DATA_FILE']
        if not os.path.exists(DATA_FILE) or os.stat(DATA_FILE).st_size == 0:
            return []
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        if not data:
            return data
        # Note: assign_client_numbers logic would need to be imported or duplicated
        # For now, we'll skip that check in JSON mode to avoid circular import
        return data
    
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
    """Save clients data to database or JSON file"""
    if not USE_DATABASE:
        files = _get_file_paths()
        DATA_FILE = files['DATA_FILE']
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        return
    
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
                client.calculated_extra = client_data.get('calculated_extra', 0)
                client.calculated_retainer = client_data.get('calculated_retainer', 0)
                client.calculated_total = client_data.get('calculated_total', 0)
                client.calculated_open_charges = client_data.get('calculated_open_charges', 0)
                client.calculated_monthly_revenue = client_data.get('calculated_monthly_revenue', 0)
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
    """Load suppliers from database or JSON file"""
    if not USE_DATABASE:
        files = _get_file_paths()
        SUPPLIERS_FILE = files['SUPPLIERS_FILE']
        if not os.path.exists(SUPPLIERS_FILE) or os.stat(SUPPLIERS_FILE).st_size == 0:
            return []
        with open(SUPPLIERS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    
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
    """Save suppliers to database or JSON file"""
    if not USE_DATABASE:
        files = _get_file_paths()
        SUPPLIERS_FILE = files['SUPPLIERS_FILE']
        with open(SUPPLIERS_FILE, 'w', encoding='utf-8') as f:
            json.dump(suppliers, f, ensure_ascii=False, indent=4)
        return
    
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
    """Load quotes from database or JSON file"""
    if not USE_DATABASE:
        files = _get_file_paths()
        QUOTES_FILE = files['QUOTES_FILE']
        if not os.path.exists(QUOTES_FILE) or os.stat(QUOTES_FILE).st_size == 0:
            return []
        with open(QUOTES_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    
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
    """Save quotes to database or JSON file"""
    if not USE_DATABASE:
        files = _get_file_paths()
        QUOTES_FILE = files['QUOTES_FILE']
        with open(QUOTES_FILE, 'w', encoding='utf-8') as f:
            json.dump(quotes, f, ensure_ascii=False, indent=4)
        return
    
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
    """Load messages from database or JSON file"""
    if not USE_DATABASE:
        files = _get_file_paths()
        MESSAGES_FILE = files['MESSAGES_FILE']
        if not os.path.exists(MESSAGES_FILE) or os.stat(MESSAGES_FILE).st_size == 0:
            return []
        with open(MESSAGES_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    
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
    """Save messages to database or JSON file"""
    if not USE_DATABASE:
        files = _get_file_paths()
        MESSAGES_FILE = files['MESSAGES_FILE']
        with open(MESSAGES_FILE, 'w', encoding='utf-8') as f:
            json.dump(messages, f, ensure_ascii=False, indent=4)
        return
    
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
    """Load events from database or JSON file"""
    if not USE_DATABASE:
        files = _get_file_paths()
        EVENTS_FILE = files['EVENTS_FILE']
        if not os.path.exists(EVENTS_FILE) or os.stat(EVENTS_FILE).st_size == 0:
            return []
        with open(EVENTS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    
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
    """Save events to database or JSON file"""
    if not USE_DATABASE:
        files = _get_file_paths()
        EVENTS_FILE = files['EVENTS_FILE']
        with open(EVENTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(events, f, ensure_ascii=False, indent=4)
        return
    
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
    """Load equipment from database or JSON file"""
    if not USE_DATABASE:
        files = _get_file_paths()
        EQUIPMENT_BANK_FILE = files['EQUIPMENT_BANK_FILE']
        if not os.path.exists(EQUIPMENT_BANK_FILE) or os.stat(EQUIPMENT_BANK_FILE).st_size == 0:
            default_equipment = [
                'מקרן', 'הגברה', 'מיקרופון', 'מסך/פליפ-צ\'ארט', 'שולחן', 'כסאות', 
                'מתנות לאורחים', 'רול-אפים', 'באנרים', 'פלטה/במה', 'תאורה', 'שולחן עגול'
            ]
            save_equipment_bank(default_equipment)
            return default_equipment
        with open(EQUIPMENT_BANK_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    
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
    """Save equipment to database or JSON file"""
    if not USE_DATABASE:
        files = _get_file_paths()
        EQUIPMENT_BANK_FILE = files['EQUIPMENT_BANK_FILE']
        with open(EQUIPMENT_BANK_FILE, 'w', encoding='utf-8') as f:
            json.dump(equipment, f, ensure_ascii=False, indent=4)
        return
    
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
    """Load checklist templates from database or JSON file"""
    if not USE_DATABASE:
        files = _get_file_paths()
        CHECKLIST_TEMPLATES_FILE = files['CHECKLIST_TEMPLATES_FILE']
        if not os.path.exists(CHECKLIST_TEMPLATES_FILE) or os.stat(CHECKLIST_TEMPLATES_FILE).st_size == 0:
            default_templates = {
                'כנס': [
                    'הזמנת קייטרינג', 'עיצוב רול-אפים', 'שליחת Save the date',
                    'הזמנת הגברה ותאורה', 'הזמנת מקרן ומסך', 'הזמנת מקומות ישיבה',
                    'אישור מיקום', 'הזמנת צלמים/וידאו', 'הכנת מצגות', 'הזמנת מתנות למשתתפים'
                ],
                'חתונה': [
                    'אישור אולם', 'הזמנת קייטרינג', 'הזמנת הגברה ודי.ג\'יי',
                    'הזמנת צלמים/וידאו', 'הזמנת פרחים ועיצוב', 'הזמנת בוקונז\'ה/מתנות לאורחים',
                    'הזמנת שולחנות וכסאות', 'הזמנת מתנות לחתן וכלה', 'אישור תאריכים עם כל הספקים', 'שליחת הזמנות'
                ],
                'השקה': [
                    'אישור מיקום', 'הזמנת קייטרינג/קפה', 'עיצוב חומרי שיווק',
                    'הזמנת הגברה', 'הזמנת צלמים/וידאו', 'שליחת הזמנות',
                    'הכנת מצגת/סרטון', 'הזמנת מתנות למשתתפים', 'הזמנת פרחים/עיצוב', 'אישור תאריכים'
                ]
            }
            save_checklist_templates(default_templates)
            return default_templates
        with open(CHECKLIST_TEMPLATES_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    
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
    """Save checklist templates to database or JSON file"""
    if not USE_DATABASE:
        files = _get_file_paths()
        CHECKLIST_TEMPLATES_FILE = files['CHECKLIST_TEMPLATES_FILE']
        with open(CHECKLIST_TEMPLATES_FILE, 'w', encoding='utf-8') as f:
            json.dump(templates, f, ensure_ascii=False, indent=4)
        return
    
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
    """Load forms from database or JSON file"""
    if not USE_DATABASE:
        files = _get_file_paths()
        FORMS_FILE = files['FORMS_FILE']
        if not os.path.exists(FORMS_FILE) or os.stat(FORMS_FILE).st_size == 0:
            return []
        with open(FORMS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    
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
    """Save forms to database or JSON file"""
    if not USE_DATABASE:
        files = _get_file_paths()
        FORMS_FILE = files['FORMS_FILE']
        with open(FORMS_FILE, 'w', encoding='utf-8') as f:
            json.dump(forms, f, ensure_ascii=False, indent=4)
        return
    
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

