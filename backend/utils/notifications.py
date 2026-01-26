"""
Notifications Module
Contains functions for managing user notifications (task assignments, etc.)
"""
import os
import json
import uuid
from datetime import datetime
from flask import current_app


def get_notifications_file():
    """Get the path to the notifications file"""
    try:
        config = current_app.config
        notifications_file = config.get('NOTIFICATIONS_FILE')
        if notifications_file:
            return notifications_file
    except RuntimeError:
        pass
    
    # Fallback to default path
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    return os.path.join(base_dir, 'notifications_db.json')


def load_notifications():
    """Load notifications from JSON file"""
    notifications_file = get_notifications_file()
    
    if not os.path.exists(notifications_file) or os.stat(notifications_file).st_size == 0:
        return {'notifications': []}
    
    try:
        with open(notifications_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # Ensure the structure is correct
            if isinstance(data, list):
                return {'notifications': data}
            return data
    except (json.JSONDecodeError, Exception) as e:
        print(f"Error loading notifications: {e}")
        return {'notifications': []}


def save_notifications(data):
    """Save notifications to JSON file"""
    notifications_file = get_notifications_file()
    
    with open(notifications_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)


def create_notification(user_id, notification_type, data):
    """
    Create a new notification for a user
    
    Args:
        user_id: The ID of the user to notify
        notification_type: Type of notification (e.g., 'task_assigned')
        data: Dictionary containing notification details:
            - task_id: ID of the related task
            - client_id: ID of the related client
            - project_id: ID of the related project
            - from_user_id: ID of the user who triggered the notification
            - from_user_name: Name of the user who triggered the notification
            - task_title: Title of the task
            - client_name: Name of the client (optional)
            - message: Custom message (optional)
    
    Returns:
        The created notification object
    """
    notifications_data = load_notifications()
    
    # Build the message based on type
    if notification_type == 'task_assigned':
        from_name = data.get('from_user_name', 'משתמש')
        task_title = data.get('task_title', 'משימה')
        client_name = data.get('client_name', '')
        if client_name:
            message = f"{from_name} הקצה לך משימה חדשה: {task_title} ({client_name})"
        else:
            message = f"{from_name} הקצה לך משימה חדשה: {task_title}"
    else:
        message = data.get('message', 'התראה חדשה')
    
    notification = {
        'id': str(uuid.uuid4()),
        'user_id': user_id,
        'type': notification_type,
        'task_id': data.get('task_id'),
        'client_id': data.get('client_id'),
        'project_id': data.get('project_id'),
        'from_user_id': data.get('from_user_id'),
        'from_user_name': data.get('from_user_name'),
        'task_title': data.get('task_title'),
        'client_name': data.get('client_name'),
        'message': message,
        'created_at': datetime.now().isoformat(),
        'read': False
    }
    
    notifications_data['notifications'].append(notification)
    save_notifications(notifications_data)
    
    return notification


def get_user_notifications(user_id, unread_only=False, limit=50):
    """
    Get notifications for a specific user
    
    Args:
        user_id: The ID of the user
        unread_only: If True, only return unread notifications
        limit: Maximum number of notifications to return
    
    Returns:
        List of notification objects, sorted by creation date (newest first)
    """
    notifications_data = load_notifications()
    
    user_notifications = [
        n for n in notifications_data['notifications']
        if n.get('user_id') == user_id
    ]
    
    if unread_only:
        user_notifications = [n for n in user_notifications if not n.get('read', False)]
    
    # Sort by creation date, newest first
    user_notifications.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    
    return user_notifications[:limit]


def get_unread_count(user_id):
    """
    Get the count of unread notifications for a user
    
    Args:
        user_id: The ID of the user
    
    Returns:
        Integer count of unread notifications
    """
    notifications_data = load_notifications()
    
    count = sum(
        1 for n in notifications_data['notifications']
        if n.get('user_id') == user_id and not n.get('read', False)
    )
    
    return count


def mark_notifications_read(notification_ids, user_id=None):
    """
    Mark notifications as read
    
    Args:
        notification_ids: List of notification IDs to mark as read, 
                         or 'all' to mark all notifications for the user
        user_id: Required if notification_ids is 'all'
    
    Returns:
        Number of notifications marked as read
    """
    notifications_data = load_notifications()
    count = 0
    
    for notification in notifications_data['notifications']:
        if notification_ids == 'all':
            if user_id and notification.get('user_id') == user_id and not notification.get('read', False):
                notification['read'] = True
                notification['read_at'] = datetime.now().isoformat()
                count += 1
        elif notification.get('id') in notification_ids:
            if not notification.get('read', False):
                notification['read'] = True
                notification['read_at'] = datetime.now().isoformat()
                count += 1
    
    if count > 0:
        save_notifications(notifications_data)
    
    return count


def delete_old_notifications(days=30):
    """
    Delete notifications older than specified days
    
    Args:
        days: Number of days to keep notifications
    
    Returns:
        Number of notifications deleted
    """
    from datetime import timedelta
    
    notifications_data = load_notifications()
    cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
    
    original_count = len(notifications_data['notifications'])
    notifications_data['notifications'] = [
        n for n in notifications_data['notifications']
        if n.get('created_at', '') > cutoff_date
    ]
    
    deleted_count = original_count - len(notifications_data['notifications'])
    
    if deleted_count > 0:
        save_notifications(notifications_data)
    
    return deleted_count


def get_new_notifications_since(user_id, since_timestamp):
    """
    Get notifications created after a specific timestamp
    Useful for polling for new notifications
    
    Args:
        user_id: The ID of the user
        since_timestamp: ISO format timestamp
    
    Returns:
        List of new notifications
    """
    notifications_data = load_notifications()
    
    new_notifications = [
        n for n in notifications_data['notifications']
        if n.get('user_id') == user_id 
        and n.get('created_at', '') > since_timestamp
        and not n.get('read', False)
    ]
    
    # Sort by creation date, newest first
    new_notifications.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    
    return new_notifications
