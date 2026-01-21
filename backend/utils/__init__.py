# Utils package
from .helpers import (
    load_data, save_data, load_users, save_users,
    load_suppliers, save_suppliers, load_quotes, save_quotes,
    load_messages, save_messages, load_events, save_events,
    load_time_tracking, save_time_tracking,
    load_equipment_bank, save_equipment_bank,
    load_checklist_templates, save_checklist_templates,
    load_forms, save_forms, load_permissions, save_permissions,
    load_user_activity, save_user_activity, update_user_activity,
    load_activity_logs, save_activity_logs,
    get_next_client_number, get_next_project_number,
    get_next_task_number, get_next_charge_number,
    get_next_workday, assign_client_numbers
)

from .permissions import (
    check_permission, get_user_role, is_manager_or_admin,
    can_user_access_client, normalize_assigned_user,
    filter_active_clients, filter_archived_clients,
    get_accessible_clients
)

from .email import send_form_email, send_password_reset_email

__all__ = [
    # Data helpers
    'load_data', 'save_data', 'load_users', 'save_users',
    'load_suppliers', 'save_suppliers', 'load_quotes', 'save_quotes',
    'load_messages', 'save_messages', 'load_events', 'save_events',
    'load_time_tracking', 'save_time_tracking',
    'load_equipment_bank', 'save_equipment_bank',
    'load_checklist_templates', 'save_checklist_templates',
    'load_forms', 'save_forms', 'load_permissions', 'save_permissions',
    'load_user_activity', 'save_user_activity', 'update_user_activity',
    'load_activity_logs', 'save_activity_logs',
    'get_next_client_number', 'get_next_project_number',
    'get_next_task_number', 'get_next_charge_number',
    'get_next_workday', 'assign_client_numbers',
    # Permissions
    'check_permission', 'get_user_role', 'is_manager_or_admin',
    'can_user_access_client', 'normalize_assigned_user',
    'filter_active_clients', 'filter_archived_clients',
    'get_accessible_clients',
    # Email
    'send_form_email', 'send_password_reset_email',
]
