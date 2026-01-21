"""
Permission Utilities
Contains functions for checking user permissions and roles
"""
from backend.utils.helpers import load_users, load_permissions


def get_user_role(user_id):
    """Get the role of a user"""
    users = load_users()
    if user_id in users:
        return users[user_id].get('role', 'עובד')
    return 'עובד'


def is_manager_or_admin(user_id, user_role):
    """Check if user is a manager or admin"""
    return user_id == 'admin' or user_role in ['מנהל', 'אדמין']


def normalize_assigned_user(assigned):
    """Normalize assigned_user to a list - supports both string and list"""
    if isinstance(assigned, str):
        return [assigned] if assigned else []
    elif isinstance(assigned, list):
        return assigned
    else:
        return []


def can_user_access_client(user_id, user_role, client):
    """Check if a user can access a specific client"""
    if is_manager_or_admin(user_id, user_role):
        return True
    
    assigned = normalize_assigned_user(client.get('assigned_user', []))
    user_id_lower = user_id.lower() if isinstance(user_id, str) else str(user_id).lower()
    
    for assigned_uid in assigned:
        assigned_uid_lower = assigned_uid.lower() if isinstance(assigned_uid, str) else str(assigned_uid).lower()
        if user_id == assigned_uid or user_id_lower == assigned_uid_lower:
            return True
    
    return False


def filter_active_clients(clients):
    """Filter active (non-archived) clients"""
    return [c for c in clients if not c.get('archived', False)]


def filter_archived_clients(clients):
    """Filter archived clients"""
    return [c for c in clients if c.get('archived', False)]


def check_permission(route_path, user_role):
    """Check if a user has permission to access a specific page
    
    Roles:
    - עובד (Employee): All pages accessible to employees
    - מנהל (Manager): Manager and admin only
    - אדמין (Admin): Admin only
    """
    permissions = load_permissions()
    
    # Find the matching permission
    required_role = None
    for route, role in permissions.items():
        if route_path == route or route_path.startswith(route):
            required_role = role
            break
    
    # If not found, default to everyone can access
    if required_role is None:
        return True
    
    # Check role hierarchy
    role_hierarchy = {'עובד': 1, 'מנהל': 2, 'אדמין': 3}
    user_level = role_hierarchy.get(user_role, 1)
    required_level = role_hierarchy.get(required_role, 1)
    
    return user_level >= required_level


def get_accessible_clients(user_id, user_role, clients):
    """Get list of clients accessible to a user"""
    if is_manager_or_admin(user_id, user_role):
        return clients
    
    return [c for c in clients if can_user_access_client(user_id, user_role, c)]
