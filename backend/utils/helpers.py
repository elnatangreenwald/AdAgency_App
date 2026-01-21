"""
Data Helpers
Contains functions for loading and saving data from JSON files
"""
import os
import json
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
from flask import current_app


def get_config():
    """Get config from current app or use default paths"""
    try:
        return current_app.config
    except RuntimeError:
        # Outside of app context - use direct paths
        from backend.config import Config
        return Config


def load_users():
    """Load users from JSON file"""
    config = get_config()
    users_file = getattr(config, 'USERS_FILE', None)
    if not users_file:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        users_file = os.path.join(base_dir, 'users_db.json')
    
    if not os.path.exists(users_file):
        # Create default admin user with hashed password
        u = {'admin': {'password': generate_password_hash('1234'), 'name': 'מנהל המשרד', 'role': 'אדמין'}}
        with open(users_file, 'w', encoding='utf-8') as f:
            json.dump(u, f, ensure_ascii=False, indent=4)
        return u
    
    with open(users_file, 'r', encoding='utf-8') as f:
        users = json.load(f)
    
    # Ensure all users have a role
    needs_update = False
    for uid, user_info in users.items():
        if 'role' not in user_info:
            user_info['role'] = 'עובד' if uid != 'admin' else 'אדמין'
            needs_update = True
    
    if needs_update:
        save_users(users)
    
    return users


def save_users(users):
    """Save users to JSON file"""
    config = get_config()
    users_file = getattr(config, 'USERS_FILE', None)
    if not users_file:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        users_file = os.path.join(base_dir, 'users_db.json')
    
    with open(users_file, 'w', encoding='utf-8') as f:
        json.dump(users, f, ensure_ascii=False, indent=4)


