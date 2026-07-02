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
import json

bp = Blueprint('bottles', __name__)

DATABASE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data/cave.db')
UPLOADS_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'public/uploads')

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
        return jsonify({'error': 'Error retrieving bottles'}), 500

@bp.route('/', methods=['POST'])
def save_bottle():
    """Save a bottle to the database"""
    try:
        data = request.form.to_dict()
        
        # Handle file upload
        if 'photo' in request.files:
            file = request.files['photo']
            if file and file.filename != '':
                filename = secure_filename(file.filename)
                unique_filename = f"{datetime.now().timestamp()}-{filename}"
                file.save(os.path.join(UPLOADS_PATH, unique_filename))
                data['photo'] = unique_filename
        
        # Handle base64 image
        if 'photo' in data and data['photo'] and data['photo'].startswith('data:image/'):
            base64_data = data['photo'].split(',')[1]
            buffer = base64.b64decode(base64_data)
            filename = f"{datetime.now().timestamp()}-camera.jpg"
            file_path = os.path.join(UPLOADS_PATH, filename)
            with open(file_path, 'wb') as f:
                f.write(buffer)
            data['photo'] = filename
        
        # Extract bottle data
        row = int(data.get('row', 0))
        col = int(data.get('col', 0))
        name = data.get('name', '')
        year = int(data.get('year', 0)) if data.get('year') else None
        grapes = data.get('grapes', '')
        region = data.get('region', '')
        drinkFrom = int(data.get('drinkFrom', 0)) if data.get('drinkFrom') else None
        drinkTo = int(data.get('drinkTo', 0)) if data.get('drinkTo') else None
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
        return jsonify({'error': 'Error saving bottle'}), 500

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
        return jsonify({'error': 'Error deleting bottle'}), 500

@bp.route('/analyze', methods=['POST'])
def analyze_bottle():
    """Analyze a bottle image (placeholder for Mistral AI integration)"""
    try:
        # This is a placeholder - in a real implementation, you would call Mistral AI
        # For now, return a fallback response
        return jsonify({
            'success': True,
            'bottleInfo': {
                'name': 'Château Margaux',
                'year': 2015,
                'grapes': 'Cabernet Sauvignon, Merlot',
                'region': 'Bordeaux',
                'drinkFrom': 2025,
                'drinkTo': 2040,
                'foodPairing': 'Bœuf, Gibier, Fromage',
                'temperature': '16-18°C',
                'analysisMethod': 'Fallback (Mistral AI not configured)'
            },
            'mistralAvailable': False,
            'googleVisionAvailable': False
        })
    except Exception as e:
        current_app.logger.error(f"Error analyzing bottle: {e}")
        return jsonify({
            'success': False,
            'error': 'Error analyzing bottle',
            'mistralAvailable': False,
            'googleVisionAvailable': False,
            'bottleInfo': {
                'name': '',
                'year': None,
                'grapes': '',
                'region': '',
                'drinkFrom': None,
                'drinkTo': None,
                'foodPairing': '',
                'temperature': ''
            }
        }), 500

@bp.route('/analyze-two-step', methods=['POST'])
def analyze_bottle_two_step():
    """Two-step analysis (placeholder)"""
    try:
        return jsonify({
            'success': True,
            'bottleInfo': {
                'name': 'Château Margaux',
                'year': 2015,
                'grapes': 'Cabernet Sauvignon, Merlot',
                'region': 'Bordeaux',
                'drinkFrom': 2025,
                'drinkTo': 2040,
                'foodPairing': 'Bœuf, Gibier, Fromage',
                'temperature': '16-18°C',
                'analysisMethod': 'Fallback'
            },
            'mistralAvailable': False,
            'googleVisionAvailable': False,
            'requiresManualInput': False,
            'missingFields': None,
            'partialData': None
        })
    except Exception as e:
        current_app.logger.error(f"Error in two-step analysis: {e}")
        return jsonify({
            'success': False,
            'error': 'Error in analysis',
            'mistralAvailable': False,
            'googleVisionAvailable': False,
            'bottleInfo': {},
            'requiresManualInput': True,
            'missingFields': {'name': True, 'year': True},
            'partialData': None
        }), 500

