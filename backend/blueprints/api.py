"""
API Blueprint
Contains basic API endpoints for current user, sidebar data, etc.
"""
from flask import Blueprint, jsonify
from flask_login import login_required, current_user

from backend.extensions import csrf, limiter
from backend.utils.helpers import load_users, load_data
from backend.utils.permissions import get_user_role

# Create blueprint
api_bp = Blueprint('api', __name__, url_prefix='/api')


@api_bp.route('/current_user')
@limiter.exempt
def api_current_user():
    """API endpoint to get current user"""
    try:
        if not current_user.is_authenticated:
            return jsonify({'success': False, 'error': 'Not authenticated'}), 401
        
        users = load_users()
        user_data = users.get(current_user.id, {})
        
        return jsonify({
            'success': True,
            'user': {
                'id': current_user.id,
                'name': user_data.get('name', 'Unknown'),
                'email': user_data.get('email', ''),
                'role': user_data.get('role', 'עובד')
            }
        })
    except Exception as e:
        print(f"Error in api_current_user: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@api_bp.route('/sidebar_users')
@login_required
def api_sidebar_users():
    """API endpoint to get users for sidebar"""
    try:
        users = load_users()
        sorted_users = dict(sorted(users.items(), key=lambda item: item[1]['name']))
        
        # Format for React
        users_list = [
            {'id': uid, 'name': info.get('name', uid)}
            for uid, info in sorted_users.items()
        ]
        
        return jsonify({
            'success': True,
            'users': users_list,
            'users_dict': {uid: {'name': info.get('name', uid)} for uid, info in sorted_users.items()}
        })
    except Exception as e:
        print(f"Error in api_sidebar_users: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@api_bp.route('/clients')
@login_required
def api_clients():
    """API endpoint to get all clients"""
    try:
        data = load_data()
        user_role = get_user_role(current_user.id)
        
        # Filter based on user permissions
        from backend.utils.permissions import can_user_access_client, is_manager_or_admin, filter_active_clients
        
        if is_manager_or_admin(current_user.id, user_role):
            clients = filter_active_clients(data)
        else:
            clients = [c for c in filter_active_clients(data) 
                      if can_user_access_client(current_user.id, user_role, c)]
        
        return jsonify({
            'success': True,
            'clients': clients
        })
    except Exception as e:
        print(f"Error in api_clients: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@api_bp.route('/all_clients')
@login_required
def api_all_clients():
    """API endpoint to get all clients (including archived)"""
    try:
        data = load_data()
        user_role = get_user_role(current_user.id)
        users = load_users()
        
        from backend.utils.permissions import can_user_access_client, is_manager_or_admin, filter_active_clients
        
        if is_manager_or_admin(current_user.id, user_role):
            clients = filter_active_clients(data)
        else:
            clients = [c for c in filter_active_clients(data) 
                      if can_user_access_client(current_user.id, user_role, c)]
        
        # Add user names for assigned users
        for client in clients:
            assigned = client.get('assigned_user', [])
            if isinstance(assigned, str):
                assigned = [assigned]
            client['assigned_user_names'] = [
                users.get(uid, {}).get('name', uid) for uid in assigned
            ]
        
        return jsonify({
            'success': True,
            'clients': clients,
            'users': {uid: {'name': u.get('name', uid)} for uid, u in users.items()}
        })
    except Exception as e:
        print(f"Error in api_all_clients: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
