# Backend Modular Structure Guide

## מבנה הקבצים החדש

```
backend/
├── __init__.py          # Package initialization
├── app_factory.py       # Flask app factory (לשימוש עתידי)
├── config.py            # Configuration settings
├── extensions.py        # Flask extensions (login_manager, csrf, limiter)
├── models.py            # User model for Flask-Login
├── blueprints/
│   ├── __init__.py      # Blueprints registration
│   ├── auth.py          # Authentication routes (~150 lines)
│   ├── api.py           # Basic API endpoints (~100 lines)
│   ├── clients.py       # Client management (~350 lines)
│   ├── finance.py       # Financial routes (~250 lines)
│   ├── events.py        # Events management (~300 lines)
│   ├── suppliers.py     # Suppliers routes (~200 lines)
│   ├── quotes.py        # Quotes routes (~100 lines)
│   ├── chat.py          # Internal messaging (~200 lines)
│   ├── admin.py         # User management (~200 lines)
│   └── time_tracking.py # Time tracking (~300 lines)
└── utils/
    ├── __init__.py      # Utils exports
    ├── helpers.py       # Data loading/saving functions (~500 lines)
    ├── permissions.py   # Permission checking (~100 lines)
    └── email.py         # Email sending functions (~150 lines)
```

## יתרונות המבנה החדש

| יתרון | תיאור |
|-------|-------|
| **קריאות** | קבצים קטנים (100-500 שורות במקום 6000+) |
| **תחזוקה** | קל למצוא ולתקן באגים |
| **עבודת צוות** | מפתחים שונים יכולים לעבוד על מודולים שונים |
| **בדיקות** | קל יותר לכתוב unit tests למודול ספציפי |
| **Reusability** | פונקציות utils ניתנות לשימוש חוזר |

## שימוש

### Import מה-utils:
```python
from backend.utils import load_data, save_data, load_users
from backend.utils import check_permission, get_user_role
from backend.utils import send_form_email
```

### Import מה-blueprints:
```python
from backend.blueprints import auth_bp, api_bp, clients_bp
```

### Import מה-extensions:
```python
from backend.extensions import login_manager, csrf, limiter
```

## מעבר הדרגתי

המבנה החדש נוצר כדי לאפשר מעבר הדרגתי:

1. **כרגע**: app.py הקיים ממשיך לעבוד
2. **שלב 1**: ייבוא פונקציות מ-utils במקום להשתמש בקוד מקומי
3. **שלב 2**: החלפה הדרגתית של routes מ-app.py ל-blueprints
4. **שלב 3**: מעבר מלא ל-app_factory.py

## Blueprint Routes Reference

### auth_bp
- `POST /login` - Login
- `POST /logout` - Logout
- `POST /reset_password_request` - Request password reset
- `GET/POST /reset_password/<token>` - Reset password

### api_bp (prefix: /api)
- `GET /api/current_user` - Get current user
- `GET /api/sidebar_users` - Get users for sidebar
- `GET /api/clients` - Get active clients
- `GET /api/all_clients` - Get all clients

### clients_bp
- `GET /api/client/<client_id>` - Get client details
- `POST /add_client` - Add new client
- `POST /add_project/<client_id>` - Add project
- `POST /add_task/<client_id>/<project_id>` - Add task
- `POST /update_task_status/...` - Update task status
- `POST /toggle_client_active/<client_id>` - Toggle active status

### finance_bp
- `GET /api/finance` - Get finance data
- `POST /quick_add_charge` - Add charge
- `POST /toggle_charge_status/...` - Toggle paid status
- `GET /generate_invoice/<client_id>` - Generate invoice Excel
- `GET /export_open_charges` - Export open charges

### events_bp
- `GET /api/events` - Get events
- `POST /add_event` - Add event
- `POST /update_event/<event_id>` - Update event
- `POST /toggle_event_active/<event_id>` - Toggle active

### suppliers_bp
- `GET /api/suppliers` - Get suppliers
- `POST /add_supplier` - Add supplier
- `POST /edit_supplier/<supplier_id>` - Edit supplier
- `POST /delete_supplier/<supplier_id>` - Delete supplier

### quotes_bp
- `GET /api/quotes` - Get quotes
- `POST /add_quote` - Add quote
- `POST /edit_quote/<quote_id>` - Edit quote

### chat_bp
- `GET /api/chat/conversations` - Get conversations
- `GET /api/chat/messages/<user_id>` - Get messages
- `POST /api/chat/send` - Send message
- `POST /api/chat/mark-read/<user_id>` - Mark as read

### admin_bp
- `GET /api/admin/users` - Get all users
- `POST /admin/users` - User management actions
- `GET /api/forms` - Get forms
- `POST /admin/forms/create` - Create form

### time_tracking_bp
- `POST /api/time_tracking/start` - Start tracking
- `POST /api/time_tracking/stop` - Stop and save
- `POST /api/time_tracking/cancel` - Cancel without saving
- `GET /api/time_tracking/active` - Get active session
- `GET /api/time_tracking/entries` - Get entries
- `GET /api/time_tracking/report` - Get report
- `GET /api/time_tracking/export` - Export to Excel

## הערות חשובות

1. **app.py הקיים לא השתנה** - המערכת ממשיכה לעבוד כמו קודם
2. **מבנה מוכן למעבר** - כשתרצו לעבור, הכל מוכן
3. **תאימות לאחור** - routes חדשים תואמים את הקיימים
