"""
API Blueprint
Contains basic API endpoints for current user, sidebar data, notifications, etc.
"""
from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user

from backend.extensions import csrf, limiter
from backend.utils.helpers import load_users, load_data
from backend.utils.permissions import get_user_role
from backend.utils.notifications import (
    get_user_notifications, get_unread_count, 
    mark_notifications_read, get_new_notifications_since
)

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


# ==================== NOTIFICATIONS API ====================

@api_bp.route('/notifications')
@login_required
def api_get_notifications():
    """Get notifications for the current user"""
    try:
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        limit = int(request.args.get('limit', 50))
        
        notifications = get_user_notifications(
            current_user.id, 
            unread_only=unread_only,
            limit=limit
        )
        
        return jsonify({
            'success': True,
            'notifications': notifications
        })
    except Exception as e:
        print(f"Error in api_get_notifications: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@api_bp.route('/notifications/unread-count')
@login_required
@limiter.exempt
def api_unread_notifications_count():
    """Get count of unread notifications for the current user"""
    try:
        count = get_unread_count(current_user.id)
        
        return jsonify({
            'success': True,
            'count': count
        })
    except Exception as e:
        print(f"Error in api_unread_notifications_count: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@api_bp.route('/notifications/new')
@login_required
@limiter.exempt
def api_new_notifications():
    """Get new notifications since a timestamp (for polling)"""
    try:
        since = request.args.get('since', '')
        
        if not since:
            # If no timestamp provided, return unread notifications
            notifications = get_user_notifications(
                current_user.id, 
                unread_only=True,
                limit=10
            )
        else:
            notifications = get_new_notifications_since(current_user.id, since)
        
        return jsonify({
            'success': True,
            'notifications': notifications,
            'count': len(notifications)
        })
    except Exception as e:
        print(f"Error in api_new_notifications: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@api_bp.route('/notifications/mark-read', methods=['POST'])
@login_required
@csrf.exempt
def api_mark_notifications_read():
    """Mark notifications as read"""
    try:
        data = request.get_json() if request.is_json else {}
        notification_ids = data.get('notification_ids', [])
        mark_all = data.get('mark_all', False)
        
        if mark_all:
            count = mark_notifications_read('all', user_id=current_user.id)
        elif notification_ids:
            count = mark_notifications_read(notification_ids)
        else:
            return jsonify({'success': False, 'error': 'No notifications specified'}), 400
        
        return jsonify({
            'success': True,
            'marked_count': count
        })
    except Exception as e:
        print(f"Error in api_mark_notifications_read: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
