"""
Serveur Flask pour Ma Cave à Vin
"""
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import base64
import re
from datetime import datetime
from werkzeug.utils import secure_filename
from .config import Config
from .database import (
    init_database, save_cave_config, get_cave_config,
    save_bottle, get_all_bottles, delete_bottle, reset_database
)
from .mistral_analyzer import mistral_analyzer
from .mistral_ai import mistral_ai

# Initialiser l'application Flask
app = Flask(__name__, static_folder='../public')
CORS(app, resources={r"/*": {"origins": "*"}})

# Configuration
app.config.from_object(Config)

# Assurer que le dossier d'upload existe
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def allowed_file(filename):
    """Vérifier si le fichier est autorisé"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route('/')
def index():
    """Servir la page principale"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Servir les fichiers statiques"""
    return send_from_directory(app.static_folder, path)

# ==================== Routes API - Cave ====================

@app.route('/api/cave/config', methods=['GET'])
def get_cave_config_route():
    """Récupérer la configuration de la cave"""
    config = get_cave_config()
    if config:
        return jsonify(config)
    return jsonify({'configured': False}), 404

@app.route('/api/cave/config', methods=['POST'])
def save_cave_config_route():
    """Sauvegarder la configuration de la cave"""
    data = request.get_json()
    rows = data.get('rows')
    cols = data.get('cols')
    
    if not rows or not cols:
        return jsonify({'error': 'Les paramètres rows et cols sont requis'}), 400
    
    success = save_cave_config(rows, cols)
    if success:
        return jsonify({'success': True})
    return jsonify({'error': 'Erreur lors de la sauvegarde de la configuration'}), 500

# ==================== Routes API - Bottles ====================

@app.route('/api/bottles', methods=['GET'])
def get_bottles():
    """Récupérer toutes les bouteilles"""
    bottles = get_all_bottles()
    return jsonify(bottles)

@app.route('/api/bottles/analyze', methods=['POST'])
def analyze_bottle():
    """Analyser une bouteille avec IA"""
    try:
        # Vérifier si une image est uploadée
        image_path = None
        if 'image' in request.files:
            file = request.files['image']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                unique_filename = f"{datetime.now().timestamp()}-{filename}"
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
                file.save(filepath)
                image_path = filepath
        
        # Analyser avec Mistral uniquement (sans OCR pour l'instant)
        result = mistral_analyzer.analyze_bottle_with_mistral_only(image_path, False)
        
        return jsonify({
            'success': True,
            'bottleInfo': result,
            'mistralAvailable': bool(Config.MISTRAL_API_KEY),
            'googleVisionAvailable': bool(Config.GOOGLE_VISION_API_KEY),
            'analysisMethod': result.get('analysisMethod'),
            'extractedText': result.get('extractedText')
        })
    except Exception as e:
        print(f"Erreur analyse IA: {e}")
        return jsonify({
            'success': False,
            'error': 'Erreur serveur lors de l\'analyse',
            'mistralAvailable': bool(Config.MISTRAL_API_KEY),
            'googleVisionAvailable': bool(Config.GOOGLE_VISION_API_KEY),
            'bottleInfo': mistral_analyzer.get_fallback_bottle_info(str(e))
        }), 500

@app.route('/api/bottles/analyze-two-step', methods=['POST'])
def analyze_bottle_two_step():
    """Analyser une bouteille en deux étapes (OCR + IA)"""
    try:
        image_path = None
        is_base64 = False
        
        # Vérifier si une image est uploadée
        if 'image' in request.files:
            file = request.files['image']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                unique_filename = f"{datetime.now().timestamp()}-{filename}"
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
                file.save(filepath)
                image_path = filepath
        elif 'image' in request.form:
            # Image en base64
            image_path = request.form['image']
            is_base64 = True
        
        # Récupérer les données manuelles si fournies
        manual_data = None
        if any(field in request.form for field in ['name', 'year']):
            manual_data = {
                'name': request.form.get('name'),
                'year': request.form.get('year')
            }
            if manual_data.get('year'):
                try:
                    manual_data['year'] = int(manual_data['year'])
                except ValueError:
                    manual_data['year'] = None
        
        # Vérifier si la correction du nom est demandée
        correct_name = request.form.get('correctName', 'true').lower() != 'false'
        
        result = mistral_analyzer.analyze_bottle_with_two_step_process(
            image_path, is_base64, manual_data, correct_name
        )
        
        return jsonify({
            'success': True,
            'bottleInfo': result,
            'mistralAvailable': bool(Config.MISTRAL_API_KEY),
            'googleVisionAvailable': bool(Config.GOOGLE_VISION_API_KEY),
            'analysisMethod': result.get('analysisMethod'),
            'extractedText': result.get('extractedText'),
            'requiresManualInput': result.get('requiresManualInput', False),
            'missingFields': result.get('missingFields'),
            'partialData': result.get('partialData')
        })
    except Exception as e:
        print(f"Erreur analyse IA 2 étapes: {e}")
        return jsonify({
            'success': False,
            'error': 'Erreur serveur lors de l\'analyse',
            'mistralAvailable': bool(Config.MISTRAL_API_KEY),
            'googleVisionAvailable': bool(Config.GOOGLE_VISION_API_KEY),
            'bottleInfo': mistral_analyzer.get_fallback_bottle_info(str(e)),
            'requiresManualInput': True,
            'missingFields': {'name': True, 'year': True},
            'partialData': None
        }), 500

