# 🏗️ AdAgency App - Project Architecture

This document provides a comprehensive overview of the AdAgency application architecture, explaining each component and how they interact.

---

## 📋 Table of Contents

- [Overview](#overview)
- [System Architecture Diagram](#system-architecture-diagram)
- [Technology Stack](#technology-stack)
- [Directory Structure](#directory-structure)
- [Backend Architecture](#backend-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Database Layer](#database-layer)
- [Authentication & Security](#authentication--security)
- [API Layer](#api-layer)
- [Deployment](#deployment)

---

## Overview

AdAgency App (ותקין) is a full-stack agency management system built to help advertising and event agencies manage their clients, projects, tasks, finances, events, and suppliers. The application features a **Python/Flask backend** serving a **React/TypeScript frontend**, with support for both local JSON file storage and PostgreSQL database for production deployments.

### Key Capabilities

| Feature | Description |
|---------|-------------|
| **Client Management** | Track clients, contacts, documents, and logos |
| **Project Tracking** | Manage projects with tasks, deadlines, and Gantt views |
| **Financial Management** | Retainers, extra charges, invoice generation |
| **Event Planning** | Event calendar, checklists, equipment, and suppliers |
| **Supplier Management** | Vendor database with contacts and files |
| **Quote System** | Create and manage client quotes |
| **Custom Forms** | Build and share public forms |
| **Time Tracking** | Employee time tracking and reports |
| **User Management** | Role-based access control (Admin/Employee) |

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    React SPA (TypeScript)                        │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐│    │
│  │  │  Dashboard  │ │   Clients   │ │   Finance   │ │   Events   ││    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘│    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐│    │
│  │  │  Suppliers  │ │    Quotes   │ │    Forms    │ │   Admin    ││    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘│    │
│  └─────────────────────────────────────────────────────────────────┘    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ HTTPS / Axios
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                   │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     Flask REST API (app.py)                      │    │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │    │
│  │  │  Authentication  │  │   Client APIs    │  │  Finance APIs  │ │    │
│  │  │  /login, /logout │  │  /api/clients    │  │  /api/finance  │ │    │
│  │  └──────────────────┘  └──────────────────┘  └────────────────┘ │    │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │    │
│  │  │   Events APIs    │  │  Suppliers APIs  │  │   Forms APIs   │ │    │
│  │  │  /api/events     │  │  /api/suppliers  │  │  /api/forms    │ │    │
│  │  └──────────────────┘  └──────────────────┘  └────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                     Security Layer                              │     │
│  │  Flask-Login │ CSRF Protection │ Rate Limiting │ Password Hash │     │
│  └────────────────────────────────────────────────────────────────┘     │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                     │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐       │
│  │   Database Helpers          │  │   External Services         │       │
│  │   (database_helpers.py)     │  │   (google_auth.py)          │       │
│  │                             │  │                             │       │
│  │  • Dual storage support     │  │  • Google OAuth 2.0         │       │
│  │  • JSON ↔ PostgreSQL        │  │  • Gmail API                │       │
│  │  • Data abstraction         │  │  • Email sending            │       │
│  └──────────────┬──────────────┘  └─────────────────────────────┘       │
│                 │                                                        │
│      ┌──────────┴──────────┐                                            │
│      ▼                     ▼                                            │
│  ┌─────────────┐    ┌─────────────┐                                     │
│  │  JSON Files │    │ PostgreSQL  │                                     │
│  │  (Local)    │    │ (Production)│                                     │
│  └─────────────┘    └─────────────┘                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.11+ | Server-side programming language |
| **Flask** | 3.0.0 | Web framework |
| **Flask-Login** | 0.6.3 | User session management |
| **Flask-WTF** | 1.2.1 | CSRF protection & form handling |
| **Flask-Limiter** | 3.5.0 | Rate limiting |
| **SQLAlchemy** | 2.0.23 | ORM for database operations |
| **psycopg2-binary** | 2.9.9 | PostgreSQL adapter |
| **Gunicorn** | 21.2.0 | Production WSGI server |
| **google-auth** | 2.25.2 | Google OAuth integration |
| **openpyxl** | 3.1.2 | Excel file generation |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.0 | UI library |
| **TypeScript** | 5.2.2 | Type-safe JavaScript |
| **Vite** | 5.0.8 | Build tool & dev server |
| **React Router** | 6.20.0 | Client-side routing |
| **Tailwind CSS** | 3.3.6 | Utility-first CSS framework |
| **Radix UI** | Various | Accessible UI components |
| **FullCalendar** | 6.1.10 | Calendar component |
| **Axios** | 1.6.2 | HTTP client |
| **Lucide React** | 0.294.0 | Icon library |

---

## Directory Structure

```
AdAgency_App/
├── 📁 src/                          # Frontend source code
│   ├── 📁 components/               # Reusable React components
│   │   ├── 📁 layout/               # Layout components
│   │   │   ├── Layout.tsx           # Main app layout with sidebar
│   │   │   └── Sidebar.tsx          # Navigation sidebar
│   │   ├── 📁 ui/                   # UI primitives (Radix-based)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   └── ... (more UI components)
│   │   ├── ChatWidget.tsx           # In-app messaging
│   │   └── TimeTracker.tsx          # Time tracking component
│   │
│   ├── 📁 pages/                    # Page components (routes)
│   │   ├── Dashboard.tsx            # Main dashboard with calendar
│   │   ├── AllClients.tsx           # Client list view
│   │   ├── ClientPage.tsx           # Single client details
│   │   ├── Finance.tsx              # Financial management
│   │   ├── Events.tsx               # Event planning
│   │   ├── Suppliers.tsx            # Supplier management
│   │   ├── Quotes.tsx               # Quote management
│   │   ├── Forms.tsx                # Custom forms
│   │   ├── Archive.tsx              # Archived items
│   │   ├── AdminDashboard.tsx       # Admin overview
│   │   ├── ManageUsers.tsx          # User management
│   │   ├── TimeTrackingReports.tsx  # Time reports
│   │   ├── QuickUpdate.tsx          # Quick task updates
│   │   └── Login.tsx                # Authentication page
│   │
│   ├── 📁 contexts/                 # React contexts
│   │   └── AuthContext.tsx          # Authentication state
│   │
│   ├── 📁 hooks/                    # Custom React hooks
│   │   └── use-toast.ts             # Toast notifications
│   │
│   ├── 📁 lib/                      # Utilities
│   │   ├── api.ts                   # Axios configuration
│   │   └── utils.ts                 # Helper functions
│   │
│   ├── App.tsx                      # Root component & routing
│   ├── main.tsx                     # Application entry point
│   └── index.css                    # Global styles
│
├── 📁 static/                       # Static assets
│   ├── 📁 dist/                     # Built frontend (production)
│   ├── 📁 logos/                    # Client logos
│   ├── 📁 documents/                # General documents
│   ├── 📁 client_docs/              # Client-specific documents
│   ├── 📁 chat_files/               # Chat attachments
│   ├── 📁 forms_uploads/            # Form submissions
│   └── 📁 supplier_files/           # Supplier documents
│
├── 📁 templates/                    # Flask templates (minimal)
│   ├── public_form.html             # Public form template
│   └── reset_password.html          # Password reset page
│
├── 📄 app.py                        # Main Flask application (6400+ lines)
├── 📄 database.py                   # SQLAlchemy models
├── 📄 database_helpers.py           # Data access layer
├── 📄 google_auth.py                # Google OAuth integration
│
├── 📄 *_db.json                     # JSON data files (local storage)
│   ├── agency_db.json               # Client data
│   ├── users_db.json                # User accounts
│   ├── suppliers_db.json            # Suppliers
│   ├── events_db.json               # Events
│   ├── messages_db.json             # Chat messages
│   ├── forms_db.json                # Custom forms
│   └── ...
│
├── 📄 vite.config.ts                # Vite configuration
├── 📄 tailwind.config.js            # Tailwind configuration
├── 📄 tsconfig.json                 # TypeScript configuration
├── 📄 package.json                  # Node.js dependencies
├── 📄 requirements.txt              # Python dependencies
├── 📄 Dockerfile                    # Container configuration
├── 📄 Procfile                      # Railway deployment config
└── 📄 README.md                     # Project documentation
```

---

## Backend Architecture

### Main Application (`app.py`)

The Flask application is the heart of the backend, containing:

#### Core Components

```python
# Application initialization
app = Flask(__name__)
login_manager = LoginManager()
csrf = CSRFProtect(app)
limiter = Limiter(app=app, ...)
```

#### Route Categories

| Category | Example Routes | Purpose |
|----------|---------------|---------|
| **Authentication** | `/login`, `/logout`, `/reset_password` | User authentication |
| **Clients** | `/api/clients`, `/client/<id>`, `/add_client` | Client CRUD |
| **Projects** | `/add_project`, `/add_task`, `/update_task` | Project management |
| **Finance** | `/api/finance`, `/generate_invoice` | Financial operations |
| **Events** | `/add_event`, `/update_event` | Event management |
| **Suppliers** | `/api/suppliers`, `/add_supplier` | Supplier CRUD |
| **Forms** | `/api/forms`, `/public_form` | Form management |
| **Admin** | `/admin/users`, `/admin/dashboard` | Administration |

### Database Models (`database.py`)

SQLAlchemy ORM models for PostgreSQL:

```python
class User(Base):
    __tablename__ = 'users'
    user_id = Column(String, primary_key=True)
    password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default='עובד')  # 'Employee'
    email = Column(String)
    google_credentials = Column(Text)
    # ...

class Client(Base):
    __tablename__ = 'clients'
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    retainer = Column(Integer, default=0)
    extra_charges = Column(JSONB)  # Nested JSON data
    projects = Column(JSONB)       # Projects with tasks
    # ...
```

### Data Access Layer (`database_helpers.py`)

Provides a unified interface for data operations, supporting both JSON files and PostgreSQL:

```python
def load_data():
    """Load clients data from database or JSON file"""
    if not USE_DATABASE:
        # JSON file storage (local development)
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    
    # PostgreSQL storage (production)
    db = get_db()
    clients = db.query(Client).all()
    return [client_to_dict(c) for c in clients]
```

**Key Functions:**
- `load_users()` / `save_users()` - User management
- `load_data()` / `save_data()` - Client data
- `load_suppliers()` / `save_suppliers()` - Suppliers
- `load_events()` / `save_events()` - Events
- `load_forms()` / `save_forms()` - Custom forms

---

## Frontend Architecture

### Application Structure

```
                    ┌─────────────────────┐
                    │       App.tsx       │
                    │   (Root Component)  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │    AuthProvider     │
                    │  (Context Provider) │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │    BrowserRouter    │
                    │   (React Router)    │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
    ┌─────▼─────┐       ┌──────▼──────┐      ┌─────▼─────┐
    │   Login   │       │   Layout    │      │  Toaster  │
    │   Page    │       │ (Protected) │      │ (Global)  │
    └───────────┘       └──────┬──────┘      └───────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
    ┌─────▼─────┐       ┌──────▼──────┐      ┌─────▼─────┐
    │  Sidebar  │       │   Outlet    │      │   Chat    │
    │           │       │  (Routes)   │      │  Widget   │
    └───────────┘       └──────┬──────┘      └───────────┘
                               │
     ┌─────────┬─────────┬─────┴─────┬─────────┬─────────┐
     │         │         │           │         │         │
┌────▼───┐ ┌───▼───┐ ┌───▼───┐ ┌────▼────┐ ┌──▼──┐ ┌───▼────┐
│Dashboard│ │Clients│ │Finance│ │ Events  │ │Forms│ │ Admin  │
└────────┘ └───────┘ └───────┘ └─────────┘ └─────┘ └────────┘
```

### Key Components

#### AuthContext (`contexts/AuthContext.tsx`)

Manages authentication state globally:

```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
```

#### API Client (`lib/api.ts`)

Configured Axios instance with interceptors:

```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
});

// CSRF token injection
api.interceptors.request.use((config) => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')
    ?.getAttribute('content');
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  return config;
});
```

#### UI Components (`components/ui/`)

Radix UI-based accessible components:
- `button.tsx` - Button variants
- `dialog.tsx` - Modal dialogs
- `select.tsx` - Dropdown selects
- `toast.tsx` - Notifications
- And more...

---

## Database Layer

### Dual Storage Architecture

The application supports two storage backends:

```
┌─────────────────────────────────────────────────────────┐
│                    Application Code                      │
│                        (app.py)                         │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│               Data Access Layer                          │
│              (database_helpers.py)                       │
│                                                          │
│   USE_DATABASE = os.environ.get('USE_DATABASE')         │
│                                                          │
│   if USE_DATABASE:                                       │
│       → PostgreSQL (SQLAlchemy ORM)                     │
│   else:                                                  │
│       → JSON Files (Local filesystem)                   │
└─────────────────────────────────────────────────────────┘
```

### PostgreSQL Schema

| Table | Description | Key Fields |
|-------|-------------|------------|
| `users` | User accounts | user_id, password, name, role, google_credentials |
| `clients` | Client records | id, name, retainer, projects (JSONB), contacts (JSONB) |
| `suppliers` | Vendor data | id, data (JSONB) |
| `events` | Event records | id, data (JSONB) |
| `quotes` | Client quotes | id, data (JSONB) |
| `messages` | Chat messages | id, data (JSONB) |
| `forms` | Custom forms | id, data (JSONB) |
| `equipment` | Equipment bank | id, name |
| `checklist_templates` | Event checklists | category, items (JSONB) |

### JSON Files (Local Development)

| File | Content |
|------|---------|
| `agency_db.json` | Client data with nested projects/tasks |
| `users_db.json` | User accounts and credentials |
| `suppliers_db.json` | Supplier records |
| `events_db.json` | Event data |
| `quotes_db.json` | Quote records |
| `messages_db.json` | Chat messages |
| `forms_db.json` | Custom form definitions |

---

## Authentication & Security

### Authentication Flow

```
┌─────────┐    ┌─────────┐    ┌─────────────┐    ┌──────────┐
│ Client  │───▶│ /login  │───▶│ Flask-Login │───▶│ Session  │
│         │    │         │    │  validate   │    │ Created  │
└─────────┘    └─────────┘    └─────────────┘    └──────────┘
                                                       │
                                                       ▼
┌─────────┐    ┌─────────┐    ┌─────────────┐    ┌──────────┐
│ Google  │◀───│ OAuth   │◀───│ User clicks │    │ Cookie   │
│ Auth    │    │ Flow    │    │ Google btn  │    │ Set      │
└─────────┘    └─────────┘    └─────────────┘    └──────────┘
```

### Security Measures

| Feature | Implementation |
|---------|---------------|
| **Password Hashing** | Werkzeug `generate_password_hash` / `check_password_hash` |
| **Session Security** | HTTPOnly cookies, SameSite=Lax, Secure in production |
| **CSRF Protection** | Flask-WTF CSRFProtect |
| **Rate Limiting** | Flask-Limiter (200/day, 50/hour) |
| **OAuth 2.0** | Google authentication with refresh tokens |

### User Roles

| Role | Hebrew | Permissions |
|------|--------|-------------|
| Admin | אדמין | Full access, user management |
| Employee | עובד | Limited access based on assigned clients |

---

## API Layer

### REST API Design

Base URL: `/api/` for JSON endpoints

#### Common Response Format

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed"
}
```

#### Error Response

```json
{
  "success": false,
  "error": "Error message"
}
```

### Key API Endpoints

#### Authentication
```
POST /login              - User login
POST /logout             - User logout
GET  /api/current_user   - Get authenticated user
POST /reset_password     - Password reset
```

#### Clients
```
GET  /api/clients        - List all clients
GET  /api/client/<id>    - Get client details
POST /add_client         - Create client
POST /upload_logo/<id>   - Upload client logo
```

#### Projects & Tasks
```
POST /add_project/<client_id>                    - Create project
POST /add_task/<client_id>/<project_id>          - Create task
POST /update_task/<client_id>/<project_id>/<id>  - Update task
```

#### Finance
```
GET  /api/finance                - Get financial overview
POST /update_finance/<client_id> - Update client financials
GET  /generate_invoice/<id>      - Generate Excel invoice
```

#### Events
```
GET  /api/events        - List events
POST /add_event         - Create event
POST /update_event/<id> - Update event
```

---

## Deployment

### Docker Deployment

Multi-stage Dockerfile:

```dockerfile
# Stage 1: Build Frontend
FROM node:20-slim AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Python Runtime
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
COPY --from=build-stage /app/static/dist ./static/dist
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:8080"]
```

### Railway Deployment

The application is configured for Railway deployment:

1. **Procfile**: `web: gunicorn app:app --bind 0.0.0.0:$PORT`
2. **Environment Variables**:
   - `DATABASE_URL` - PostgreSQL connection string
   - `USE_DATABASE=true` - Enable PostgreSQL
   - `SECRET_KEY` - Flask secret key
   - `GOOGLE_CLIENT_ID` - OAuth client ID
   - `GOOGLE_CLIENT_SECRET` - OAuth client secret

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | Yes | Flask session encryption key |
| `DATABASE_URL` | Production | PostgreSQL connection string |
| `USE_DATABASE` | Production | Enable PostgreSQL (`true`/`false`) |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | Optional | OAuth callback URL |

---

## Development Workflow

### Local Development

```bash
# Terminal 1: Backend
python app.py  # Runs on port 5000

# Terminal 2: Frontend
yarn dev       # Runs on port 3000 with proxy to backend
```

### Build for Production

```bash
# Build frontend
yarn build

# Frontend outputs to static/dist/
# Flask serves built files automatically
```

### Database Migration

When transitioning from JSON to PostgreSQL:

```bash
# 1. Set environment variables
export USE_DATABASE=true
export DATABASE_URL=postgresql://...

# 2. Run migration script
python migrate_json_to_db.py
```

---

## Further Reading

- [QUICK_START.md](./QUICK_START.md) - Getting started guide
- [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md) - Detailed setup instructions
- [RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md) - Cloud deployment
- [GOOGLE_SETUP_INSTRUCTIONS.md](./GOOGLE_SETUP_INSTRUCTIONS.md) - OAuth configuration
- [SECURITY_AUDIT_REPORT.md](./SECURITY_AUDIT_REPORT.md) - Security documentation
