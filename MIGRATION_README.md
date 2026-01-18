# React Migration Guide

This document outlines the migration from Flask/Jinja2 templates to React + Vite + TypeScript with Tailwind CSS and shadcn/ui.

## Project Structure

```
AdAgency_App/
├── src/                          # React source code
│   ├── components/              # React components
│   │   ├── ui/                  # shadcn/ui components
│   │   └── layout/              # Layout components (Sidebar, etc.)
│   ├── pages/                   # Page components
│   ├── lib/                     # Utilities and API client
│   └── index.css                # Tailwind CSS
├── templates/                    # OLD: Flask templates (to be migrated)
├── static/                       # Static assets (images, etc.)
├── app.py                        # Flask backend (API endpoints)
├── package.json                  # Node.js dependencies
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # Tailwind configuration
└── tsconfig.json                # TypeScript configuration
```

## Installation

### Prerequisites
- Node.js 18+ and npm installed
- Python 3.8+ with Flask backend running

### Steps

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```
   This will start Vite dev server on http://localhost:3000

3. **Keep Flask backend running:**
   ```bash
   python app.py
   ```
   Flask should run on http://localhost:5000

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Migration Status

### ✅ Completed
- [x] React + Vite + TypeScript setup
- [x] Tailwind CSS configuration
- [x] shadcn/ui components (Button, Input, Select, Card, Dialog, etc.)
- [x] Base Layout with Sidebar component
- [x] QuickUpdate page migration
- [x] API client utilities
- [x] Routing setup

### 🚧 In Progress
- [ ] Dashboard page migration
- [ ] Client page migration
- [ ] Other pages migration

### 📋 Pending
- [ ] Full Dashboard with calendar integration
- [ ] Client page with all features
- [ ] Finance page
- [ ] Events page
- [ ] Suppliers page
- [ ] Quotes page
- [ ] Forms page
- [ ] Admin pages
- [ ] Authentication context/state management
- [ ] Error handling and loading states
- [ ] Form validation
- [ ] File uploads
- [ ] Real-time updates (if needed)

## API Integration

The React app communicates with the Flask backend through:
- **API Client**: `src/lib/api.ts` - Axios instance with CSRF token handling
- **Proxy Configuration**: Vite proxy in `vite.config.ts` routes API calls to Flask

### Required Flask API Endpoints

You may need to add JSON API endpoints in Flask for:
- `/api/quick_update_tasks` - Returns tasks for quick update page
- Other endpoints as needed for each page

Example Flask endpoint:
```python
@app.route('/api/quick_update_tasks')
@login_required
def api_quick_update_tasks():
    # Your existing logic to get tasks
    tasks = get_all_tasks_for_quick_update()
    return jsonify({
        'success': True,
        'tasks': tasks
    })
```

## Component Migration Guide

### Converting Jinja2 Templates to React

1. **Replace Jinja2 syntax:**
   - `{% for item in items %}` → `{items.map(item => ...)}`
   - `{{ variable }}` → `{variable}`
   - `{% if condition %}` → `{condition && ...}`

2. **Replace inline styles:**
   - Convert CSS classes to Tailwind utilities
   - Use shadcn/ui components where applicable

3. **Form handling:**
   - Use React state (`useState`)
   - Use `apiClient` from `@/lib/api` for API calls
   - Handle CSRF tokens automatically via API client

4. **Navigation:**
   - Use `react-router-dom` `Link` and `useNavigate`
   - Replace `href` with `to` prop

## Styling Guidelines

- Use Tailwind CSS utility classes
- Follow shadcn/ui component patterns
- Maintain RTL (right-to-left) support for Hebrew
- Use CSS variables defined in `src/index.css` for theming
- Keep responsive design with Tailwind breakpoints

## Next Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development:**
   ```bash
   npm run dev
   ```

3. **Migrate pages one by one:**
   - Start with simpler pages
   - Test each migration thoroughly
   - Update Flask endpoints to return JSON when needed

4. **Clean up:**
   - Once migration is complete, old templates can be archived
   - Update Flask to serve only API endpoints
   - Consider adding API documentation

## Troubleshooting

### Port conflicts
- Vite default port: 3000
- Flask default port: 5000
- Adjust in `vite.config.ts` if needed

### CORS issues
- Vite proxy should handle this
- Check `vite.config.ts` proxy configuration

### CSRF token issues
- API client automatically handles CSRF tokens
- Ensure Flask sends CSRF token in meta tag or response header

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Router](https://reactrouter.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [TypeScript](https://www.typescriptlang.org/)

