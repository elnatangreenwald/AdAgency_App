"""
Suppliers Blueprint
Contains routes for supplier management
"""
import os
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify, send_from_directory
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename

from backend.extensions import csrf
from backend.utils.helpers import load_suppliers, save_suppliers

# Create blueprint
suppliers_bp = Blueprint('suppliers', __name__)

# Directory paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SUPPLIER_FILES_FOLDER = os.path.join(BASE_DIR, 'static', 'supplier_files')


@suppliers_bp.route('/api/suppliers')
@login_required
def api_suppliers():
    """Get all suppliers"""
    try:
        suppliers = load_suppliers()
        
        # Sort by name
        suppliers.sort(key=lambda x: x.get('name', ''))
        
        return jsonify({
            'success': True,
            'suppliers': suppliers
        })
    except Exception as e:
        print(f"Error in api_suppliers: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@suppliers_bp.route('/add_supplier', methods=['POST'])
@login_required
@csrf.exempt
def add_supplier():
    """Add new supplier"""
    try:
        suppliers = load_suppliers()
        
        name = request.form.get('name', '').strip()
        if not name:
            return jsonify({'success': False, 'error': 'שם ספק חסר'}), 400
        
        new_supplier = {
            'id': str(uuid.uuid4()),
            'name': name,
            'category': request.form.get('category', ''),
            'contact_name': request.form.get('contact_name', ''),
            'phone': request.form.get('phone', ''),
            'email': request.form.get('email', ''),
            'address': request.form.get('address', ''),
            'notes': request.form.get('notes', ''),
            'rating': int(request.form.get('rating', 0) or 0),
            'files': [],
            'supplier_notes': [],
            'created_at': datetime.now().isoformat()
        }
        
        suppliers.append(new_supplier)
        save_suppliers(suppliers)
        
        return jsonify({'success': True, 'supplier': new_supplier})
    except Exception as e:
        print(f"Error in add_supplier: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@suppliers_bp.route('/edit_supplier/<supplier_id>', methods=['POST'])
@login_required
@csrf.exempt
def edit_supplier(supplier_id):
    """Edit supplier details"""
    try:
        suppliers = load_suppliers()
        supplier = next((s for s in suppliers if s['id'] == supplier_id), None)
        
        if not supplier:
            return jsonify({'success': False, 'error': 'Supplier not found'}), 404
        
        # Update fields
        for field in ['name', 'category', 'contact_name', 'phone', 'email', 'address', 'notes']:
            if field in request.form:
                supplier[field] = request.form.get(field)
        
        if 'rating' in request.form:
            supplier['rating'] = int(request.form.get('rating', 0) or 0)
        
        supplier['updated_at'] = datetime.now().isoformat()
        save_suppliers(suppliers)
        
        return jsonify({'success': True, 'supplier': supplier})
    except Exception as e:
        print(f"Error in edit_supplier: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@suppliers_bp.route('/delete_supplier/<supplier_id>', methods=['POST'])
@login_required
@csrf.exempt
def delete_supplier(supplier_id):
    """Delete a supplier"""
    try:
        suppliers = load_suppliers()
        suppliers = [s for s in suppliers if s['id'] != supplier_id]
        save_suppliers(suppliers)
        
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error in delete_supplier: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@suppliers_bp.route('/supplier/<supplier_id>')
@login_required
def get_supplier(supplier_id):
    """Get supplier details"""
    try:
        suppliers = load_suppliers()
        supplier = next((s for s in suppliers if s['id'] == supplier_id), None)
        
        if not supplier:
            return jsonify({'success': False, 'error': 'Supplier not found'}), 404
        
        return jsonify({'success': True, 'supplier': supplier})
    except Exception as e:
        print(f"Error in get_supplier: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@suppliers_bp.route('/upload_supplier_file/<supplier_id>', methods=['POST'])
@login_required
@csrf.exempt
def upload_supplier_file(supplier_id):
    """Upload file for supplier"""
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        # Secure filename
        filename = secure_filename(file.filename)
        ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
        new_filename = f"{supplier_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{ext}"
        
        # Save file
        os.makedirs(SUPPLIER_FILES_FOLDER, exist_ok=True)
        filepath = os.path.join(SUPPLIER_FILES_FOLDER, new_filename)
        file.save(filepath)
        
        # Update supplier
        suppliers = load_suppliers()
        supplier = next((s for s in suppliers if s['id'] == supplier_id), None)
        
        if supplier:
            if 'files' not in supplier:
                supplier['files'] = []
            
            supplier['files'].append({
                'id': str(uuid.uuid4()),
                'original_name': filename,
                'filename': new_filename,
                'uploaded_at': datetime.now().isoformat()
            })
            save_suppliers(suppliers)
        
        return jsonify({'success': True, 'filename': new_filename})
    except Exception as e:
        print(f"Error in upload_supplier_file: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@suppliers_bp.route('/delete_supplier_file/<supplier_id>/<file_id>', methods=['POST'])
@login_required
@csrf.exempt
def delete_supplier_file(supplier_id, file_id):
    """Delete supplier file"""
    try:
        suppliers = load_suppliers()
        supplier = next((s for s in suppliers if s['id'] == supplier_id), None)
        
        if not supplier:
            return jsonify({'success': False, 'error': 'Supplier not found'}), 404
        
        # Find and remove file
        file_to_delete = next((f for f in supplier.get('files', []) if f['id'] == file_id), None)
        
        if file_to_delete:
            # Delete physical file
            filepath = os.path.join(SUPPLIER_FILES_FOLDER, file_to_delete['filename'])
            if os.path.exists(filepath):
                os.remove(filepath)
            
            # Remove from list
            supplier['files'] = [f for f in supplier.get('files', []) if f['id'] != file_id]
            save_suppliers(suppliers)
        
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error in delete_supplier_file: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@suppliers_bp.route('/add_supplier_note/<supplier_id>', methods=['POST'])
@login_required
@csrf.exempt
def add_supplier_note(supplier_id):
    """Add note to supplier"""
    try:
        suppliers = load_suppliers()
        supplier = next((s for s in suppliers if s['id'] == supplier_id), None)
        
        if not supplier:
            return jsonify({'success': False, 'error': 'Supplier not found'}), 404
        
        note_text = request.form.get('note', '').strip()
        if not note_text:
            return jsonify({'success': False, 'error': 'הערה חסרה'}), 400
        
        if 'supplier_notes' not in supplier:
            supplier['supplier_notes'] = []
        
        new_note = {
            'id': str(uuid.uuid4()),
            'text': note_text,
            'created_by': current_user.id,
            'created_at': datetime.now().isoformat()
        }
        
        supplier['supplier_notes'].append(new_note)
        save_suppliers(suppliers)
        
        return jsonify({'success': True, 'note': new_note})
    except Exception as e:
        print(f"Error in add_supplier_note: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@suppliers_bp.route('/supplier_files/<filename>')
@login_required
def serve_supplier_file(filename):
    """Serve supplier file"""
    return send_from_directory(SUPPLIER_FILES_FOLDER, filename)
