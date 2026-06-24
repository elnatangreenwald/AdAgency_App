# AdAgency App

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-green.svg)
![React](https://img.shields.io/badge/react-18.2-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.2-3178C6.svg)
![License](https://img.shields.io/badge/license-MIT-orange.svg)

**A comprehensive agency management system for advertising and event production companies**

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Documentation](#-documentation)

</div>

---

## 📖 Overview

AdAgency App (ותקין) is a full-stack web application designed to streamline operations for advertising agencies and event production companies. Built with a **Python/Flask** backend and **React/TypeScript** frontend, it provides a unified platform for managing clients, projects, finances, events, and suppliers.

### Why AdAgency App?

| Challenge | Solution |
|-----------|----------|
| Scattered client information | **Centralized client database** with documents, contacts, and history |
| Manual task tracking | **Project boards with Gantt views** and automated status updates |
| Complex financial tracking | **Integrated finance module** with retainers, charges, and invoice generation |
| Event planning chaos | **Event management** with checklists, equipment, and supplier coordination |
| Team collaboration gaps | **Real-time chat** and time tracking for team coordination |

---

## ✨ Features

### 📊 Dashboard
- Task calendar with FullCalendar integration
- Quick task and charge creation
- Client search with instant navigation
- Status-based task filtering

### 👥 Client Management
- Complete client profiles with contacts
- Document and logo storage
- Client-specific project tracking
- Automated client numbering

### 📋 Project & Task Tracking
- Hierarchical project structure
- Task assignments with deadlines
- Status workflow (To Do → In Progress → Review → Done)
- Gantt chart visualization
- Quick update interface

### 💰 Financial Management
- Monthly retainer tracking
- Extra charges management
- Open/closed charge status
- Excel invoice generation
- Cost vs. revenue analysis

### 🎪 Event Planning
- Event calendar with drag-and-drop
- Customizable checklists by event type
- Equipment bank management
- Supplier assignments per event
- Graphics and management tables
- Shopping list generation

### 🏢 Supplier Management
- Vendor database with categories
- Contact information storage
- File attachments per supplier
- Notes and communication history

### 📝 Custom Forms
- Form builder with multiple field types
- Public form URLs for external submissions
- File upload support
- Submission tracking

### ⏱️ Time Tracking
- Per-task time logging
- Employee time reports
- Exportable time sheets

### 🔐 Admin & Security
- Role-based access (Admin/Employee)
- User management dashboard
- Google OAuth integration
- Password reset via email
- CSRF protection & rate limiting

---

## 🚀 Quick Start

### Prerequisites

- **Python** 3.11+
- **Node.js** 18+
- **Yarn** (recommended) or npm
- **PostgreSQL** (optional, for production)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/AdAgency_App.git
cd AdAgency_App

# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies
yarn install
```

### Configuration

Create a `.env` file in the project root:

```env
# Required
SECRET_KEY=your-secret-key-here

# Optional - Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://127.0.0.1:5000/auth/google/callback

# Production - PostgreSQL
USE_DATABASE=false
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# External webhook (Base44 charge integration)
CHARGE_WEBHOOK_API_KEY=your-webhook-secret-key
```

### Running Locally

```bash
# Terminal 1: Start the backend
python app.py
# → Backend runs on http://localhost:5000

# Terminal 2: Start the frontend development server
yarn dev
# → Frontend runs on http://localhost:3000
```

Open **http://localhost:3000** in your browser.

**Default credentials:**
- Username: `admin`
- Password: `1234`

> ⚠️ **Important:** Change the default password after first login!

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      React Frontend                          │
│    Dashboard │ Clients │ Finance │ Events │ Suppliers       │
└────────────────────────────┬────────────────────────────────┘
                             │ REST API (Axios)
┌────────────────────────────▼────────────────────────────────┐
│                      Flask Backend                           │
│        Authentication │ CRUD APIs │ File Handling           │
└────────────────────────────┬────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼                             ▼
       ┌─────────────┐              ┌─────────────┐
       │ JSON Files  │              │ PostgreSQL  │
       │   (Local)   │              │ (Production)│
       └─────────────┘              └─────────────┘
```

### Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Radix UI |
| **Backend** | Python 3.11, Flask, SQLAlchemy, Gunicorn |
| **Database** | JSON files (dev) / PostgreSQL (prod) |
| **Auth** | Flask-Login, Google OAuth 2.0 |
| **Deployment** | Docker, Railway |

For detailed architecture information, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 📁 Project Structure

```
AdAgency_App/
├── src/                    # React frontend
│   ├── components/         # Reusable components
│   │   ├── layout/         # Layout components
│   │   └── ui/             # UI primitives
│   ├── pages/              # Page components
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom hooks
│   └── lib/                # Utilities
│
├── static/                 # Static files & uploads
├── templates/              # Flask templates
│
├── app.py                  # Flask application
├── database.py             # SQLAlchemy models
├── database_helpers.py     # Data access layer
├── google_auth.py          # Google OAuth
│
├── *_db.json               # JSON data files
├── requirements.txt        # Python dependencies
├── package.json            # Node.js dependencies
└── Dockerfile              # Container config
```

---

## 🌐 Deployment

### Docker

```bash
# Build the image
docker build -t adagency-app .

# Run the container
docker run -p 8080:8080 \
  -e SECRET_KEY=your-secret \
  -e USE_DATABASE=true \
  -e DATABASE_URL=postgresql://... \
  adagency-app
```

### Railway

1. Connect your GitHub repository to Railway
2. Set environment variables:
   - `SECRET_KEY`
   - `USE_DATABASE=true`
   - `DATABASE_URL` (auto-generated with Railway PostgreSQL)
3. Deploy automatically on push

See [RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md) for details.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Detailed system architecture |
| [QUICK_START.md](./QUICK_START.md) | Getting started guide |
| [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md) | Complete setup instructions |
| [RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md) | Cloud deployment guide |
| [GOOGLE_SETUP_INSTRUCTIONS.md](./GOOGLE_SETUP_INSTRUCTIONS.md) | OAuth configuration |
| [EMAIL_USAGE_DOCUMENTATION.md](./EMAIL_USAGE_DOCUMENTATION.md) | Email integration |
| [SECURITY_AUDIT_REPORT.md](./SECURITY_AUDIT_REPORT.md) | Security documentation |
| [MIGRATION_README.md](./MIGRATION_README.md) | Database migration guide |

---

## 🔧 Development

### Available Scripts

```bash
# Frontend
yarn dev          # Start development server
yarn build        # Build for production
yarn preview      # Preview production build
yarn lint         # Run ESLint

# Backend
python app.py     # Start Flask development server
gunicorn app:app  # Start production server
```

### Database Migration

To migrate from JSON files to PostgreSQL:

```bash
# Set environment
export USE_DATABASE=true
export DATABASE_URL=postgresql://...

# Run migration
python migrate_json_to_db.py
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Flask](https://flask.palletsprojects.com/) - Web framework
- [React](https://react.dev/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Radix UI](https://www.radix-ui.com/) - Accessible components
- [FullCalendar](https://fullcalendar.io/) - Calendar component

---

<div align="center">

**Built with ❤️ for agency management**

[Report Bug](https://github.com/yourusername/AdAgency_App/issues) • [Request Feature](https://github.com/yourusername/AdAgency_App/issues)

</div>