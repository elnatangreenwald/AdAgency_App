"""
Admin Blueprint
Contains routes for user management and admin functions
"""
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from werkzeug.security import generate_password_hash

from backend.extensions import csrf
from backend.utils.helpers import load_users, save_users, load_forms, save_forms, load_data
from backend.utils.permissions import get_user_role, is_manager_or_admin

# Create blueprint
admin_bp = Blueprint('admin', __name__)


def admin_required(f):
    """Decorator to require admin or manager role"""
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_role = get_user_role(current_user.id)
        if not is_manager_or_admin(current_user.id, user_role):
            return jsonify({'success': False, 'error': 'Access denied'}), 403
        return f(*args, **kwargs)
    return decorated_function


@admin_bp.route('/api/admin/users')
@login_required
@admin_required
def api_admin_users():
    """Get all users for admin"""
    try:
        users = load_users()
        
        users_list = [
            {
                'id': uid,
                'name': info.get('name', uid),
                'email': info.get('email', ''),
                'role': info.get('role', 'עובד'),
                'phone': info.get('phone', ''),
                'created_at': info.get('created_at', '')
            }
            for uid, info in users.items()
        ]
        
        # Sort by name
        users_list.sort(key=lambda x: x['name'])
        
        return jsonify({
            'success': True,
            'users': users_list
        })
    except Exception as e:
        print(f"Error in api_admin_users: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@admin_bp.route('/admin/users', methods=['POST'])
@login_required
@admin_required
@csrf.exempt
def admin_users_action():
    """Handle user management actions"""
    try:
        action = request.form.get('action')
        
        if action == 'add':
            return add_user()
        elif action == 'edit':
            return edit_user()
        elif action == 'delete':
            return delete_user()
        else:
            return jsonify({'success': False, 'error': 'Invalid action'}), 400
    except Exception as e:
        print(f"Error in admin_users_action: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


def add_user():
    """Add new user"""
    users = load_users()
    
    username = request.form.get('username', '').strip()
    if not username:
        return jsonify({'success': False, 'error': 'שם משתמש חסר'}), 400
    
    if username in users:
        return jsonify({'success': False, 'error': 'שם משתמש כבר קיים'}), 400
    
    password = request.form.get('password', '').strip()
    if not password:
        return jsonify({'success': False, 'error': 'סיסמה חסרה'}), 400
    
    users[username] = {
        'password': generate_password_hash(password),
        'name': request.form.get('name', username),
        'email': request.form.get('email', ''),
        'phone': request.form.get('phone', ''),
        'role': request.form.get('role', 'עובד'),
        'hourly_rate': float(request.form.get('hourly_rate', 0) or 0),
        'created_at': datetime.now().isoformat(),
        'created_by': current_user.id
    }
    
    save_users(users)
    
    return jsonify({'success': True})


def edit_user():
    """Edit existing user"""
    users = load_users()
    
    username = request.form.get('username', '').strip()
    if not username or username not in users:
        return jsonify({'success': False, 'error': 'משתמש לא נמצא'}), 404
    
    # Update fields
    if 'name' in request.form:
        users[username]['name'] = request.form.get('name')
    if 'email' in request.form:
        users[username]['email'] = request.form.get('email')
    if 'phone' in request.form:
        users[username]['phone'] = request.form.get('phone')
    if 'role' in request.form:
        users[username]['role'] = request.form.get('role')
    if 'hourly_rate' in request.form:
        users[username]['hourly_rate'] = float(request.form.get('hourly_rate', 0) or 0)
    
    # Update password if provided
    password = request.form.get('password', '').strip()
    if password:
        users[username]['password'] = generate_password_hash(password)
    
    users[username]['updated_at'] = datetime.now().isoformat()
    save_users(users)
    
    return jsonify({'success': True})


def delete_user():
    """Delete user"""
    users = load_users()
    
    username = request.form.get('username', '').strip()
    if not username or username not in users:
        return jsonify({'success': False, 'error': 'משתמש לא נמצא'}), 404
    
    # Don't allow deleting admin
    if username == 'admin':
        return jsonify({'success': False, 'error': 'לא ניתן למחוק את מנהל המערכת'}), 400
    
    del users[username]
    save_users(users)
    
    return jsonify({'success': True})


@admin_bp.route('/api/forms')
@login_required
def api_forms():
    """Get all forms"""
    try:
        forms = load_forms()
        clients = load_data()
        
        # Sort by creation date
        forms.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return jsonify({
            'success': True,
            'forms': forms,
            'clients': [{'id': c['id'], 'name': c.get('name', '')} for c in clients]
        })
    except Exception as e:
        print(f"Error in api_forms: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@admin_bp.route('/admin/forms/create', methods=['POST'])
@login_required
@csrf.exempt
def create_form():
    """Create new form"""
    try:
        forms = load_forms()
        
        title = request.form.get('title', '').strip()
        if not title:
            return jsonify({'success': False, 'error': 'כותרת טופס חסרה'}), 400
        
        # Generate unique token for public access
        form_token = str(uuid.uuid4())
        
        new_form = {
            'id': str(uuid.uuid4()),
            'token': form_token,
            'title': title,
            'description': request.form.get('description', ''),
            'client_id': request.form.get('client_id', ''),
            'fields': [],
            'submissions': [],
            'active': True,
            'created_by': current_user.id,
            'created_at': datetime.now().isoformat()
        }
        
        # Parse fields from JSON
        fields_json = request.form.get('fields', '[]')
        try:
            import json
            new_form['fields'] = json.loads(fields_json)
        except:
            pass
        
        forms.append(new_form)
        save_forms(forms)
        
        return jsonify({'success': True, 'form': new_form, 'token': form_token})
    except Exception as e:
        print(f"Error in create_form: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@admin_bp.route('/admin/forms/<form_id>', methods=['POST'])
@login_required
@csrf.exempt
def update_form(form_id):
    """Update form"""
    try:
        forms = load_forms()
        form = next((f for f in forms if f['id'] == form_id), None)
        
        if not form:
            return jsonify({'success': False, 'error': 'Form not found'}), 404
        
        # Update fields
        for field in ['title', 'description', 'client_id']:
            if field in request.form:
                form[field] = request.form.get(field)
        
        if 'active' in request.form:
            form['active'] = request.form.get('active', '').lower() == 'true'
        
        # Parse fields from JSON
        fields_json = request.form.get('fields')
        if fields_json:
            try:
                import json
                form['fields'] = json.loads(fields_json)
            except:
                pass
        
        form['updated_at'] = datetime.now().isoformat()
        save_forms(forms)
        
        return jsonify({'success': True, 'form': form})
    except Exception as e:
        print(f"Error in update_form: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@admin_bp.route('/admin/forms/<form_id>/delete', methods=['POST'])
@login_required
@csrf.exempt
def delete_form(form_id):
    """Delete form"""
    try:
        forms = load_forms()
        forms = [f for f in forms if f['id'] != form_id]
        save_forms(forms)
        
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error in delete_form: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
