"""
Resource Routes - Handle file uploads, drive links, and external links for problems
"""
from flask import Blueprint, request, jsonify, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
import logging
from datetime import datetime

from ..models import db, Resource, User
from ..decorators import role_required
from ..token_utils import find_problem_by_token_or_404

logger = logging.getLogger(__name__)
resource_bp = Blueprint('resources', __name__)

# Configuration
UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', '/app/uploads')
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'zip', 'rar', 'cpp', 'py', 'java', 'c', 'h', 'hpp', 'md'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_file_size_readable(size_bytes):
    """Convert bytes to human readable format"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} TB"


# ==================== GET Resources by Problem ====================
@resource_bp.route('/api/problems/<string:problem_token>/resources', methods=['GET'])
@jwt_required()
def get_resources_by_problem(problem_token):
    """Get all resources attached to a problem"""
    problem = find_problem_by_token_or_404(problem_token)
    
    resources = Resource.query.filter_by(problem_id=problem.id).order_by(Resource.uploaded_at.desc()).all()
    
    resources_data = [{
        'id': r.id,
        'problem_id': r.problem_id,
        'file_name': r.file_name,
        'file_url': r.file_url,
        'file_size': r.file_size,
        'file_type': r.file_type,
        'resource_type': r.resource_type,
        'drive_link': r.drive_link,
        'description': r.description,
        'uploaded_at': r.uploaded_at.isoformat() if r.uploaded_at else None,
        'uploaded_by': r.uploaded_by
    } for r in resources]
    
    return jsonify({
        'success': True,
        'data': resources_data,
        'count': len(resources_data)
    }), 200


# ==================== Upload File Resource ====================
@resource_bp.route('/api/problems/<string:problem_token>/resources/upload', methods=['POST'])
@jwt_required()
@role_required('teacher')
def upload_file_resource(problem_token):
    """Upload a file resource to a problem (teacher only)"""
    problem = find_problem_by_token_or_404(problem_token)
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # Check if teacher owns this class
    if str(problem.class_obj.teacher_id) != user_id:
        return jsonify({'msg': 'Forbidden - Only the teacher of this class can upload resources'}), 403
    
    # Check if file is in request
    if 'file' not in request.files:
        return jsonify({'msg': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'msg': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({
            'msg': f'File type not allowed. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'
        }), 400
    
    # Get file info
    filename = secure_filename(file.filename)
    file_size = 0
    
    # Save file
    try:
        # Create upload directory if not exists
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        
        # Generate unique filename with timestamp
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        unique_filename = f"{timestamp}_{filename}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        
        file.save(file_path)
        file_size = os.path.getsize(file_path)
        
        # Check file size
        if file_size > MAX_FILE_SIZE:
            os.remove(file_path)
            return jsonify({
                'msg': f'File too large. Maximum size: {get_file_size_readable(MAX_FILE_SIZE)}'
            }), 400
        
        # Create resource record
        new_resource = Resource(
            problem_id=problem.id,
            file_name=filename,
            file_url=f'/uploads/{unique_filename}',  # Relative URL
            file_size=file_size,
            file_type=request.content_type or 'application/octet-stream',
            resource_type='file',
            description=request.form.get('description'),
            uploaded_by=user_id
        )
        
        db.session.add(new_resource)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'msg': 'File uploaded successfully',
            'data': {
                'id': new_resource.id,
                'file_name': new_resource.file_name,
                'file_url': new_resource.file_url,
                'file_size': new_resource.file_size,
                'resource_type': new_resource.resource_type,
                'uploaded_at': new_resource.uploaded_at.isoformat()
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': f'Error uploading file: {str(e)}'}), 500


# ==================== Add Drive Link Resource ====================
@resource_bp.route('/api/problems/<string:problem_token>/resources/drive-link', methods=['POST'])
@jwt_required()
@role_required('teacher')
def add_drive_link_resource(problem_token):
    """Add a Google Drive link resource to a problem (teacher only)"""
    problem = find_problem_by_token_or_404(problem_token)
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # Check if teacher owns this class
    if str(problem.class_obj.teacher_id) != user_id:
        return jsonify({'msg': 'Forbidden'}), 403
    
    data = request.get_json()
    drive_link = data.get('drive_link')
    description = data.get('description', '')
    
    if not drive_link:
        return jsonify({'msg': 'Drive link is required'}), 400
    
    # Validate drive link format
    if 'drive.google.com' not in drive_link and 'docs.google.com' not in drive_link:
        return jsonify({'msg': 'Invalid Google Drive link'}), 400
    
    # Create resource record
    new_resource = Resource(
        problem_id=problem.id,
        file_name='Google Drive Link',
        file_url=drive_link,
        resource_type='drive_link',
        drive_link=drive_link,
        description=description,
        uploaded_by=user_id
    )
    
    db.session.add(new_resource)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'msg': 'Drive link added successfully',
        'data': {
            'id': new_resource.id,
            'file_name': new_resource.file_name,
            'file_url': new_resource.file_url,
            'drive_link': new_resource.drive_link,
            'resource_type': new_resource.resource_type,
            'description': new_resource.description,
            'uploaded_at': new_resource.uploaded_at.isoformat()
        }
    }), 201


# ==================== Add External Link Resource ====================
@resource_bp.route('/api/problems/<string:problem_token>/resources/external-link', methods=['POST'])
@jwt_required()
@role_required('teacher')
def add_external_link_resource(problem_token):
    """Add an external link resource to a problem (teacher only)"""
    problem = find_problem_by_token_or_404(problem_token)
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # Check if teacher owns this class
    if str(problem.class_obj.teacher_id) != user_id:
        return jsonify({'msg': 'Forbidden'}), 403
    
    data = request.get_json()
    file_url = data.get('file_url')
    file_name = data.get('file_name')
    description = data.get('description', '')
    
    if not file_url:
        return jsonify({'msg': 'File URL is required'}), 400
    
    if not file_name:
        return jsonify({'msg': 'File name is required'}), 400
    
    # Basic URL validation
    if not (file_url.startswith('http://') or file_url.startswith('https://')):
        return jsonify({'msg': 'Invalid URL format'}), 400
    
    # Create resource record
    new_resource = Resource(
        problem_id=problem.id,
        file_name=file_name,
        file_url=file_url,
        resource_type='external_link',
        description=description,
        uploaded_by=user_id
    )
    
    db.session.add(new_resource)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'msg': 'External link added successfully',
        'data': {
            'id': new_resource.id,
            'file_name': new_resource.file_name,
            'file_url': new_resource.file_url,
            'resource_type': new_resource.resource_type,
            'description': new_resource.description,
            'uploaded_at': new_resource.uploaded_at.isoformat()
        }
    }), 201


# ==================== Delete Resource ====================
@resource_bp.route('/api/resources/<int:resource_id>', methods=['DELETE'])
@jwt_required()
@role_required('teacher')
def delete_resource(resource_id):
    """Delete a resource (teacher only)"""
    resource = Resource.query.get_or_404(resource_id)
    user_id = get_jwt_identity()
    
    # Check if teacher owns this class
    if str(resource.problem.class_obj.teacher_id) != user_id:
        return jsonify({'msg': 'Forbidden'}), 403
    
    # Delete physical file if it's a file upload
    if resource.resource_type == 'file':
        try:
            file_path = os.path.join(UPLOAD_FOLDER, os.path.basename(resource.file_url))
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            # Log error but continue with database deletion
            logger.error(f"Error deleting file: {e}")
    
    # Delete from database
    db.session.delete(resource)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'msg': 'Resource deleted successfully'
    }), 200


# ==================== Serve Uploaded Files ====================
@resource_bp.route('/uploads/<path:filename>', methods=['GET'])
@jwt_required()
def serve_uploaded_file(filename):
    """Serve uploaded files to authenticated users"""
    try:
        return send_from_directory(UPLOAD_FOLDER, filename)
    except Exception as e:
        return jsonify({'msg': f'File not found: {str(e)}'}), 404
