"""
Cave routes for Flask application
Handles cave configuration API endpoints
"""

from flask import Blueprint, request, jsonify
import os
import sqlite3

bp = Blueprint('cave', __name__)

# Database path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
DATABASE_PATH = os.path.join(BASE_DIR, 'python_app', 'data', 'cave.db')


def get_db_connection():
    """Get a database connection"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def row_to_dict(row):
    """Convert SQLite row to dictionary"""
    if row is None:
        return None
    return {key: row[key] for key in row.keys()}


@bp.route('/config', methods=['GET'])
def get_cave_config():
    """Get cave configuration"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM cave_config LIMIT 1")
        config = row_to_dict(cursor.fetchone())
        conn.close()
        
        if config:
            return jsonify(config)
        else:
            return jsonify({'rows': 5, 'cols': 10, 'configured': False})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/config', methods=['POST'])
def save_cave_config():
    """Save cave configuration"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        rows = int(data.get('rows', 5))
        cols = int(data.get('cols', 10))
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if config exists
        cursor.execute("SELECT * FROM cave_config LIMIT 1")
        existing_config = cursor.fetchone()
        
        if existing_config:
            cursor.execute("UPDATE cave_config SET rows = ?, cols = ?, configured = 1", (rows, cols))
        else:
            cursor.execute("INSERT INTO cave_config (rows, cols, configured) VALUES (?, ?, 1)", (rows, cols))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