@app.route('/api/bottles/analyze-text', methods=['POST'])
def analyze_text():
    """Analyser du texte manuel"""
    try:
        data = request.get_json()
        name = data.get('name')
        year = data.get('year')
        grapes = data.get('grapes')
        region = data.get('region')
        
        if not name and not year and not grapes and not region:
            return jsonify({'success': False, 'error': 'Au moins un champ est requis'}), 400
        
        manual_data = {
            'name': name,
            'year': year,
            'grapes': grapes,
            'region': region
        }
        
        result = mistral_analyzer.analyze_with_manual_text(manual_data)
        
        return jsonify({
            'success': True,
            'bottleInfo': result,
            'analysisMethod': result.get('analysisMethod', 'Analyse texte manuel')
        })
    except Exception as e:
        print(f"Erreur analyse texte: {e}")
        return jsonify({
            'success': False,
            'error': 'Erreur serveur',
            'bottleInfo': mistral_analyzer.get_fallback_bottle_info(str(e))
        }), 500

@app.route('/api/bottles/analyze-base64', methods=['POST'])
def analyze_base64():
    """Analyser une image en base64"""
    try:
        data = request.get_json()
        image = data.get('image')
        
        if not image:
            return jsonify({'success': False, 'error': 'Aucune image fournie'}), 400
        
        result = mistral_analyzer.analyze_bottle_with_mistral_only(image, True)
        
        return jsonify({
            'success': True,
            'bottleInfo': result,
            'mistralAvailable': bool(Config.MISTRAL_API_KEY),
            'analysisMethod': result.get('analysisMethod')
        })
    except Exception as e:
        print(f"Erreur analyse base64: {e}")
        return jsonify({
            'success': False,
            'error': 'Erreur serveur',
            'mistralAvailable': bool(Config.MISTRAL_API_KEY),
            'bottleInfo': mistral_analyzer.get_fallback_bottle_info(str(e))
        }), 500

@app.route('/api/bottles', methods=['POST'])
def save_bottle_route():
    """Sauvegarder une bouteille"""
    try:
        bottle_data = request.form.to_dict()
        
        # Gérer l'upload de photo
        if 'photo' in request.files:
            file = request.files['photo']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                unique_filename = f"{datetime.now().timestamp()}-{filename}"
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
                file.save(filepath)
                bottle_data['photo'] = unique_filename
        elif 'photo' in bottle_data and bottle_data['photo'].startswith('data:image/'):
            # Gérer les images en base64

            base64_data = re.sub(r'^data:image/\w+;base64,', '', bottle_data['photo'])
            image_data = base64.b64decode(base64_data)
            filename = f"{datetime.now().timestamp()}-camera.jpg"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            with open(filepath, 'wb') as f:
                f.write(image_data)
            bottle_data['photo'] = filename
        
        # Convertir les champs numériques
        if 'row' in bottle_data:
            bottle_data['row'] = int(bottle_data['row'])
        if 'col' in bottle_data:
            bottle_data['col'] = int(bottle_data['col'])
        if 'year' in bottle_data and bottle_data['year']:
            bottle_data['year'] = int(bottle_data['year'])
        if 'drinkFrom' in bottle_data and bottle_data['drinkFrom']:
            bottle_data['drinkFrom'] = int(bottle_data['drinkFrom'])
        if 'drinkTo' in bottle_data and bottle_data['drinkTo']:
            bottle_data['drinkTo'] = int(bottle_data['drinkTo'])
        
        success = save_bottle(bottle_data)
        if success:
            return jsonify({'success': True})
        return jsonify({'error': 'Erreur lors de la sauvegarde'}), 500
    except Exception as e:
        print(f"Erreur sauvegarde bouteille: {e}")
        return jsonify({'error': 'Erreur lors de la sauvegarde'}), 500

@app.route('/api/bottles', methods=['DELETE'])
def delete_bottle_route():
    """Supprimer une bouteille"""
    try:
        row = request.args.get('row')
        col = request.args.get('col')
        
        if not row or not col:
            return jsonify({'error': 'Les paramètres row et col sont requis'}), 400
        
        row = int(row)
        col = int(col)
        
        success = delete_bottle(row, col)
        if success:
            return jsonify({'success': True})
        return jsonify({'error': 'Erreur lors de la suppression'}), 500
    except Exception as e:
        print(f"Erreur suppression bouteille: {e}")
        return jsonify({'error': 'Erreur lors de la suppression'}), 500