@bp.route('/analyze-text', methods=['POST'])
def analyze_text():
    """Analyze text (placeholder)"""
    try:
        data = request.get_json()
        name = data.get('name', '')
        year = data.get('year', None)
        grapes = data.get('grapes', '')
        region = data.get('region', '')
        
        # Placeholder analysis - in real implementation, call Mistral AI
        return jsonify({
            'success': True,
            'bottleInfo': {
                'name': name,
                'year': year,
                'grapes': grapes,
                'region': region,
                'drinkFrom': 2025,
                'drinkTo': 2035,
                'foodPairing': 'Viande rouge, Fromage',
                'temperature': '16-18°C',
                'analysisMethod': 'Analyse texte manuel'
            }
        })
    except Exception as e:
        current_app.logger.error(f"Error analyzing text: {e}")
        return jsonify({'success': False, 'error': 'Error analyzing text'}), 500

@bp.route('/analyze-base64', methods=['POST'])
def analyze_base64():
    """Analyze base64 image (placeholder)"""
    try:
        data = request.get_json()
        image_data = data.get('image', '')
        
        # Placeholder - in real implementation, process the base64 image
        return jsonify({
            'success': True,
            'bottleInfo': {
                'name': 'Château Margaux',
                'year': 2015,
                'grapes': 'Cabernet Sauvignon, Merlot',
                'region': 'Bordeaux',
                'drinkFrom': 2025,
                'drinkTo': 2040,
                'foodPairing': 'Bœuf, Gibier, Fromage',
                'temperature': '16-18°C',
                'analysisMethod': 'Fallback'
            },
            'mistralAvailable': False
        })
    except Exception as e:
        current_app.logger.error(f"Error analyzing base64: {e}")
        return jsonify({
            'success': False,
            'error': 'Error analyzing image',
            'mistralAvailable': False,
            'bottleInfo': {}
        }), 500

@bp.route('/recommendations', methods=['GET'])
def get_recommendations():
    """Get wine recommendations (placeholder)"""
    try:
        occasion = request.args.get('occasion', '')
        food = request.args.get('food', '')
        budget = request.args.get('budget', '')
        
        # Placeholder recommendations
        recommendations = [
            {
                'name': 'Château Margaux 2015',
                'type': 'Rouge',
                'region': 'Bordeaux',
                'price': '€200-300',
                'description': 'Grand vin de Bordeaux, parfait pour les grandes occasions'
            },
            {
                'name': 'Dom Pérignon 2010',
                'type': 'Champagne',
                'region': 'Champagne',
                'price': '€150-200',
                'description': 'Champagne de prestige pour célébrer'
            }
        ]
        
        return jsonify({'success': True, 'recommendations': recommendations})
    except Exception as e:
        current_app.logger.error(f"Error getting recommendations: {e}")
        return jsonify({'success': False, 'error': 'Error getting recommendations'}), 500

@bp.route('/search', methods=['GET'])
def search_wine():
    """Search for a wine by name (placeholder)"""
    try:
        name = request.args.get('name', '')
        if not name:
            return jsonify({'success': False, 'error': 'Wine name is required'}), 400
        
        # Placeholder search
        wine_info = {
            'name': name,
            'year': 2015,
            'grapes': 'Cabernet Sauvignon',
            'region': 'Bordeaux',
            'drinkFrom': 2025,
            'drinkTo': 2035,
            'foodPairing': 'Viande rouge, Fromage',
            'temperature': '16-18°C'
        }
        
        return jsonify({'success': True, 'wine': wine_info})
    except Exception as e:
        current_app.logger.error(f"Error searching wine: {e}")
        return jsonify({'success': False, 'error': 'Error searching wine'}), 500

@bp.route('/reset-db', methods=['POST'])
def reset_database():
    """Reset the database (dangerous operation)"""
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
        current_app.logger.error(f"Error resetting database: {e}")
        return jsonify({'success': False, 'error': 'Error resetting database'}), 500

