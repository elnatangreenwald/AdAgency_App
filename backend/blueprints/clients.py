"""
Clients Blueprint
Contains routes for client management, projects, and tasks
"""
import json
import os
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename

from backend.extensions import csrf, limiter
from backend.utils.helpers import (
    load_data, save_data, load_users,
    get_next_client_number, get_next_project_number,
    get_next_task_number, get_next_charge_number, get_next_workday
)
from backend.utils.permissions import get_user_role, can_user_access_client, is_manager_or_admin
from backend.utils.notifications import create_notification

# Create blueprint
clients_bp = Blueprint('clients', __name__)

# Directory paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LOGOS_FOLDER = os.path.join(BASE_DIR, 'static', 'logos')
DOCUMENTS_FOLDER = os.path.join(BASE_DIR, 'static', 'documents')
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'client_docs')


@clients_bp.route('/api/client/<client_id>')
@login_required
def api_get_client(client_id):
    """Get client data"""
    try:
        data = load_data()
        client = next((c for c in data if c['id'] == client_id), None)
        
        if not client:
            return jsonify({'success': False, 'error': 'Client not found'}), 404
        
        user_role = get_user_role(current_user.id)
        if not can_user_access_client(current_user.id, user_role, client):
            return jsonify({'success': False, 'error': 'Access denied'}), 403
        
        users = load_users()
        
        return jsonify({
            'success': True,
            'client': client,
            'users': {uid: {'name': u.get('name', uid)} for uid, u in users.items()}
        })
    except Exception as e:
        print(f"Error in api_get_client: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@clients_bp.route('/get_client_projects/<client_id>')
@login_required
def get_client_projects(client_id):
    """Get projects for a client"""
    try:
        data = load_data()
        client = next((c for c in data if c['id'] == client_id), None)
        
        if not client:
            return jsonify({'success': False, 'error': 'Client not found'}), 404
        
        return jsonify({
            'success': True,
            'projects': client.get('projects', [])
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@clients_bp.route('/add_client', methods=['POST'])
@login_required
@csrf.exempt
def add_client():
    """Add new client"""
    try:
        data = load_data()
        
        # Get form data
        name = request.form.get('name', '').strip()
        
        if not name:
            return jsonify({'success': False, 'error': 'שם לקוח חסר'}), 400
        
        # Create new client
        new_client = {
            'id': str(uuid.uuid4()),
            'client_number': get_next_client_number(),
            'name': name,
            'contact_name': request.form.get('contact_name', ''),
            'email': request.form.get('email', ''),
            'phone': request.form.get('phone', ''),
            'address': request.form.get('address', ''),
            'notes': request.form.get('notes', ''),
            'retainer': float(request.form.get('retainer', 0) or 0),
            'assigned_user': request.form.getlist('assigned_user') or [],
            'projects': [],
            'extra_charges': [],
            'activities': [],
            'contacts': [],
            'documents': [],
            'created_at': datetime.now().isoformat(),
            'archived': False,
            'active': True
        }
        
        data.append(new_client)
        save_data(data)
        
        return jsonify({'success': True, 'client_id': new_client['id']})
    except Exception as e:
        print(f"Error in add_client: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@clients_bp.route('/add_project/<client_id>', methods=['POST'])
@login_required
@csrf.exempt
def add_project(client_id):
    """Add project to client"""
    try:
        data = load_data()
        client = next((c for c in data if c['id'] == client_id), None)
        
        if not client:
            return jsonify({'success': False, 'error': 'Client not found'}), 404
        
        name = request.form.get('name', '').strip()
        if not name:
            return jsonify({'success': False, 'error': 'שם פרויקט חסר'}), 400
        
        if 'projects' not in client:
            client['projects'] = []
        
        new_project = {
            'id': str(uuid.uuid4()),
            'project_number': get_next_project_number(client),
            'name': name,
            'description': request.form.get('description', ''),
            'status': request.form.get('status', 'בתהליך'),
            'start_date': request.form.get('start_date', ''),
            'end_date': request.form.get('end_date', ''),
            'budget': float(request.form.get('budget', 0) or 0),
            'tasks': [],
            'created_at': datetime.now().isoformat()
        }
        
        client['projects'].append(new_project)
        save_data(data)
        
        return jsonify({'success': True, 'project': new_project})
    except Exception as e:
        print(f"Error in add_project: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@clients_bp.route('/add_task/<client_id>/<project_id>', methods=['POST'])
@login_required
@csrf.exempt
def add_task(client_id, project_id):
    """Add task to project"""
    try:
        data = load_data()
        users = load_users()
        client = next((c for c in data if c['id'] == client_id), None)
        
        if not client:
            return jsonify({'success': False, 'error': 'Client not found'}), 404
        
        project = next((p for p in client.get('projects', []) if p['id'] == project_id), None)
        
        if not project:
            return jsonify({'success': False, 'error': 'Project not found'}), 404
        
        title = request.form.get('title', '').strip()
        if not title:
            return jsonify({'success': False, 'error': 'כותרת משימה חסרה'}), 400
        
        if 'tasks' not in project:
            project['tasks'] = []
        
        # Handle assigned users - support both 'assigned_user' and 'assigned_to'
        assigned_users = request.form.getlist('assigned_user')
        if not assigned_users:
            assigned_user = request.form.get('assigned_user', '') or request.form.get('assigned_to', '')
            assigned_users = [assigned_user] if assigned_user else []
        
        # If no assignee specified, assign to current user
        if not assigned_users or (len(assigned_users) == 1 and not assigned_users[0]):
            assigned_users = [current_user.id]
        
        # Get due date
        due_date = request.form.get('due_date', '')
        if not due_date:
            due_date = get_next_workday().strftime('%Y-%m-%d')
        
        # Check if recurring (daily) task
        is_recurring = request.form.get('is_recurring') == 'on' or request.form.get('is_recurring') == 'true'
        
        # Get creator info
        created_by = current_user.id
        creator_name = users.get(created_by, {}).get('name', created_by)
        
        new_task = {
            'id': str(uuid.uuid4()),
            'task_number': get_next_task_number(client, project),
            'title': title,
            'description': request.form.get('description', ''),
            'status': 'לביצוע',
            'priority': request.form.get('priority', 'רגילה'),
            'due_date': due_date,
            'assigned_user': assigned_users,
            'created_by': created_by,  # NEW: Track who created the task
            'notes': '',
            'is_recurring': is_recurring,
            'created_at': datetime.now().isoformat()
        }
        
        project['tasks'].append(new_task)
        save_data(data)
        
        # Create notification if assigned to someone else
        for assigned_user_id in assigned_users:
            if assigned_user_id and assigned_user_id != created_by:
                create_notification(
                    user_id=assigned_user_id,
                    notification_type='task_assigned',
                    data={
                        'task_id': new_task['id'],
                        'client_id': client_id,
                        'project_id': project_id,
                        'from_user_id': created_by,
                        'from_user_name': creator_name,
                        'task_title': title,
                        'client_name': client.get('name', '')
                    }
                )
        
        return jsonify({'success': True, 'task': new_task})
    except Exception as e:
        print(f"Error in add_task: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@clients_bp.route('/update_task_status/<client_id>/<project_id>/<task_id>', methods=['POST'])
@login_required
@csrf.exempt
def update_task_status(client_id, project_id, task_id):
    """Update task status"""
    try:
        data = load_data()
        client = next((c for c in data if c['id'] == client_id), None)
        
        if not client:
            return jsonify({'success': False, 'error': 'Client not found'}), 404
        
        project = next((p for p in client.get('projects', []) if p['id'] == project_id), None)
        
        if not project:
            return jsonify({'success': False, 'error': 'Project not found'}), 404
        
        task = next((t for t in project.get('tasks', []) if t['id'] == task_id), None)
        
        if not task:
            return jsonify({'success': False, 'error': 'Task not found'}), 404
        
        new_status = request.form.get('status', task.get('status'))
        task['status'] = new_status
        
        # Handle recurring tasks
        if new_status == 'הושלם' and task.get('is_recurring'):
            # Create a new task for tomorrow
            tomorrow = get_next_workday(datetime.now() + timedelta(days=1))
            new_task = {
                'id': str(uuid.uuid4()),
                'task_number': get_next_task_number(client, project),
                'title': task['title'],
                'description': task.get('description', ''),
                'status': 'לביצוע',
                'priority': task.get('priority', 'רגילה'),
                'due_date': tomorrow.strftime('%Y-%m-%d'),
                'assigned_user': task.get('assigned_user', []),
                'notes': '',
                'is_recurring': True,
                'created_at': datetime.now().isoformat()
            }
            project['tasks'].append(new_task)
        
        task['updated_at'] = datetime.now().isoformat()
        save_data(data)
        
        return jsonify({'success': True, 'task': task})
    except Exception as e:
        print(f"Error in update_task_status: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@clients_bp.route('/update_task/<client_id>/<project_id>/<task_id>', methods=['POST'])
@login_required
@csrf.exempt
def update_task(client_id, project_id, task_id):
    """Update task details"""
    try:
        data = load_data()
        client = next((c for c in data if c['id'] == client_id), None)
        
        if not client:
            return jsonify({'success': False, 'error': 'Client not found'}), 404
        
        project = next((p for p in client.get('projects', []) if p['id'] == project_id), None)
        
        if not project:
            return jsonify({'success': False, 'error': 'Project not found'}), 404
        
        task = next((t for t in project.get('tasks', []) if t['id'] == task_id), None)
        
        if not task:
            return jsonify({'success': False, 'error': 'Task not found'}), 404
        
        # Update fields
        if 'title' in request.form:
            task['title'] = request.form.get('title')
        if 'description' in request.form:
            task['description'] = request.form.get('description')
        if 'status' in request.form:
            task['status'] = request.form.get('status')
        if 'priority' in request.form:
            task['priority'] = request.form.get('priority')
        if 'due_date' in request.form:
            task['due_date'] = request.form.get('due_date')
        if 'assigned_user' in request.form:
            assigned_users = request.form.getlist('assigned_user')
            task['assigned_user'] = assigned_users if assigned_users else []
        if 'is_recurring' in request.form:
            task['is_recurring'] = request.form.get('is_recurring') in ['on', 'true', True]
        
        task['updated_at'] = datetime.now().isoformat()
        save_data(data)
        
        return jsonify({'success': True, 'task': task})
    except Exception as e:
        print(f"Error in update_task: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@clients_bp.route('/delete_task/<client_id>/<project_id>/<task_id>', methods=['POST'])
@login_required
@csrf.exempt
def delete_task(client_id, project_id, task_id):
    """Delete a task"""
    try:
        # region agent log
        with open(DEBUG_LOG_PATH, 'a', encoding='utf-8') as log_file:
            log_file.write(json.dumps({
                'sessionId': 'debug-session',
                'runId': 'initial',
                'hypothesisId': 'H1',
                'location': 'clients.py:329',
                'message': 'delete_task entry',
                'data': {
                    'client_id': client_id,
                    'project_id': project_id,
                    'task_id': task_id,
                },
                'timestamp': int(datetime.now().timestamp() * 1000),
            }) + '\n')
        # endregion
        data = load_data()
        client = next((c for c in data if c['id'] == client_id), None)
        
        if not client:
            return jsonify({'success': False, 'error': 'Client not found'}), 404

        project = next((p for p in client.get('projects', []) if p['id'] == project_id), None)
        
        if not project:
            return jsonify({'success': False, 'error': 'Project not found'}), 404

        # region agent log
        with open(DEBUG_LOG_PATH, 'a', encoding='utf-8') as log_file:
            log_file.write(json.dumps({
                'sessionId': 'debug-session',
                'runId': 'initial',
                'hypothesisId': 'H1',
                'location': 'clients.py:347',
                'message': 'delete_task client/project lookup',
                'data': {
                    'client_found': True,
                    'project_found': True,
                },
                'timestamp': int(datetime.now().timestamp() * 1000),
            }) + '\n')
        # endregion
        
        original_count = len(project.get('tasks', []))
        filtered_tasks = [t for t in project.get('tasks', []) if t['id'] != task_id]
        project['tasks'] = filtered_tasks
        # region agent log
        with open(DEBUG_LOG_PATH, 'a', encoding='utf-8') as log_file:
            log_file.write(json.dumps({
                'sessionId': 'debug-session',
                'runId': 'initial',
                'hypothesisId': 'H1',
                'location': 'clients.py:349',
                'message': 'delete_task filtered tasks',
                'data': {
                    'original_count': original_count,
                    'remaining_count': len(filtered_tasks),
                },
                'timestamp': int(datetime.now().timestamp() * 1000),
            }) + '\n')
        # endregion
        save_data(data)
        
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error in delete_task: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@clients_bp.route('/delete_project/<client_id>/<project_id>', methods=['POST'])
@login_required
@csrf.exempt
def delete_project(client_id, project_id):
    """Delete a project"""
    try:
        data = load_data()
        client = next((c for c in data if c['id'] == client_id), None)
        
        if not client:
            return jsonify({'success': False, 'error': 'Client not found'}), 404
        
        client['projects'] = [p for p in client.get('projects', []) if p['id'] != project_id]
        save_data(data)
        
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error in delete_project: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@clients_bp.route('/toggle_client_active/<client_id>', methods=['POST'])
@login_required
@csrf.exempt
def toggle_client_active(client_id):
    """Toggle client active status"""
    try:
        data = load_data()
        client = next((c for c in data if c['id'] == client_id), None)
        
        if not client:
            return jsonify({'success': False, 'error': 'Client not found'}), 404
        
        # Toggle active status
        current_active = client.get('active', True)
        client['active'] = not current_active
        save_data(data)
        
        return jsonify({
            'success': True,
            'active': client['active'],
            'message': 'לקוח פעיל' if client['active'] else 'לקוח לא פעיל'
        })
    except Exception as e:
        print(f"Error in toggle_client_active: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@clients_bp.route('/archive_client/<client_id>', methods=['POST'])
@login_required
@csrf.exempt
def archive_client(client_id):
    """Archive a client"""
    try:
        data = load_data()
        client = next((c for c in data if c['id'] == client_id), None)
        
        if not client:
            return jsonify({'success': False, 'error': 'Client not found'}), 404
        
        client['archived'] = True
        client['archived_at'] = datetime.now().isoformat()
        save_data(data)
        
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error in archive_client: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@clients_bp.route('/upload_logo/<client_id>', methods=['POST'])
@login_required
@csrf.exempt
def upload_logo(client_id):
    """Upload client logo"""
    try:
        if 'logo' not in request.files:
            return jsonify({'success': False, 'error': 'No file uploaded'}), 400
        
        file = request.files['logo']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        # Secure filename
        filename = secure_filename(file.filename)
        ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else 'png'
        new_filename = f"{client_id}_logo.{ext}"
        
        # Save file
        os.makedirs(LOGOS_FOLDER, exist_ok=True)
        filepath = os.path.join(LOGOS_FOLDER, new_filename)
        file.save(filepath)
        
        # Update client
        data = load_data()
        client = next((c for c in data if c['id'] == client_id), None)
        
        if client:
            client['logo'] = f"/static/logos/{new_filename}"
            save_data(data)
        
        return jsonify({'success': True, 'logo_url': f"/static/logos/{new_filename}"})
    except Exception as e:
        print(f"Error in upload_logo: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# Import timedelta for recurring tasks
from datetime import timedelta
