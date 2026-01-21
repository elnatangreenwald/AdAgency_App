"""
Quotes Blueprint
Contains routes for quote management
"""
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from backend.extensions import csrf
from backend.utils.helpers import load_quotes, save_quotes, load_suppliers

# Create blueprint
quotes_bp = Blueprint('quotes', __name__)


@quotes_bp.route('/api/quotes')
@login_required
def api_quotes():
    """Get all quotes"""
    try:
        quotes = load_quotes()
        suppliers = load_suppliers()
        
        # Sort by date (newest first)
        quotes.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return jsonify({
            'success': True,
            'quotes': quotes,
            'suppliers': suppliers
        })
    except Exception as e:
        print(f"Error in api_quotes: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@quotes_bp.route('/add_quote', methods=['POST'])
@login_required
@csrf.exempt
def add_quote():
    """Add new quote"""
    try:
        quotes = load_quotes()
        
        title = request.form.get('title', '').strip()
        if not title:
            return jsonify({'success': False, 'error': 'כותרת הצעה חסרה'}), 400
        
        new_quote = {
            'id': str(uuid.uuid4()),
            'title': title,
            'supplier_id': request.form.get('supplier_id', ''),
            'supplier_name': request.form.get('supplier_name', ''),
            'client': request.form.get('client', ''),
            'amount': float(request.form.get('amount', 0) or 0),
            'status': request.form.get('status', 'ממתין'),
            'valid_until': request.form.get('valid_until', ''),
            'description': request.form.get('description', ''),
            'notes': request.form.get('notes', ''),
            'created_by': current_user.id,
            'created_at': datetime.now().isoformat()
        }
        
        quotes.append(new_quote)
        save_quotes(quotes)
        
        return jsonify({'success': True, 'quote': new_quote})
    except Exception as e:
        print(f"Error in add_quote: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@quotes_bp.route('/edit_quote/<quote_id>', methods=['POST'])
@login_required
@csrf.exempt
def edit_quote(quote_id):
    """Edit quote details"""
    try:
        quotes = load_quotes()
        quote = next((q for q in quotes if q['id'] == quote_id), None)
        
        if not quote:
            return jsonify({'success': False, 'error': 'Quote not found'}), 404
        
        # Update fields
        for field in ['title', 'supplier_id', 'supplier_name', 'client', 'status', 'valid_until', 'description', 'notes']:
            if field in request.form:
                quote[field] = request.form.get(field)
        
        if 'amount' in request.form:
            quote['amount'] = float(request.form.get('amount', 0) or 0)
        
        quote['updated_at'] = datetime.now().isoformat()
        save_quotes(quotes)
        
        return jsonify({'success': True, 'quote': quote})
    except Exception as e:
        print(f"Error in edit_quote: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@quotes_bp.route('/delete_quote/<quote_id>', methods=['POST'])
@login_required
@csrf.exempt
def delete_quote(quote_id):
    """Delete a quote"""
    try:
        quotes = load_quotes()
        quotes = [q for q in quotes if q['id'] != quote_id]
        save_quotes(quotes)
        
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error in delete_quote: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
