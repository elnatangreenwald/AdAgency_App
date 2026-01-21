"""
Chat Blueprint
Contains routes for internal messaging
"""
import os
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify, send_from_directory
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename

from backend.extensions import csrf
from backend.utils.helpers import load_messages, save_messages, load_users

# Create blueprint
chat_bp = Blueprint('chat', __name__)

# Directory paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CHAT_FILES_FOLDER = os.path.join(BASE_DIR, 'static', 'chat_files')


@chat_bp.route('/api/chat/conversations')
@login_required
def api_chat_conversations():
    """Get all conversations for current user"""
    try:
        messages = load_messages()
        users = load_users()
        current_uid = current_user.id
        
        # Build conversations list
        conversations = {}
        
        for msg in messages:
            sender = msg.get('sender')
            recipient = msg.get('recipient')
            
            # Determine the other user
            if sender == current_uid:
                other_user = recipient
            elif recipient == current_uid:
                other_user = sender
            else:
                continue
            
            if other_user not in conversations:
                conversations[other_user] = {
                    'user_id': other_user,
                    'user_name': users.get(other_user, {}).get('name', other_user),
                    'last_message': msg,
                    'unread_count': 0
                }
            
            # Update last message
            if msg.get('timestamp', '') > conversations[other_user]['last_message'].get('timestamp', ''):
                conversations[other_user]['last_message'] = msg
            
            # Count unread messages
            if recipient == current_uid and not msg.get('read'):
                conversations[other_user]['unread_count'] += 1
        
        # Convert to list and sort by last message time
        conv_list = list(conversations.values())
        conv_list.sort(key=lambda x: x['last_message'].get('timestamp', ''), reverse=True)
        
        return jsonify({
            'success': True,
            'conversations': conv_list,
            'users': {uid: {'name': u.get('name', uid)} for uid, u in users.items()}
        })
    except Exception as e:
        print(f"Error in api_chat_conversations: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@chat_bp.route('/api/chat/messages/<user_id>')
@login_required
def api_chat_messages(user_id):
    """Get messages with a specific user"""
    try:
        messages = load_messages()
        current_uid = current_user.id
        
        # Filter messages between current user and specified user
        conversation = [
            msg for msg in messages
            if (msg.get('sender') == current_uid and msg.get('recipient') == user_id) or
               (msg.get('sender') == user_id and msg.get('recipient') == current_uid)
        ]
        
        # Sort by timestamp
        conversation.sort(key=lambda x: x.get('timestamp', ''))
        
        return jsonify({
            'success': True,
            'messages': conversation
        })
    except Exception as e:
        print(f"Error in api_chat_messages: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@chat_bp.route('/api/chat/send', methods=['POST'])
@login_required
@csrf.exempt
def api_chat_send():
    """Send a chat message"""
    try:
        messages = load_messages()
        
        recipient = request.form.get('recipient', '').strip()
        content = request.form.get('content', '').strip()
        
        if not recipient:
            return jsonify({'success': False, 'error': 'Recipient required'}), 400
        
        if not content and 'file' not in request.files:
            return jsonify({'success': False, 'error': 'Message or file required'}), 400
        
        new_message = {
            'id': str(uuid.uuid4()),
            'sender': current_user.id,
            'recipient': recipient,
            'content': content,
            'timestamp': datetime.now().isoformat(),
            'read': False,
            'file': None
        }
        
        # Handle file upload
        if 'file' in request.files:
            file = request.files['file']
            if file.filename:
                filename = secure_filename(file.filename)
                ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
                new_filename = f"{new_message['id']}.{ext}"
                
                os.makedirs(CHAT_FILES_FOLDER, exist_ok=True)
                filepath = os.path.join(CHAT_FILES_FOLDER, new_filename)
                file.save(filepath)
                
                new_message['file'] = {
                    'original_name': filename,
                    'filename': new_filename
                }
        
        messages.append(new_message)
        save_messages(messages)
        
        return jsonify({'success': True, 'message': new_message})
    except Exception as e:
        print(f"Error in api_chat_send: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@chat_bp.route('/api/chat/mark-read/<user_id>', methods=['POST'])
@login_required
@csrf.exempt
def api_chat_mark_read(user_id):
    """Mark messages from user as read"""
    try:
        messages = load_messages()
        current_uid = current_user.id
        
        updated = False
        for msg in messages:
            if msg.get('sender') == user_id and msg.get('recipient') == current_uid and not msg.get('read'):
                msg['read'] = True
                updated = True
        
        if updated:
            save_messages(messages)
        
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error in api_chat_mark_read: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@chat_bp.route('/api/chat/users')
@login_required
def api_chat_users():
    """Get all users for chat"""
    try:
        users = load_users()
        messages = load_messages()
        current_uid = current_user.id
        
        # Count unread messages per user
        unread_counts = {}
        for msg in messages:
            if msg.get('recipient') == current_uid and not msg.get('read'):
                sender = msg.get('sender')
                unread_counts[sender] = unread_counts.get(sender, 0) + 1
        
        users_list = [
            {
                'id': uid,
                'name': info.get('name', uid),
                'unread': unread_counts.get(uid, 0)
            }
            for uid, info in users.items()
            if uid != current_uid
        ]
        
        # Sort by name
        users_list.sort(key=lambda x: x['name'])
        
        return jsonify({
            'success': True,
            'users': users_list
        })
    except Exception as e:
        print(f"Error in api_chat_users: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@chat_bp.route('/static/chat_files/<filename>')
@login_required
def serve_chat_file(filename):
    """Serve chat file"""
    return send_from_directory(CHAT_FILES_FOLDER, filename)