@app.route('/api/bottles/recommendations', methods=['GET'])
def get_recommendations():
    """Obtenir des recommandations de vin"""
    try:
        occasion = request.args.get('occasion')
        food = request.args.get('food')
        budget = request.args.get('budget')
        
        recommendations = mistral_ai.recommend_wine_for_occasion(occasion, food, budget)
        return jsonify({'success': True, 'recommendations': recommendations})
    except Exception as e:
        print(f"Erreur recommandations: {e}")
        return jsonify({'success': False, 'error': 'Erreur serveur'}), 500

@app.route('/api/bottles/search', methods=['GET'])
def search_wine():
    """Chercher un vin par son nom"""
    try:
        name = request.args.get('name')
        if not name:
            return jsonify({'success': False, 'error': 'Le nom du vin est requis'}), 400
        
        wine_info = mistral_ai.search_wine_by_name(name)
        if wine_info:
            return jsonify({'success': True, 'wine': wine_info})
        return jsonify({'success': False, 'wine': None})
    except Exception as e:
        print(f"Erreur recherche vin: {e}")
        return jsonify({'success': False, 'error': 'Erreur serveur'}), 500

@app.route('/api/bottles/reset-db', methods=['POST'])
def reset_db():
    """Réinitialiser la base de données"""
    try:
        success = reset_database()
        if success:
            return jsonify({'success': True, 'message': 'Base de données réinitialisée'})
        return jsonify({'success': False, 'error': 'Erreur lors de la réinitialisation'}), 500
    except Exception as e:
        print(f"Erreur réinitialisation DB: {e}")
        return jsonify({'success': False, 'error': 'Erreur lors de la réinitialisation'}), 500

@app.route('/api/bottles/chat', methods=['POST'])
def chat():
    """Poser une question au chat IA"""
    try:
        data = request.get_json()
        question = data.get('question')
        bottles = data.get('bottles', [])
        
        if not question:
            return jsonify({'success': False, 'error': 'Aucune question fournie'}), 400
        
        response = mistral_ai.ask_chat_question_with_cave(question, bottles)
        return jsonify({
            'success': True,
            'response': response,
            'model': Config.MISTRAL_MODEL
        })
    except Exception as e:
        print(f"Erreur chat IA: {e}")
        return jsonify({'success': False, 'error': 'Erreur serveur lors de la requête IA'}), 500

@app.route('/api/bottles/my-bottles', methods=['GET'])
def get_my_bottles():
    """Récupérer les bouteilles de la cave (pour le chatbot)"""
    try:
        bottles = get_all_bottles()
        return jsonify({'success': True, 'bottles': bottles})
    except Exception as e:
        print(f"Erreur récupération bouteilles pour chatbot: {e}")
        return jsonify({'error': 'Erreur lors de la récupération des bouteilles'}), 500

@app.route('/api/bottles/wine-pairing', methods=['POST'])
def wine_pairing():
    """Obtenir des conseils d'accords mets-vins"""
    try:
        data = request.get_json()
        food = data.get('food')
        
        if not food:
            return jsonify({'success': False, 'error': 'Aucun plat spécifié'}), 400
        
        advice = mistral_ai.get_wine_pairing_advice(food)
        return jsonify({'success': True, 'advice': advice})
    except Exception as e:
        print(f"Erreur accords mets-vins: {e}")
        return jsonify({'success': False, 'error': 'Erreur serveur'}), 500

@app.route('/api/bottles/wine-info', methods=['POST'])
def wine_info():
    """Obtenir des informations sur un vin"""
    try:
        data = request.get_json()
        wine_name = data.get('wineName')
        
        if not wine_name:
            return jsonify({'success': False, 'error': 'Aucun nom de vin spécifié'}), 400
        
        info = mistral_ai.get_wine_info(wine_name)
        return jsonify({'success': True, 'info': info})
    except Exception as e:
        print(f"Erreur infos vin: {e}")
        return jsonify({'success': False, 'error': 'Erreur serveur'}), 500

@app.route('/api/bottles/mistral-status', methods=['GET'])
def mistral_status():
    """Vérifier le statut de Mistral AI"""
    has_mistral = bool(Config.MISTRAL_API_KEY)
    has_google = bool(Config.GOOGLE_VISION_API_KEY)
    model = Config.MISTRAL_MODEL or 'mistral-tiny'
    
    message = ""
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

@app.route('/api/bottles/google-status', methods=['GET'])
def google_status():
    """Vérifier le statut de Google Vision"""
    has_google = bool(Config.GOOGLE_VISION_API_KEY)
    return jsonify({
        'success': True,
        'googleVisionAvailable': has_google
    })

# ==================== Middleware de gestion des erreurs ====================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Ressource non trouvée'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Une erreur est survenue. Veuillez réessayer.'}), 500

# ==================== Démarrer le serveur ====================

if __name__ == '__main__':
    # Initialiser la base de données
    init_database()
    
    # Démarrer le serveur
    port = int(os.environ.get('PORT', 3000))
    print(f"Serveur démarré sur http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
