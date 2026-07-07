#!/usr/bin/env python3
"""
Script pour démarrer le serveur Flask
"""
import os
import sys

# Ajouter le dossier server_flask au path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'server_flask'))

from server_flask.app import app
from server_flask.database import init_database

if __name__ == '__main__':
    # Initialiser la base de données
    init_database()
    
    # Démarrer le serveur
    port = int(os.environ.get('PORT', 3000))
    print(f"Serveur Flask démarré sur http://localhost:{port}")
    print("Appuyez sur Ctrl+C pour arrêter le serveur")
    
    app.run(host='0.0.0.0', port=port, debug=True)
