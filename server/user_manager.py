# server/user_manager.py - User creation, auth, session management

import hashlib
import secrets
import os
import json
from datetime import datetime, timedelta
from collections import defaultdict

DATA_DIR = 'data'
USERS_FILE = os.path.join(DATA_DIR, 'users.json')
USER_DATA_DIR = os.path.join(DATA_DIR, 'user_data')
MAX_ACCOUNTS_PER_IP = 2
SESSION_TIMEOUT_HOURS = 24

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(USER_DATA_DIR, exist_ok=True)


class UserManager:
    def __init__(self):
        self.users = self._load_users()
        self.ip_accounts = defaultdict(int)
        self.sessions = {}
        self._count_ip_accounts()

    def _load_users(self):
        if os.path.exists(USERS_FILE):
            try:
                with open(USERS_FILE, 'r') as f:
                    return json.load(f)
            except Exception:
                return {}
        return {}

    def _save_users(self):
        with open(USERS_FILE, 'w') as f:
            json.dump(self.users, f, indent=2)

    def _count_ip_accounts(self):
        for user_data in self.users.values():
            ip = user_data.get('ip', '')
            if ip:
                self.ip_accounts[ip] += 1

    @staticmethod
    def _hash_password(password):
        return hashlib.sha256(password.encode()).hexdigest()

    @staticmethod
    def _generate_token():
        return secrets.token_urlsafe(32)

    def can_create_account(self, ip):
        return self.ip_accounts[ip] < MAX_ACCOUNTS_PER_IP

    def create_user(self, username, password, ip):
        if username in self.users:
            return {'success': False, 'error': 'Username already exists'}

        if not self.can_create_account(ip):
            return {'success': False, 'error': f'Maximum {MAX_ACCOUNTS_PER_IP} accounts per IP address'}

        if not username or len(username) < 3 or len(username) > 30:
            return {'success': False, 'error': 'Username must be 3-30 characters'}

        if not password or len(password) < 6:
            return {'success': False, 'error': 'Password must be at least 6 characters'}

        user_id = secrets.token_urlsafe(16)
        self.users[username] = {
            'user_id': user_id,
            'password_hash': self._hash_password(password),
            'ip': ip,
            'created_at': datetime.now().isoformat(),
            'last_login': None
        }

        self.ip_accounts[ip] += 1
        self._save_users()

        # Create default user data file
        user_data_file = os.path.join(USER_DATA_DIR, f'{user_id}.json')
        with open(user_data_file, 'w') as f:
            json.dump({
                'todo': {'default': {'name': 'My Tasks', 'items': []}},
                'notes': {'default': {'name': 'My Notes', 'items': []}},
                'kanban': {'default': {
                    'name': 'My Board',
                    'column_order': ['todo', 'doing', 'done'],
                    'columns': {
                        'todo': {'name': 'To Do', 'items': []},
                        'doing': {'name': 'In Progress', 'items': []},
                        'done': {'name': 'Done', 'items': []}
                    }
                }}
            }, f, indent=2)

        return {'success': True, 'message': 'Account created successfully'}

    def login(self, username, password):
        if username not in self.users:
            return {'success': False, 'error': 'Invalid username or password'}

        user = self.users[username]
        if user['password_hash'] != self._hash_password(password):
            return {'success': False, 'error': 'Invalid username or password'}

        session_token = self._generate_token()
        session_expiry = datetime.now() + timedelta(hours=SESSION_TIMEOUT_HOURS)

        self.sessions[session_token] = {
            'username': username,
            'user_id': user['user_id'],
            'expires': session_expiry.isoformat()
        }

        user['last_login'] = datetime.now().isoformat()
        self._save_users()

        return {
            'success': True,
            'session_token': session_token,
            'username': username,
            'expires': session_expiry.isoformat()
        }

    def validate_session(self, session_token):
        if session_token not in self.sessions:
            return None

        session = self.sessions[session_token]
        expiry = datetime.fromisoformat(session['expires'])

        if datetime.now() > expiry:
            del self.sessions[session_token]
            return None

        return session

    def logout(self, session_token):
        if session_token in self.sessions:
            del self.sessions[session_token]
        return {'success': True}

    def get_user_data_path(self, user_id):
        return os.path.join(USER_DATA_DIR, f'{user_id}.json')

    def load_user_data(self, user_id):
        data_file = self.get_user_data_path(user_id)
        if not os.path.exists(data_file):
            return None

        with open(data_file, 'r') as f:
            data = json.load(f)

        # Migration: add column_order to kanban boards missing it
        needs_save = False
        if 'data' in data and 'kanban' in data['data']:
            for board_key, board_data in data['data']['kanban'].items():
                if 'columns' in board_data and 'column_order' not in board_data:
                    columns = board_data['columns']
                    if 'todo' in columns and 'doing' in columns and 'done' in columns:
                        board_data['column_order'] = ['todo', 'doing', 'done']
                    else:
                        board_data['column_order'] = list(columns.keys())
                    needs_save = True

        if needs_save:
            with open(data_file, 'w') as f:
                json.dump(data, f, indent=2)

        return data

    def save_user_data(self, user_id, data):
        # Ensure kanban boards have column_order
        if 'data' in data and 'kanban' in data['data']:
            for board_data in data['data']['kanban'].values():
                if 'columns' in board_data and 'column_order' not in board_data:
                    columns = board_data['columns']
                    if 'todo' in columns and 'doing' in columns and 'done' in columns:
                        board_data['column_order'] = ['todo', 'doing', 'done']
                    else:
                        board_data['column_order'] = list(columns.keys())

        data_file = self.get_user_data_path(user_id)
        with open(data_file, 'w') as f:
            json.dump(data, f, indent=2)
