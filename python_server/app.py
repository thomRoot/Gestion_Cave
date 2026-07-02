"""
Flask Application for Ma Cave à Vin
Main application file for the wine cellar management system
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_session import Session
import os
import sqlite3
import json
from datetime import datetime
from werkzeug.utils import secure_filename
import base64

# Initialize Flask app
app = Flask(__name__, static_folder='../public', static_url_path='')

# Configure CORS
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://localhost:5000", "http://127.0.0.1:5000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Configure session
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'your-secret-key-change-in-production')
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_COOKIE_SECURE'] = False
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = 3600

Session(app)

# Database configuration
DATABASE_PATH = os.path.join(os.path.dirname(__file__), '../data/cave.db')
UPLOADS_PATH = os.path.join(os.path.dirname(__file__), '../public/uploads')

# Ensure directories exist
os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
os.makedirs(UPLOADS_PATH, exist_ok=True)

def get_db_connection():
    """Get a database connection"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    """Initialize the database tables"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create cave_config table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cave_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rows INTEGER NOT NULL,
            cols INTEGER NOT NULL,
            configured BOOLEAN DEFAULT 0
        )
    ''')
    
    # Create bottles table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bottles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            row INTEGER NOT NULL,
            col INTEGER NOT NULL,
            name TEXT,
            year INTEGER,
            grapes TEXT,
            region TEXT,
            drinkFrom INTEGER,
            drinkTo INTEGER,
            foodPairing TEXT,
            temperature TEXT,
            photo TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Check if cave is configured
    cursor.execute("SELECT * FROM cave_config LIMIT 1")
    if cursor.fetchone() is None:
        cursor.execute("INSERT INTO cave_config (rows, cols, configured) VALUES (5, 10, 0)")
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_database()

# Import routes
from python_server.routes import bottles, cave

# Register blueprints
app.register_blueprint(bottles.bp, url_prefix='/api/bottles')
app.register_blueprint(cave.bp, url_prefix='/api/cave')

# Serve static files
@app.route('/')
@app.route('/<path:path>')
def serve_static(path='index.html'):
    """Serve static files from the public directory"""
    return send_from_directory(app.static_folder, path)

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# Health check endpoint
@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

if __name__ == '__main__':
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
