#!/usr/bin/env python3
"""
Script de test complet pour le serveur Flask
"""
import sys
import os

# Ajouter le dossier courant au path
sys.path.insert(0, os.path.dirname(__file__))

from server_flask.app import app
from server_flask.database import init_database, reset_database

def test_server():
    """Tester toutes les fonctionnalités du serveur"""
    print("=" * 60)
    print("TEST DU SERVEUR FLASK - Ma Cave à Vin")
    print("=" * 60)
    print()
    
    # Initialiser la base de données
    print("1. Initialisation de la base de données...")
    init_database()
    print("   ✅ Base de données initialisée")
    print()
    
    # Réinitialiser pour avoir une base propre
    reset_database()
    init_database()
    
    # Créer un client de test
    with app.test_client() as client:
        
        # Test 1 : Configuration de la cave
        print("2. Test de la configuration de la cave...")
        response = client.get('/api/cave/config')
        assert response.status_code == 200, f"GET /api/cave/config a échoué: {response.status_code}"
        config = response.get_json()
        print(f"   ✅ Configuration récupérée: {config}")
        
        # Sauvegarder une nouvelle configuration
        response = client.post('/api/cave/config', json={'rows': 8, 'cols': 15})
        assert response.status_code == 200, f"POST /api/cave/config a échoué: {response.status_code}"
        assert response.get_json()['success'] == True
        print("   ✅ Configuration sauvegardée")
        print()
        
        # Test 2 : Gestion des bouteilles
        print("3. Test de la gestion des bouteilles...")
        
        # Ajouter une bouteille
        bottle_data = {
            'row': 0, 'col': 0,
            'name': 'Château Margaux',
            'year': 2018,
            'grapes': 'Cabernet Sauvignon, Merlot',
            'region': 'Bordeaux, France',
            'drinkFrom': 2025,
            'drinkTo': 2040,
            'foodPairing': 'Viandes rouges, Fromages',
            'temperature': '16-18°C'
        }
        response = client.post('/api/bottles', data=bottle_data)
        assert response.status_code == 200, f"POST /api/bottles a échoué: {response.status_code}"
        assert response.get_json()['success'] == True
        print("   ✅ Bouteille ajoutée")
        
        # Récupérer toutes les bouteilles
        response = client.get('/api/bottles')
        assert response.status_code == 200, f"GET /api/bottles a échoué: {response.status_code}"
        bottles = response.get_json()
        assert len(bottles) == 1, f"Attendu 1 bouteille, obtenu {len(bottles)}"
        print(f"   ✅ {len(bottles)} bouteille récupérée")
        
        # Vérifier les détails de la bouteille
        bottle = bottles[0]
        assert bottle['name'] == 'Château Margaux'
        assert bottle['year'] == 2018
        assert bottle['row'] == 0
        assert bottle['col'] == 0
        print("   ✅ Détails de la bouteille vérifiés")
        
        # Ajouter une deuxième bouteille
        bottle_data2 = {
            'row': 1, 'col': 1,
            'name': 'Dom Pérignon',
            'year': 2012,
            'grapes': 'Chardonnay, Pinot Noir',
            'region': 'Champagne, France',
            'drinkFrom': 2020,
            'drinkTo': 2030
        }
        response = client.post('/api/bottles', data=bottle_data2)
        assert response.status_code == 200
        print("   ✅ Deuxième bouteille ajoutée")
        
        # Vérifier qu'il y a 2 bouteilles
        response = client.get('/api/bottles')
        bottles = response.get_json()
        assert len(bottles) == 2
        print(f"   ✅ {len(bottles)} bouteilles dans la cave")
        
        # Supprimer une bouteille
        response = client.delete('/api/bottles?row=0&col=0')
        assert response.status_code == 200
        assert response.get_json()['success'] == True
        print("   ✅ Bouteille supprimée")
        
        # Vérifier qu'il reste 1 bouteille
        response = client.get('/api/bottles')
        bottles = response.get_json()
        assert len(bottles) == 1
        print(f"   ✅ {len(bottles)} bouteille restante")
        print()
        
        # Test 3 : Analyse de texte
        print("4. Test de l'analyse de texte...")
        response = client.post('/api/bottles/analyze-text', json={
            'name': 'Lafite Rothschild',
            'year': 2020,
            'grapes': 'Cabernet Sauvignon',
            'region': 'Pauillac'
        })
        assert response.status_code == 200
        result = response.get_json()
        assert result['success'] == True
        assert result['bottleInfo']['name'] == 'Lafite Rothschild'
        print("   ✅ Analyse de texte réussie")
        print()
        
        # Test 4 : Routes de statut
        print("5. Test des routes de statut...")
        response = client.get('/api/bottles/mistral-status')
        assert response.status_code == 200
        status = response.get_json()
        assert 'mistralAvailable' in status
        assert 'googleVisionAvailable' in status
        print(f"   ✅ Statut Mistral: {status['mistralAvailable']}")
        print(f"   ✅ Statut Google Vision: {status['googleVisionAvailable']}")
        
        response = client.get('/api/bottles/google-status')
        assert response.status_code == 200
        print("   ✅ Statut Google Vision vérifié")
        print()
        
        # Test 5 : Fichiers statiques
        print("6. Test des fichiers statiques...")
        static_files = ['index.html', 'style.css', 'script.js', 'cave.js', 'camera.js']
        for file in static_files:
            response = client.get(f'/{file}')
            assert response.status_code == 200, f"Fichier {file} non trouvé"
            print(f"   ✅ {file} accessible")
        print()
        
        # Test 6 : Routes du chat
        print("7. Test des routes du chat...")
        response = client.get('/api/bottles/my-bottles')
        assert response.status_code == 200
        result = response.get_json()
        assert result['success'] == True
        print(f"   ✅ my-bottles: {len(result['bottles'])} bouteilles")
        
        response = client.post('/api/bottles/chat', json={
            'question': 'Quel vin avec du fromage?',
            'bottles': []
        })
        assert response.status_code == 200
        print("   ✅ Route chat accessible")
        print()
        
        # Test 7 : Réinitialisation de la base
        print("8. Test de la réinitialisation de la base...")
        response = client.post('/api/bottles/reset-db')
        assert response.status_code == 200
        result = response.get_json()
        assert result['success'] == True
        print("   ✅ Base de données réinitialisée")
        
        # Vérifier que la base est vide
        response = client.get('/api/bottles')
        bottles = response.get_json()
        assert len(bottles) == 0
        print("   ✅ Base vide confirmée")
        print()
        
    print("=" * 60)
    print("✅ TOUS LES TESTS ONT RÉUSSI !")
    print("=" * 60)
    print()
    print("Le serveur Flask est prêt à être utilisé.")
    print("Démarrez-le avec : python run_flask.py")
    print()

if __name__ == '__main__':
    try:
        test_server()
    except AssertionError as e:
        print(f"❌ TEST ÉCHOUÉ: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ ERREUR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
