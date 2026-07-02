"""
Bottles routes for Flask application
Handles all bottle-related API endpoints
"""

from flask import Blueprint, request, jsonify, current_app
import os
import sqlite3
from datetime import datetime
from werkzeug.utils import secure_filename
import base64
import re

bp = Blueprint('bottles', __name__)

# Database path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
DATABASE_PATH = os.path.join(BASE_DIR, 'python_app', 'data', 'cave.db')
UPLOADS_PATH = os.path.join(BASE_DIR, 'python_app', 'static', 'uploads')

# Ensure uploads directory exists
os.makedirs(UPLOADS_PATH, exist_ok=True)


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


@bp.route('/', methods=['GET'])
def get_all_bottles():
    """Get all bottles from the database"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM bottles")
        bottles = [row_to_dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(bottles)
    except Exception as e:
        current_app.logger.error(f"Error getting bottles: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/', methods=['POST'])
def save_bottle():
    """Save a bottle to the database"""
    try:
        # Get form data
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.form.to_dict()
            # Handle file upload
            if 'photo' in request.files:
                file = request.files['photo']
                if file and file.filename != '':
                    filename = secure_filename(file.filename)
                    unique_filename = f"{datetime.now().timestamp()}-{filename}"
                    file.save(os.path.join(UPLOADS_PATH, unique_filename))
                    data['photo'] = unique_filename
        else:
            data = request.get_json() or {}
        
        # Handle base64 image
        if 'photo' in data and data['photo'] and isinstance(data['photo'], str) and data['photo'].startswith('data:image/'):
            # Extract base64 data
            base64_data = data['photo'].split(',')[1] if ',' in data['photo'] else data['photo']
            try:
                buffer = base64.b64decode(base64_data)
                filename = f"{datetime.now().timestamp()}-camera.jpg"
                file_path = os.path.join(UPLOADS_PATH, filename)
                with open(file_path, 'wb') as f:
                    f.write(buffer)
                data['photo'] = filename
            except Exception as e:
                current_app.logger.error(f"Error decoding base64 image: {e}")
                data['photo'] = ''
        
        # Extract bottle data
        row = int(data.get('row', 0))
        col = int(data.get('col', 0))
        name = data.get('name', '')
        year = int(data.get('year', 0)) if data.get('year') is not None and str(data.get('year')).isdigit() else None
        grapes = data.get('grapes', '')
        region = data.get('region', '')
        drinkFrom = int(data.get('drinkFrom', 0)) if data.get('drinkFrom') is not None and str(data.get('drinkFrom')).isdigit() else None
        drinkTo = int(data.get('drinkTo', 0)) if data.get('drinkTo') is not None and str(data.get('drinkTo')).isdigit() else None
        foodPairing = data.get('foodPairing', '')
        temperature = data.get('temperature', '')
        photo = data.get('photo', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if bottle exists at this position
        cursor.execute("SELECT * FROM bottles WHERE row = ? AND col = ?", (row, col))
        existing_bottle = cursor.fetchone()
        
        if existing_bottle:
            # Update existing bottle
            cursor.execute('''
                UPDATE bottles SET
                    name = ?,
                    year = ?,
                    grapes = ?,
                    region = ?,
                    drinkFrom = ?,
                    drinkTo = ?,
                    foodPairing = ?,
                    temperature = ?,
                    photo = ?
                WHERE row = ? AND col = ?
            ''', (name, year, grapes, region, drinkFrom, drinkTo, foodPairing, temperature, photo, row, col))
        else:
            # Insert new bottle
            cursor.execute('''
                INSERT INTO bottles
                (row, col, name, year, grapes, region, drinkFrom, drinkTo, foodPairing, temperature, photo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (row, col, name, year, grapes, region, drinkFrom, drinkTo, foodPairing, temperature, photo))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
    except Exception as e:
        current_app.logger.error(f"Error saving bottle: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/', methods=['DELETE'])
def delete_bottle():
    """Delete a bottle from the database"""
    try:
        row = int(request.args.get('row', 0))
        col = int(request.args.get('col', 0))
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM bottles WHERE row = ? AND col = ?", (row, col))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
    except Exception as e:
        current_app.logger.error(f"Error deleting bottle: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/analyze', methods=['POST'])
def analyze_bottle():
    """Analyze a bottle image - fallback implementation"""
    try:
        # This is a fallback implementation
        # In production, you would integrate with Mistral AI and Google Vision
        return jsonify({
            'success': True,
            'bottleInfo': {
                'name': '',
                'year': None,
                'grapes': '',
                'region': '',
                'drinkFrom': None,
                'drinkTo': None,
                'foodPairing': '',
                'temperature': '',
                'analysisMethod': 'Fallback'
            },
            'mistralAvailable': False,
            'googleVisionAvailable': False,
            'extractedText': ''
        })
    except Exception as e:
        current_app.logger.error(f"Error analyzing bottle: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'mistralAvailable': False,
            'googleVisionAvailable': False,
            'bottleInfo': {}
        }), 500


@bp.route('/analyze-two-step', methods=['POST'])
def analyze_bottle_two_step():
    """Two-step analysis - fallback implementation"""
    try:
        return jsonify({
            'success': True,
            'bottleInfo': {
                'name': '',
                'year': None,
                'grapes': '',
                'region': '',
                'drinkFrom': None,
                'drinkTo': None,
                'foodPairing': '',
                'temperature': '',
                'analysisMethod': 'Fallback'
            },
            'mistralAvailable': False,
            'googleVisionAvailable': False,
            'requiresManualInput': True,
            'missingFields': {'name': True, 'year': True},
            'partialData': None
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'mistralAvailable': False,
            'googleVisionAvailable': False,
            'requiresManualInput': True,
            'missingFields': {'name': True, 'year': True},
            'partialData': None
        }), 500


@bp.route('/analyze-text', methods=['POST'])
def analyze_text():
    """Analyze text - fallback implementation"""
    try:
        data = request.get_json() or {}
        name = data.get('name', '')
        year = data.get('year', None)
        grapes = data.get('grapes', '')
        region = data.get('region', '')
        
        return jsonify({
            'success': True,
            'bottleInfo': {
                'name': name,
                'year': year,
                'grapes': grapes,
                'region': region,
                'drinkFrom': None,
                'drinkTo': None,
                'foodPairing': '',
                'temperature': '',
                'analysisMethod': 'Analyse texte manuel'
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/analyze-base64', methods=['POST'])
def analyze_base64():
    """Analyze base64 image - fallback implementation"""
    try:
        data = request.get_json() or {}
        image_data = data.get('image', '')
        
        return jsonify({
            'success': True,
            'bottleInfo': {
                'name': '',
                'year': None,
                'grapes': '',
                'region': '',
                'drinkFrom': None,
                'drinkTo': None,
                'foodPairing': '',
                'temperature': '',
                'analysisMethod': 'Fallback'
            },
            'mistralAvailable': False
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'mistralAvailable': False,
            'bottleInfo': {}
        }), 500


@bp.route('/recommendations', methods=['GET'])
def get_recommendations():
    """Get wine recommendations - fallback implementation"""
    try:
        occasion = request.args.get('occasion', '')
        food = request.args.get('food', '')
        budget = request.args.get('budget', '')
        
        # Fallback recommendations
        recommendations = []
        
        return jsonify({'success': True, 'recommendations': recommendations})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/search', methods=['GET'])
def search_wine():
    """Search for a wine by name - fallback implementation"""
    try:
        name = request.args.get('name', '')
        if not name:
            return jsonify({'success': False, 'error': 'Wine name is required'}), 400
        
        # Fallback search
        wine_info = None
        
        return jsonify({'success': wine_info is not None, 'wine': wine_info})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/reset-db', methods=['POST'])
def reset_database():
    """Reset the database"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM bottles")
        cursor.execute("DELETE FROM cave_config")
        cursor.execute("INSERT INTO cave_config (rows, cols, configured) VALUES (5, 10, 0)")
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Database reset'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/chat', methods=['POST'])
def chat():
    """Chat with AI - fallback implementation"""
    try:
        data = request.get_json() or {}
        question = data.get('question', '')
        bottles = data.get('bottles', [])
        
        if not question:
            return jsonify({'success': False, 'error': 'No question provided'}), 400
        
        # Fallback response
        response = f"Je suis votre assistant IA pour la gestion de cave à vin. Vous avez posé la question: {question}"
        
        return jsonify({
            'success': True,
            'response': response,
            'model': 'mistral-tiny'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/my-bottles', methods=['GET'])
def get_my_bottles():
    """Get bottles from the user's cellar"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM bottles")
        bottles = [row_to_dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify({'success': True, 'bottles': bottles})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/wine-pairing', methods=['POST'])
def wine_pairing():
    """Get wine pairing advice - fallback implementation"""
    try:
        data = request.get_json() or {}
        food = data.get('food', '')
        
        if not food:
            return jsonify({'success': False, 'error': 'No food specified'}), 400
        
        # Fallback advice
        advice = f"Pour accompagner {food}, je recommande un vin adapté."
        
        return jsonify({'success': True, 'advice': advice})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/wine-info', methods=['POST'])
def wine_info():
    """Get wine information - fallback implementation"""
    try:
        data = request.get_json() or {}
        wine_name = data.get('wineName', '')
        
        if not wine_name:
            return jsonify({'success': False, 'error': 'No wine name specified'}), 400
        
        # Fallback info
        info = {
            'name': wine_name,
            'grapes': '',
            'region': '',
            'drinkFrom': None,
            'drinkTo': None,
            'foodPairing': '',
            'temperature': ''
        }
        
        return jsonify({'success': True, 'info': info})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/mistral-status', methods=['GET'])
def mistral_status():
    """Check Mistral AI status"""
    try:
        import os
        from dotenv import load_dotenv
        load_dotenv()
        
        has_mistral = bool(os.environ.get('MISTRAL_API_KEY'))
        has_google = bool(os.environ.get('GOOGLE_VISION_API_KEY'))
        model = os.environ.get('MISTRAL_MODEL', 'mistral-tiny')
        
        if has_mistral and has_google:
            message = "Mistral AI et Google Vision sont configurés - Analyse complète disponible"
        elif has_mistral:
            message = "Mistral AI configuré, mais Google Vision non configuré (OCR limité)"
        else:
            message = "Mistral AI n'est pas configuré (clé API manquante)"
        
        return jsonify({
            'success': True,
            'mistralAvailable': has_mistral,
            'googleVisionAvailable': has_google,
            'model': model,
            'message': message
        })
    except Exception as e:
        return jsonify({
            'success': True,
            'mistralAvailable': False,
            'googleVisionAvailable': False,
            'model': 'mistral-tiny',
            'message': 'Erreur lors de la vérification du statut'
        })


@bp.route('/google-status', methods=['GET'])
def google_status():
    """Check Google Vision status"""
    try:
        import os
        from dotenv import load_dotenv
        load_dotenv()
        
        has_google = bool(os.environ.get('GOOGLE_VISION_API_KEY'))
        
        return jsonify({
            'success': True,
            'googleVisionAvailable': has_google
        })
    except Exception as e:
        return jsonify({
            'success': True,
            'googleVisionAvailable': False
        })
