"""
Authentication Blueprint
Contains routes for login, logout, and password reset
"""
import os
import json
import uuid
from datetime import datetime, timedelta
from flask import Blueprint, request, redirect, url_for, jsonify, render_template, flash
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import check_password_hash, generate_password_hash

from backend.extensions import csrf, limiter
from backend.utils.helpers import load_users, save_users, update_user_activity
from backend.utils.email import send_password_reset_email

# Create blueprint
auth_bp = Blueprint('auth', __name__)

# Base directory for reset tokens
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RESET_TOKENS_FILE = os.path.join(BASE_DIR, 'reset_tokens.json')


class User:
    """User class for Flask-Login"""
    def __init__(self, id):
        self.id = id
        users = load_users()
        self.name = users[id]['name'] if id in users else "Unknown"
        self.role = users[id].get('role', 'עובד') if id in users else 'עובד'
        self.is_authenticated = True
        self.is_active = True
        self.is_anonymous = False
    
    def get_id(self):
        return self.id


@auth_bp.route('/login', methods=['GET', 'POST'])
@limiter.limit("20 per minute")
@csrf.exempt
def login():
    """Login route"""
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    
    if request.method == 'POST':
        users = load_users()
        uid = request.form.get('username')
        pwd = request.form.get('password')
        
        # Check for email login
        email_match_user = None
        if uid:
            normalized_uid = uid.strip().lower()
            for user_id, info in users.items():
                if info.get('email', '').strip().lower() == normalized_uid:
                    email_match_user = user_id
                    break
        
        resolved_user_id = uid if uid in users else email_match_user
        
        # Check password
        if resolved_user_id and resolved_user_id in users:
            stored_password = users[resolved_user_id].get('password', '')
            
            if stored_password.startswith('pbkdf2:sha256:') or stored_password.startswith('scrypt:'):
                password_valid = check_password_hash(stored_password, pwd)
            else:
                password_valid = (stored_password == pwd)
            
            if password_valid:
                user = User(resolved_user_id)
                login_user(user, remember=True)
                update_user_activity(resolved_user_id)
                
                wants_json = request.headers.get('Accept', '').find('application/json') != -1 or \
                            request.headers.get('X-Requested-With') == 'XMLHttpRequest'
                if wants_json:
                    return jsonify({'status': 'success'}), 200
                return redirect(url_for('home'))
        
        wants_json = request.headers.get('Accept', '').find('application/json') != -1 or \
                    request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        if wants_json:
            return jsonify({'status': 'error', 'error': 'שם משתמש או סיסמה שגויים'}), 401
        flash('שם משתמש או סיסמה שגויים', 'error')
    
    # Redirect to React login
    return redirect('/app/login')


@auth_bp.route('/logout', methods=['GET', 'POST'])
@csrf.exempt
def logout():
    """Logout route"""
    logout_user()
    wants_json = request.headers.get('Accept', '').find('application/json') != -1 or \
                request.headers.get('X-Requested-With') == 'XMLHttpRequest'
    if wants_json:
        return jsonify({'success': True})
    return redirect(url_for('auth.login'))


@auth_bp.route('/reset_password_request', methods=['POST'])
@csrf.exempt
def reset_password_request():
    """Request password reset - sends email"""
    username = request.form.get('username', '').strip()
    
    if not username:
        flash('נא להזין שם משתמש', 'error')
        return redirect(url_for('auth.login'))
    
    users = load_users()
    
    # Find user by username
    user = None
    user_id = None
    for uid, user_data in users.items():
        if uid == username:
            user = user_data
            user_id = uid
            break
    
    if not user:
        flash('אם המשתמש קיים במערכת, קישור איפוס סיסמה נשלח למייל', 'success')
        return redirect(url_for('auth.login'))
    
    user_email = user.get('email', '')
    if not user_email:
        flash('למשתמש זה לא רשום מייל במערכת. אנא פנה למנהל המערכת.', 'error')
        return redirect(url_for('auth.login'))
    
    # Create reset token
    reset_token = str(uuid.uuid4())
    
    # Save reset token
    reset_tokens = {}
    if os.path.exists(RESET_TOKENS_FILE):
        with open(RESET_TOKENS_FILE, 'r', encoding='utf-8') as f:
            reset_tokens = json.load(f)
    
    reset_tokens[reset_token] = {
        'user_id': user_id,
        'created_at': datetime.now().isoformat(),
        'expires_at': (datetime.now() + timedelta(hours=24)).isoformat()
    }
    
    with open(RESET_TOKENS_FILE, 'w', encoding='utf-8') as f:
        json.dump(reset_tokens, f, ensure_ascii=False, indent=4)
    
    # Send email
    if send_password_reset_email(user_email, reset_token):
        flash('קישור לאיפוס סיסמה נשלח למייל', 'success')
    else:
        flash('שגיאה בשליחת המייל. אנא נסה שוב מאוחר יותר.', 'error')
    
    return redirect(url_for('auth.login'))


@auth_bp.route('/reset_password/<token>', methods=['GET', 'POST'])
@csrf.exempt
def reset_password(token):
    """Reset password with token"""
    # Load tokens
    reset_tokens = {}
    if os.path.exists(RESET_TOKENS_FILE):
        with open(RESET_TOKENS_FILE, 'r', encoding='utf-8') as f:
            reset_tokens = json.load(f)
    
    # Validate token
    if token not in reset_tokens:
        flash('קישור לא תקין או שפג תוקפו', 'error')
        return redirect(url_for('auth.login'))
    
    token_data = reset_tokens[token]
    expires_at = datetime.fromisoformat(token_data['expires_at'])
    
    if datetime.now() > expires_at:
        del reset_tokens[token]
        with open(RESET_TOKENS_FILE, 'w', encoding='utf-8') as f:
            json.dump(reset_tokens, f, ensure_ascii=False, indent=4)
        flash('הקישור פג תוקף. אנא בקש קישור חדש.', 'error')
        return redirect(url_for('auth.login'))
    
    if request.method == 'POST':
        new_password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        
        if not new_password or len(new_password) < 4:
            flash('הסיסמה חייבת להכיל לפחות 4 תווים', 'error')
            return render_template('reset_password.html', token=token)
        
        if new_password != confirm_password:
            flash('הסיסמאות אינן תואמות', 'error')
            return render_template('reset_password.html', token=token)
        
        # Update password
        users = load_users()
        user_id = token_data['user_id']
        
        if user_id in users:
            users[user_id]['password'] = generate_password_hash(new_password)
            save_users(users)
            
            # Delete used token
            del reset_tokens[token]
            with open(RESET_TOKENS_FILE, 'w', encoding='utf-8') as f:
                json.dump(reset_tokens, f, ensure_ascii=False, indent=4)
            
            flash('הסיסמה שונתה בהצלחה! כעת תוכל להתחבר עם הסיסמה החדשה.', 'success')
            return redirect(url_for('auth.login'))
        else:
            flash('משתמש לא נמצא', 'error')
            return redirect(url_for('auth.login'))
    
    return render_template('reset_password.html', token=token)
