# Setup Instructions for React Migration

## Quick Start

### 1. Install Node.js (if not already installed)
Download and install Node.js 18+ from https://nodejs.org/

### 2. Install Dependencies
```bash
cd "C:\Users\Asus\Desktop\AdAgency_App"
npm install
```

### 3. Start Development Servers

**Terminal 1 - Flask Backend:**
```bash
python app.py
```
Flask will run on http://localhost:5000

**Terminal 2 - React Frontend:**
```bash
npm run dev
```
Vite will run on http://localhost:3000

### 4. Access the Application
Open http://localhost:3000 in your browser

## Required Flask API Endpoints

The React app expects these JSON API endpoints. You may need to add them to `app.py`:

### 1. Quick Update Tasks Endpoint
```python
@app.route('/api/quick_update_tasks')
@login_required
def api_quick_update_tasks():
    """Return all tasks for quick update page"""
    data = load_data()
    tasks = []
    
    for client in data:
        for project in client.get('projects', []):
            for task in project.get('tasks', []):
                if task.get('status') in ['ממתין', 'בביצוע']:  # Only active tasks
                    tasks.append({
                        'client_id': client['id'],
                        'client_name': client.get('name', ''),
                        'project_id': project['id'],
                        'project_title': project.get('title', ''),
                        'task': {
                            'id': task['id'],
                            'desc': task.get('desc', ''),
                            'status': task.get('status', 'ממתין'),
                            'notes': task.get('notes', ''),
                            'assigned_to_name': task.get('assigned_to_name', '')
                        }
                    })
    
    return jsonify({
        'success': True,
        'tasks': tasks
    })
```

### 2. Update Task Endpoint (should already exist)
The endpoint `/update_task/<client_id>/<project_id>/<task_id>` should accept JSON:
```python
@app.route('/update_task/<client_id>/<project_id>/<task_id>', methods=['POST'])
@login_required
def update_task(client_id, project_id, task_id):
    # Accept JSON or form data
    if request.is_json:
        status = request.json.get('status')
        notes = request.json.get('notes', '')
    else:
        status = request.form.get('status')
        notes = request.form.get('notes', '')
    
    # ... existing update logic ...
    
    return jsonify({
        'status': 'success',
        'message': 'Task updated successfully'
    })
```

## Project Structure

```
AdAgency_App/
├── src/                          # NEW: React source
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   └── layout/              # Layout components
│   ├── pages/                   # Page components
│   ├── lib/                     # Utilities
│   └── index.css                # Tailwind CSS
├── templates/                    # OLD: Keep for reference
├── static/                       # Static assets
└── app.py                        # Flask backend (keep as API)
```

## Migration Progress

✅ **Completed:**
- React + Vite + TypeScript setup
- Tailwind CSS + shadcn/ui configuration
- Base components (Button, Input, Select, Card, Dialog, etc.)
- Layout with Sidebar
- QuickUpdate page (needs Flask endpoint)
- Login page
- Routing structure
- API client with CSRF support

🚧 **Next Steps:**
1. Add Flask API endpoints (see above)
2. Migrate Dashboard page
3. Migrate Client page
4. Migrate remaining pages
5. Add authentication context
6. Test all functionality

## Troubleshooting

### "npm is not recognized"
- Install Node.js from https://nodejs.org/
- Restart terminal after installation

### Port already in use
- Change Vite port in `vite.config.ts`: `server: { port: 3001 }`
- Or change Flask port in `app.py`

### CORS errors
- Vite proxy should handle this automatically
- Check `vite.config.ts` proxy configuration

### CSRF token errors
- API client automatically handles CSRF tokens
- Ensure Flask sends CSRF token in response headers or meta tag

## Development Workflow

1. **Make changes to React components** in `src/`
2. **Hot reload** will automatically refresh the browser
3. **Test API calls** - ensure Flask endpoints return JSON
4. **Migrate pages one by one** - start with simpler ones

## Building for Production

```bash
npm run build
```

This creates a `dist/` folder with production-ready files.

To preview production build:
```bash
npm run preview
```

## Notes

- The Flask backend continues to serve as the API
- Old templates in `templates/` can be kept for reference
- Static files in `static/` are accessible via `/static/` path
- RTL (right-to-left) support is maintained for Hebrew