@bp.route('/chat', methods=['POST'])
def chat():
    """Chat with AI (placeholder for Mistral AI integration)"""
    try:
        data = request.get_json()
        question = data.get('question', '')
        bottles = data.get('bottles', [])
        
        if not question:
            return jsonify({'success': False, 'error': 'No question provided'}), 400
        
        # Placeholder response - in real implementation, call Mistral AI
        response = f"Je suis votre assistant IA pour la gestion de cave à vin. Vous avez posé la question: {question}"
        
        if bottles:
            response += f"\n\nVous avez {len(bottles)} bouteilles dans votre cave."
        
        return jsonify({
            'success': True,
            'response': response,
            'model': 'mistral-tiny'
        })
    except Exception as e:
        current_app.logger.error(f"Error in chat: {e}")
        return jsonify({'success': False, 'error': 'Error in chat'}), 500

@bp.route('/my-bottles', methods=['GET'])
def get_my_bottles():
    """Get bottles from the user's cellar (for chatbot)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM bottles")
        bottles = [row_to_dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify({'success': True, 'bottles': bottles})
    except Exception as e:
        current_app.logger.error(f"Error getting my bottles: {e}")
        return jsonify({'error': 'Error retrieving bottles'}), 500

@bp.route('/wine-pairing', methods=['POST'])
def wine_pairing():
    """Get wine pairing advice (placeholder)"""
    try:
        data = request.get_json()
        food = data.get('food', '')
        
        if not food:
            return jsonify({'success': False, 'error': 'No food specified'}), 400
        
        # Placeholder advice
        advice = f"Pour accompagner {food}, je recommande un vin rouge puissant comme un Bordeaux ou un Syrah."
        
        return jsonify({'success': True, 'advice': advice})
    except Exception as e:
        current_app.logger.error(f"Error in wine pairing: {e}")
        return jsonify({'success': False, 'error': 'Error in wine pairing'}), 500

@bp.route('/wine-info', methods=['POST'])
def wine_info():
    """Get wine information (placeholder)"""
    try:
        data = request.get_json()
        wine_name = data.get('wineName', '')
        
        if not wine_name:
            return jsonify({'success': False, 'error': 'No wine name specified'}), 400
        
        # Placeholder info
        info = {
            'name': wine_name,
            'grapes': 'Cabernet Sauvignon, Merlot',
            'region': 'Bordeaux',
            'drinkFrom': 2025,
            'drinkTo': 2035,
            'foodPairing': 'Viande rouge, Fromage',
            'temperature': '16-18°C'
        }
        
        return jsonify({'success': True, 'info': info})
    except Exception as e:
        current_app.logger.error(f"Error getting wine info: {e}")
        return jsonify({'success': False, 'error': 'Error getting wine info'}), 500

@bp.route('/mistral-status', methods=['GET'])
def mistral_status():
    """Check Mistral AI status"""
    try:
        # Check if Mistral API key is configured
        from dotenv import load_dotenv
        import os
        load_dotenv()
        
        has_mistral = bool(os.environ.get('MISTRAL_API_KEY'))
        has_google = bool(os.environ.get('GOOGLE_VISION_API_KEY'))
        model = os.environ.get('MISTRAL_MODEL', 'mistral-tiny')
        
        message = "Mistral AI et Google Vision sont configurés - Analyse complète disponible"
        if has_mistral and not has_google:
            message = "Mistral AI configuré, mais Google Vision non configuré (OCR limité)"
        elif not has_mistral:
            message = "Mistral AI n'est pas configuré (clé API manquante)"
        
        return jsonify({
            'success': True,
            'mistralAvailable': has_mistral,
            'googleVisionAvailable': has_google,
            'model': model,
            'message': message
        })
    except Exception as e:
        current_app.logger.error(f"Error checking Mistral status: {e}")
        return jsonify({
            'success': True,
            'mistralAvailable': False,
            'googleVisionAvailable': False,
            'model': 'mistral-tiny',
            'message': 'Mistral AI n\'est pas configuré'
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
        current_app.logger.error(f"Error checking Google status: {e}")
        return jsonify({
            'success': True,
            'googleVisionAvailable': False
        })
