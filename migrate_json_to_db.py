"""
Migration script to import JSON files into PostgreSQL database
Run this once to migrate your existing data to PostgreSQL
"""
import os
import json
import sys
from database import (
    init_db, get_db, User, Client, Supplier, Quote, Message, Event,
    Equipment, ChecklistTemplate, Form, Permission, UserActivity
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def migrate_users():
    """Migrate users from users_db.json"""
    users_file = os.path.join(BASE_DIR, 'users_db.json')
    if not os.path.exists(users_file):
        print("users_db.json not found, skipping...")
        return
    
    db = get_db()
    try:
        with open(users_file, 'r', encoding='utf-8') as f:
            users_data = json.load(f)
        
        for user_id, user_info in users_data.items():
            # Check if user already exists
            existing = db.query(User).filter(User.user_id == user_id).first()
            if existing:
                print(f"User {user_id} already exists, skipping...")
                continue
            
            user = User(
                user_id=user_id,
                password=user_info.get('password', ''),
                name=user_info.get('name', ''),
                role=user_info.get('role', 'עובד'),
                email=user_info.get('email'),
                google_id=user_info.get('google_id'),
                google_credentials=user_info.get('google_credentials'),
                email_password=user_info.get('email_password')
            )
            db.add(user)
        
        db.commit()
        print(f"✓ Migrated {len(users_data)} users")
    except Exception as e:
        db.rollback()
        print(f"✗ Error migrating users: {e}")
        raise
    finally:
        db.close()

def migrate_clients():
    """Migrate clients from agency_db.json"""
    clients_file = os.path.join(BASE_DIR, 'agency_db.json')
    if not os.path.exists(clients_file):
        print("agency_db.json not found, skipping...")
        return
    
    db = get_db()
    try:
        with open(clients_file, 'r', encoding='utf-8') as f:
            clients_data = json.load(f)
        
        if not isinstance(clients_data, list):
            print("agency_db.json is not a list, skipping...")
            return
        
        for client_data in clients_data:
            # Check if client already exists
            existing = db.query(Client).filter(Client.id == client_data.get('id')).first()
            if existing:
                print(f"Client {client_data.get('id')} already exists, skipping...")
                continue
            
            client = Client(
                id=client_data.get('id'),
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
        print(f"✓ Migrated {len(clients_data)} clients")
    except Exception as e:
        db.rollback()
        print(f"✗ Error migrating clients: {e}")
        raise
    finally:
        db.close()

def migrate_suppliers():
    """Migrate suppliers from suppliers_db.json"""
    suppliers_file = os.path.join(BASE_DIR, 'suppliers_db.json')
    if not os.path.exists(suppliers_file) or os.stat(suppliers_file).st_size == 0:
        print("suppliers_db.json not found or empty, skipping...")
        return
    
    db = get_db()
    try:
        with open(suppliers_file, 'r', encoding='utf-8') as f:
            suppliers_data = json.load(f)
        
        if not isinstance(suppliers_data, list):
            print("suppliers_db.json is not a list, skipping...")
            return
        
        for supplier_data in suppliers_data:
            supplier_id = supplier_data.get('id')
            if not supplier_id:
                continue
            
            existing = db.query(Supplier).filter(Supplier.id == supplier_id).first()
            if existing:
                continue
            
            supplier = Supplier(id=supplier_id, data=supplier_data)
            db.add(supplier)
        
        db.commit()
        print(f"✓ Migrated {len(suppliers_data)} suppliers")
    except Exception as e:
        db.rollback()
        print(f"✗ Error migrating suppliers: {e}")
        raise
    finally:
        db.close()

def migrate_quotes():
    """Migrate quotes from quotes_db.json"""
    quotes_file = os.path.join(BASE_DIR, 'quotes_db.json')
    if not os.path.exists(quotes_file) or os.stat(quotes_file).st_size == 0:
        print("quotes_db.json not found or empty, skipping...")
        return
    
    db = get_db()
    try:
        with open(quotes_file, 'r', encoding='utf-8') as f:
            quotes_data = json.load(f)
        
        if not isinstance(quotes_data, list):
            return
        
        for quote_data in quotes_data:
            quote_id = quote_data.get('id')
            if not quote_id:
                continue
            
            existing = db.query(Quote).filter(Quote.id == quote_id).first()
            if existing:
                continue
            
            quote = Quote(id=quote_id, data=quote_data)
            db.add(quote)
        
        db.commit()
        print(f"✓ Migrated {len(quotes_data)} quotes")
    except Exception as e:
        db.rollback()
        print(f"✗ Error migrating quotes: {e}")
        raise
    finally:
        db.close()

def migrate_messages():
    """Migrate messages from messages_db.json"""
    messages_file = os.path.join(BASE_DIR, 'messages_db.json')
    if not os.path.exists(messages_file) or os.stat(messages_file).st_size == 0:
        print("messages_db.json not found or empty, skipping...")
        return
    
    db = get_db()
    try:
        with open(messages_file, 'r', encoding='utf-8') as f:
            messages_data = json.load(f)
        
        if not isinstance(messages_data, list):
            return
        
        for message_data in messages_data:
            message_id = message_data.get('id')
            if not message_id:
                continue
            
            existing = db.query(Message).filter(Message.id == message_id).first()
            if existing:
                continue
            
            message = Message(id=message_id, data=message_data)
            db.add(message)
        
        db.commit()
        print(f"✓ Migrated {len(messages_data)} messages")
    except Exception as e:
        db.rollback()
        print(f"✗ Error migrating messages: {e}")
        raise
    finally:
        db.close()

def migrate_events():
    """Migrate events from events_db.json"""
    events_file = os.path.join(BASE_DIR, 'events_db.json')
    if not os.path.exists(events_file) or os.stat(events_file).st_size == 0:
        print("events_db.json not found or empty, skipping...")
        return
    
    db = get_db()
    try:
        with open(events_file, 'r', encoding='utf-8') as f:
            events_data = json.load(f)
        
        if not isinstance(events_data, list):
            return
        
        for event_data in events_data:
            event_id = event_data.get('id')
            if not event_id:
                continue
            
            existing = db.query(Event).filter(Event.id == event_id).first()
            if existing:
                continue
            
            event = Event(id=event_id, data=event_data)
            db.add(event)
        
        db.commit()
        print(f"✓ Migrated {len(events_data)} events")
    except Exception as e:
        db.rollback()
        print(f"✗ Error migrating events: {e}")
        raise
    finally:
        db.close()

def migrate_equipment():
    """Migrate equipment from equipment_bank.json"""
    equipment_file = os.path.join(BASE_DIR, 'equipment_bank.json')
    if not os.path.exists(equipment_file) or os.stat(equipment_file).st_size == 0:
        print("equipment_bank.json not found or empty, skipping...")
        return
    
    db = get_db()
    try:
        with open(equipment_file, 'r', encoding='utf-8') as f:
            equipment_data = json.load(f)
        
        if not isinstance(equipment_data, list):
            return
        
        for equipment_name in equipment_data:
            existing = db.query(Equipment).filter(Equipment.name == equipment_name).first()
            if existing:
                continue
            
            equipment = Equipment(name=equipment_name)
            db.add(equipment)
        
        db.commit()
        print(f"✓ Migrated {len(equipment_data)} equipment items")
    except Exception as e:
        db.rollback()
        print(f"✗ Error migrating equipment: {e}")
        raise
    finally:
        db.close()

def migrate_checklist_templates():
    """Migrate checklist templates from checklist_templates.json"""
    templates_file = os.path.join(BASE_DIR, 'checklist_templates.json')
    if not os.path.exists(templates_file) or os.stat(templates_file).st_size == 0:
        print("checklist_templates.json not found or empty, skipping...")
        return
    
    db = get_db()
    try:
        with open(templates_file, 'r', encoding='utf-8') as f:
            templates_data = json.load(f)
        
        if not isinstance(templates_data, dict):
            return
        
        for category, items in templates_data.items():
            existing = db.query(ChecklistTemplate).filter(ChecklistTemplate.category == category).first()
            if existing:
                continue
            
            template = ChecklistTemplate(category=category, items=items)
            db.add(template)
        
        db.commit()
        print(f"✓ Migrated {len(templates_data)} checklist templates")
    except Exception as e:
        db.rollback()
        print(f"✗ Error migrating checklist templates: {e}")
        raise
    finally:
        db.close()

def migrate_forms():
    """Migrate forms from forms_db.json"""
    forms_file = os.path.join(BASE_DIR, 'forms_db.json')
    if not os.path.exists(forms_file) or os.stat(forms_file).st_size == 0:
        print("forms_db.json not found or empty, skipping...")
        return
    
    db = get_db()
    try:
        with open(forms_file, 'r', encoding='utf-8') as f:
            forms_data = json.load(f)
        
        if not isinstance(forms_data, list):
            return
        
        for form_data in forms_data:
            form_id = form_data.get('id') or form_data.get('token')
            if not form_id:
                continue
            
            existing = db.query(Form).filter(Form.id == form_id).first()
            if existing:
                continue
            
            form = Form(id=form_id, data=form_data)
            db.add(form)
        
        db.commit()
        print(f"✓ Migrated {len(forms_data)} forms")
    except Exception as e:
        db.rollback()
        print(f"✗ Error migrating forms: {e}")
        raise
    finally:
        db.close()

def migrate_permissions():
    """Migrate permissions from permissions_db.json"""
    permissions_file = os.path.join(BASE_DIR, 'permissions_db.json')
    if not os.path.exists(permissions_file) or os.stat(permissions_file).st_size == 0:
        print("permissions_db.json not found or empty, skipping...")
        return
    
    db = get_db()
    try:
        with open(permissions_file, 'r', encoding='utf-8') as f:
            permissions_data = json.load(f)
        
        # Permissions structure may vary, adapt as needed
        if isinstance(permissions_data, dict):
            for user_id, user_perms in permissions_data.items():
                if isinstance(user_perms, dict):
                    for perm_type, granted in user_perms.items():
                        permission = Permission(
                            user_id=user_id,
                            permission_type=perm_type,
                            granted=granted
                        )
                        db.add(permission)
        
        db.commit()
        print("✓ Migrated permissions")
    except Exception as e:
        db.rollback()
        print(f"✗ Error migrating permissions: {e}")
        raise
    finally:
        db.close()

def migrate_user_activity():
    """Migrate user activity from user_activity.json"""
    activity_file = os.path.join(BASE_DIR, 'user_activity.json')
    if not os.path.exists(activity_file) or os.stat(activity_file).st_size == 0:
        print("user_activity.json not found or empty, skipping...")
        return
    
    db = get_db()
    try:
        with open(activity_file, 'r', encoding='utf-8') as f:
            activity_data = json.load(f)
        
        # Activity structure may vary, adapt as needed
        if isinstance(activity_data, dict):
            for user_id, activities in activity_data.items():
                if isinstance(activities, list):
                    for activity in activities:
                        user_activity = UserActivity(user_id=user_id, activity=activity)
                        db.add(user_activity)
        
        db.commit()
        print("✓ Migrated user activity")
    except Exception as e:
        db.rollback()
        print(f"✗ Error migrating user activity: {e}")
        raise
    finally:
        db.close()

def main():
    """Run all migrations"""
    print("=" * 60)
    print("Starting JSON to PostgreSQL Migration")
    print("=" * 60)
    
    # Initialize database tables
    print("\n1. Initializing database tables...")
    init_db()
    print("✓ Database tables created")
    
    # Run migrations
    print("\n2. Migrating data...")
    migrate_users()
    migrate_clients()
    migrate_suppliers()
    migrate_quotes()
    migrate_messages()
    migrate_events()
    migrate_equipment()
    migrate_checklist_templates()
    migrate_forms()
    migrate_permissions()
    migrate_user_activity()
    
    print("\n" + "=" * 60)
    print("Migration completed successfully!")
    print("=" * 60)
    print("\n⚠️  IMPORTANT: Backup your JSON files before switching to database mode")
    print("   You can now set USE_DATABASE=true in your environment variables")

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"\n✗ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