def load_data():
    """Load agency data (clients) from JSON file"""
    config = get_config()
    data_file = getattr(config, 'DATA_FILE', None)
    if not data_file:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        data_file = os.path.join(base_dir, 'agency_db.json')
    
    if not os.path.exists(data_file) or os.stat(data_file).st_size == 0:
        return []
    
    with open(data_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if not data:
        return data
    
    # Check if client numbers need to be assigned
    needs_update = False
    for client in data:
        if 'client_number' not in client:
            needs_update = True
            break
    
    if needs_update:
        assign_client_numbers(data)
    
    return data


def save_data(data):
    """Save agency data (clients) to JSON file"""
    config = get_config()
    data_file = getattr(config, 'DATA_FILE', None)
    if not data_file:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        data_file = os.path.join(base_dir, 'agency_db.json')
    
    with open(data_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)


def assign_client_numbers(clients):
    """Assign unique numbers to clients that don't have them"""
    max_number = 0
    for client in clients:
        if 'client_number' in client:
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
            current_number += 1
    
    save_data(clients)


def get_next_client_number():
    """Get the next client number"""
    data = load_data()
    if not data:
        return 1
    
    max_number = 0
    for client in data:
        if 'client_number' in client:
            try:
                num = int(client['client_number'])
                if num > max_number:
                    max_number = num
            except:
                pass
    
    return max_number + 1


def get_next_project_number(client):
    """Get the next project number for a specific client
    Format: 7 digits - 3 client digits + 4 project digits"""
    client_number = client.get('client_number', 1)
    try:
        client_num = int(client_number)
    except (ValueError, TypeError):
        client_num = 1
    
    max_project_seq = 0
    for project in client.get('projects', []):
        if 'project_number' in project:
            try:
                proj_num_str = str(project['project_number'])
                if len(proj_num_str) >= 4:
                    project_seq = int(proj_num_str[-4:])
                    if project_seq > max_project_seq:
                        max_project_seq = project_seq
            except (ValueError, TypeError):
                pass
    
    next_seq = max_project_seq + 1
    project_number = f"{client_num:03d}{next_seq:04d}"
    return project_number


def get_next_task_number(client, project):
    """Get the next task number for a specific project
    Format: 10 digits - 7 project digits + 3 task digits"""
    project_number = project.get('project_number', '')
    if not project_number:
        project_number = get_next_project_number(client)
        project['project_number'] = project_number
    
    max_task_seq = 0
    for task in project.get('tasks', []):
        if 'task_number' in task:
            try:
                task_num_str = str(task['task_number'])
                if len(task_num_str) >= 3:
                    task_seq = int(task_num_str[-3:])
                    if task_seq > max_task_seq:
                        max_task_seq = task_seq
            except (ValueError, TypeError):
                pass
    
    next_seq = max_task_seq + 1
    task_number = f"{project_number}{next_seq:03d}"
    return task_number


def get_next_charge_number(client):
    """Get the next charge number for a specific client
    Format: 7 digits - 3 client digits + 4 charge digits"""
    client_number = client.get('client_number', 1)
    try:
        client_num = int(client_number)
    except (ValueError, TypeError):
        client_num = 1
    
    max_charge_seq = 0
    for charge in client.get('extra_charges', []):
        if 'charge_number' in charge:
            try:
                charge_num_str = str(charge['charge_number'])
                if len(charge_num_str) >= 4:
                    charge_seq = int(charge_num_str[-4:])
                    if charge_seq > max_charge_seq:
                        max_charge_seq = charge_seq
            except (ValueError, TypeError):
                pass
    
    next_seq = max_charge_seq + 1
    charge_number = f"{client_num:03d}{next_seq:04d}"
    return charge_number


def get_next_workday(from_date=None):
    """Get the next workday (Sunday-Thursday in Israel)"""
    if from_date is None:
        from_date = datetime.now()
    
    day_of_week = from_date.weekday()
    israeli_day = (day_of_week + 1) % 7
    
    if israeli_day <= 4:  # Sunday to Thursday
        return from_date.replace(hour=0, minute=0, second=0, microsecond=0)
    elif israeli_day == 5:  # Friday - jump to Sunday
        return (from_date + timedelta(days=2)).replace(hour=0, minute=0, second=0, microsecond=0)
    else:  # Saturday - jump to Sunday
        return (from_date + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)


# Additional data loaders
def load_suppliers():
    """Load suppliers from JSON file"""
    config = get_config()
    suppliers_file = getattr(config, 'SUPPLIERS_FILE', None)
    if not suppliers_file:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        suppliers_file = os.path.join(base_dir, 'suppliers_db.json')
    
    if not os.path.exists(suppliers_file) or os.stat(suppliers_file).st_size == 0:
        return []
    with open(suppliers_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_suppliers(suppliers):
    """Save suppliers to JSON file"""
    config = get_config()
    suppliers_file = getattr(config, 'SUPPLIERS_FILE', None)
    if not suppliers_file:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        suppliers_file = os.path.join(base_dir, 'suppliers_db.json')
    
    with open(suppliers_file, 'w', encoding='utf-8') as f:
        json.dump(suppliers, f, ensure_ascii=False, indent=4)


def load_quotes():
    """Load quotes from JSON file"""
    config = get_config()
    quotes_file = getattr(config, 'QUOTES_FILE', None)
    if not quotes_file:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        quotes_file = os.path.join(base_dir, 'quotes_db.json')
    
    if not os.path.exists(quotes_file) or os.stat(quotes_file).st_size == 0:
        return []
    with open(quotes_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_quotes(quotes):
    """Save quotes to JSON file"""
    config = get_config()
    quotes_file = getattr(config, 'QUOTES_FILE', None)
    if not quotes_file:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        quotes_file = os.path.join(base_dir, 'quotes_db.json')
    
    with open(quotes_file, 'w', encoding='utf-8') as f:
        json.dump(quotes, f, ensure_ascii=False, indent=4)


def load_messages():
    """Load messages from JSON file"""
    config = get_config()
    messages_file = getattr(config, 'MESSAGES_FILE', None)
    if not messages_file:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        messages_file = os.path.join(base_dir, 'messages_db.json')
    
    if not os.path.exists(messages_file) or os.stat(messages_file).st_size == 0:
        return []
    with open(messages_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_messages(messages):
    """Save messages to JSON file"""
    config = get_config()
    messages_file = getattr(config, 'MESSAGES_FILE', None)
    if not messages_file:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        messages_file = os.path.join(base_dir, 'messages_db.json')
    
    with open(messages_file, 'w', encoding='utf-8') as f:
        json.dump(messages, f, ensure_ascii=False, indent=4)


def load_events():
    """Load events from JSON file"""
    config = get_config()
    events_file = getattr(config, 'EVENTS_FILE', None)
    if not events_file:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        events_file = os.path.join(base_dir, 'events_db.json')
    
    if not os.path.exists(events_file) or os.stat(events_file).st_size == 0:
        return []
    with open(events_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_events(events):
    """Save events to JSON file"""
    config = get_config()
    events_file = getattr(config, 'EVENTS_FILE', None)
    if not events_file:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        events_file = os.path.join(base_dir, 'events_db.json')
    
    with open(events_file, 'w', encoding='utf-8') as f:
        json.dump(events, f, ensure_ascii=False, indent=4)


def load_time_tracking():
    """Load time tracking data from JSON file"""
    config = get_config()
    time_file = getattr(config, 'TIME_TRACKING_FILE', None)
    if not time_file:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        time_file = os.path.join(base_dir, 'time_tracking.json')
    
    if not os.path.exists(time_file) or os.stat(time_file).st_size == 0:
        return {'entries': [], 'active_sessions': {}}
    with open(time_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_time_tracking(data):
    """Save time tracking data to JSON file"""
    config = get_config()
    time_file = getattr(config, 'TIME_TRACKING_FILE', None)
    if not time_file:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        time_file = os.path.join(base_dir, 'time_tracking.json')
    
    with open(time_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)


def load_equipment_bank():
    """Load equipment bank from JSON file"""
    config = get_config()
    equipment_file = getattr(config, 'EQUIPMENT_BANK_FILE', None)
    if not equipment_file:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        equipment_file = os.path.join(base_dir, 'equipment_bank.json')
    
    if not os.path.exists(equipment_file) or os.stat(equipment_file).st_size == 0:
        default_equipment = [
            'מקרן', 'הגברה', 'מיקרופון', 'מסך/פליפ-צ\'ארט', 'שולחן', 'כסאות',
            'מתנות לאורחים', 'רול-אפים', 'באנרים', 'פלטה/במה', 'תאורה', 'שולחן עגול'
        ]
        save_equipment_bank(default_equipment)
        return default_equipment
    with open(equipment_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_equipment_bank(equipment):
    """Save equipment bank to JSON file"""
    config = get_config()
    equipment_file = getattr(config, 'EQUIPMENT_BANK_FILE', None)
    if not equipment_file:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        equipment_file = os.path.join(base_dir, 'equipment_bank.json')
    
    with open(equipment_file, 'w', encoding='utf-8') as f:
        json.dump(equipment, f, ensure_ascii=False, indent=4)


def load_checklist_templates():
    """Load checklist templates from JSON file"""
    config = get_config()
    templates_file = getattr(config, 'CHECKLIST_TEMPLATES_FILE', None)
    if not templates_file:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        templates_file = os.path.join(base_dir, 'checklist_templates.json')
    
    if not os.path.exists(templates_file) or os.stat(templates_file).st_size == 0:
        default_templates = {
            'כנס': ['הזמנת קייטרינג', 'עיצוב רול-אפים', 'שליחת Save the date'],
            'חתונה': ['אישור אולם', 'הזמנת קייטרינג', 'הזמנת צלמים'],
            'השקה': ['אישור מיקום', 'הזמנת קייטרינג/קפה', 'עיצוב חומרי שיווק']
        }
        save_checklist_templates(default_templates)
        return default_templates
    with open(templates_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_checklist_templates(templates):
    """Save checklist templates to JSON file"""
    config = get_config()
    templates_file = getattr(config, 'CHECKLIST_TEMPLATES_FILE', None)
    if not templates_file:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        templates_file = os.path.join(base_dir, 'checklist_templates.json')
    
    with open(templates_file, 'w', encoding='utf-8') as f:
        json.dump(templates, f, ensure_ascii=False, indent=4)


def load_forms():
    """Load forms from JSON file"""
    config = get_config()
    forms_file = getattr(config, 'FORMS_FILE', None)
    if not forms_file:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        forms_file = os.path.join(base_dir, 'forms_db.json')
    
    if not os.path.exists(forms_file) or os.stat(forms_file).st_size == 0:
        return []
    with open(forms_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_forms(forms):
    """Save forms to JSON file"""
    config = get_config()
    forms_file = getattr(config, 'FORMS_FILE', None)
    if not forms_file:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        forms_file = os.path.join(base_dir, 'forms_db.json')
    
    with open(forms_file, 'w', encoding='utf-8') as f:
        json.dump(forms, f, ensure_ascii=False, indent=4)


def load_permissions():
    """Load page permissions from JSON file"""
    config = get_config()
    permissions_file = getattr(config, 'PERMISSIONS_FILE', None)
    if not permissions_file:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        permissions_file = os.path.join(base_dir, 'permissions_db.json')
    
    if not os.path.exists(permissions_file):
        default_permissions = {
            '/': 'עובד',
            '/all_clients': 'עובד',
            '/client/': 'עובד',
            '/finance': 'עובד',
            '/events': 'עובד',
            '/suppliers': 'עובד',
            '/quotes': 'עובד',
            '/forms': 'עובד',
            '/admin/dashboard': 'מנהל',
            '/admin/users': 'אדמין'
        }
        save_permissions(default_permissions)
        return default_permissions
    with open(permissions_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_permissions(permissions):
    """Save page permissions to JSON file"""
    config = get_config()
    permissions_file = getattr(config, 'PERMISSIONS_FILE', None)
    if not permissions_file:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        permissions_file = os.path.join(base_dir, 'permissions_db.json')
    
    with open(permissions_file, 'w', encoding='utf-8') as f:
        json.dump(permissions, f, ensure_ascii=False, indent=4)


def load_user_activity():
    """Load user activity data"""
    config = get_config()
    activity_file = getattr(config, 'USER_ACTIVITY_FILE', None)
    if not activity_file:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        activity_file = os.path.join(base_dir, 'user_activity.json')
    
    if not os.path.exists(activity_file) or os.stat(activity_file).st_size == 0:
        return {}
    with open(activity_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_user_activity(activity):
    """Save user activity data"""
    config = get_config()
    activity_file = getattr(config, 'USER_ACTIVITY_FILE', None)
    if not activity_file:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        activity_file = os.path.join(base_dir, 'user_activity.json')
    
    with open(activity_file, 'w', encoding='utf-8') as f:
        json.dump(activity, f, ensure_ascii=False, indent=4)


def update_user_activity(user_id):
    """Update last activity time for a user"""
    activity = load_user_activity()
    activity[user_id] = datetime.now().isoformat()
    save_user_activity(activity)


def load_activity_logs():
    """Load activity logs"""
    config = get_config()
    logs_file = getattr(config, 'ACTIVITY_LOGS_FILE', None)
    if not logs_file:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        logs_file = os.path.join(base_dir, 'activity_logs.json')
    
    if not os.path.exists(logs_file) or os.stat(logs_file).st_size == 0:
        return []
    with open(logs_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_activity_logs(logs):
    """Save activity logs"""
    config = get_config()
    logs_file = getattr(config, 'ACTIVITY_LOGS_FILE', None)
    if not logs_file:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        logs_file = os.path.join(base_dir, 'activity_logs.json')
    
    with open(logs_file, 'w', encoding='utf-8') as f:
        json.dump(logs, f, ensure_ascii=False, indent=4)
