# server/routes.py - All Flask route definitions

from flask import request, jsonify, send_file
from datetime import datetime
import os
from functools import wraps
from .user_manager import UserManager, MAX_ACCOUNTS_PER_IP

# Shared user manager instance (imported by app.py)
user_manager = UserManager()


def get_client_ip():
    forwarded = request.environ.get('HTTP_X_FORWARDED_FOR')
    return forwarded if forwarded else request.environ.get('REMOTE_ADDR', '127.0.0.1')


def require_auth(f):
    """Decorator: validate Bearer token, attach session to request."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401

        token = auth_header.split(' ', 1)[1]
        session = user_manager.validate_session(token)

        if not session:
            return jsonify({'error': 'Invalid or expired session'}), 401

        request.user_session = session
        return f(*args, **kwargs)
    return decorated


def register_routes(app):
    """Attach all routes to the provided Flask app instance."""

    @app.route('/')
    def serve_app():
        html_path = os.path.join(os.path.dirname(__file__), '..', 'web.html')
        if os.path.exists(html_path):
            return send_file(os.path.abspath(html_path))
        cwd_path = 'web.html'
        if os.path.exists(cwd_path):
            return send_file(cwd_path)
        files = os.listdir('.')
        return f"<h1>Server Running</h1><p>web.html not found in {os.getcwd()}</p><p>Files: {files}</p>", 200

    # ---- Auth ----

    @app.route('/api/register', methods=['POST'])
    def register():
        try:
            data = request.get_json() or {}
            username = data.get('username', '').strip()
            password = data.get('password', '')
            result = user_manager.create_user(username, password, get_client_ip())
            return jsonify(result), 201 if result['success'] else 400
        except Exception as e:
            return jsonify({'success': False, 'error': 'Registration failed'}), 500

    @app.route('/api/login', methods=['POST'])
    def login():
        try:
            data = request.get_json() or {}
            username = data.get('username', '').strip()
            password = data.get('password', '')
            result = user_manager.login(username, password)
            return jsonify(result), 200 if result['success'] else 401
        except Exception:
            return jsonify({'success': False, 'error': 'Login failed'}), 500

    @app.route('/api/logout', methods=['POST'])
    @require_auth
    def logout():
        try:
            token = request.headers.get('Authorization', '').split(' ', 1)[1]
            return jsonify(user_manager.logout(token)), 200
        except Exception:
            return jsonify({'success': False, 'error': 'Logout failed'}), 500

    # ---- User info ----

    @app.route('/api/user/info', methods=['GET'])
    @require_auth
    def user_info():
        try:
            username = request.user_session['username']
            user_data = user_manager.users[username]
            return jsonify({
                'success': True,
                'username': username,
                'created_at': user_data['created_at'],
                'last_login': user_data['last_login']
            }), 200
        except Exception:
            return jsonify({'success': False, 'error': 'Failed to get user info'}), 500

    # ---- Sync ----

    @app.route('/api/sync/upload', methods=['POST'])
    @require_auth
    def sync_upload():
        try:
            body = request.get_json() or {}
            user_data = body.get('data')
            if not user_data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400

            user_id = request.user_session['user_id']
            now = datetime.now().isoformat()
            user_manager.save_user_data(user_id, {
                'data': user_data,
                'last_sync': now,
                'sync_version': 1
            })
            return jsonify({'success': True, 'message': 'Data synced successfully', 'last_sync': now}), 200
        except Exception:
            return jsonify({'success': False, 'error': 'Sync upload failed'}), 500

    @app.route('/api/sync/download', methods=['GET'])
    @require_auth
    def sync_download():
        try:
            user_id = request.user_session['user_id']
            stored = user_manager.load_user_data(user_id)
            if not stored:
                return jsonify({'success': False, 'error': 'No data found'}), 404
            return jsonify({
                'success': True,
                'data': stored.get('data', {}),
                'last_sync': stored.get('last_sync'),
                'sync_version': stored.get('sync_version', 1)
            }), 200
        except Exception:
            return jsonify({'success': False, 'error': 'Sync download failed'}), 500

    # ---- Misc ----

    @app.route('/api/accounts/available', methods=['GET'])
    def accounts_available():
        try:
            ip = get_client_ip()
            available = max(0, MAX_ACCOUNTS_PER_IP - user_manager.ip_accounts[ip])
            return jsonify({
                'success': True,
                'available_accounts': available,
                'max_accounts': MAX_ACCOUNTS_PER_IP
            }), 200
        except Exception:
            return jsonify({'success': False, 'error': 'Failed to check availability'}), 500
