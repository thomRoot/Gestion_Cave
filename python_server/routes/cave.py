"""
Cave routes for Flask application
Handles cave configuration API endpoints
"""

from flask import Blueprint, request, jsonify, current_app
import os
import sqlite3

bp = Blueprint('cave', __name__)

DATABASE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data/cave.db')

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
            return jsonify({'configured': False})
    except Exception as e:
        current_app.logger.error(f"Error getting cave config: {e}")
        return jsonify({'error': 'Error retrieving cave configuration'}), 500

@bp.route('/config', methods=['POST'])
def save_cave_config():
    """Save cave configuration"""
    try:
        data = request.get_json()
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
        current_app.logger.error(f"Error saving cave config: {e}")
        return jsonify({'error': 'Error saving cave configuration'}), 500
