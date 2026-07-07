# Ma Cave à Vin - Version Flask

Ce dossier contient la version Flask du serveur pour l'application Ma Cave à Vin.

## Prérequis

- Python 3.7+
- pip

## Installation

### 1. Installer les dépendances

```bash
pip install -r requirements.txt
```

### 2. Configurer les variables d'environnement

Copiez le fichier `.env.example` en `.env` et ajoutez vos clés API :

```bash
cp .env.example .env
# Éditer .env et ajouter vos clés API
```

Vous avez besoin de :
- `MISTRAL_API_KEY` : Clé API Mistral (obligatoire pour l'IA)
- `GOOGLE_VISION_API_KEY` : Clé API Google Vision (optionnelle pour l'OCR)

### 3. Démarrer le serveur

#### Option 1 : Utiliser le script de démarrage

```bash
python run_flask.py
```

#### Option 2 : Démarrer directement

```bash
cd server_flask
python app.py
```

#### Option 3 : Avec des variables d'environnement

```bash
export FLASK_APP=server_flask.app
flask run --port 3000
```

Le serveur sera disponible sur [http://localhost:3000](http://localhost:3000)

## Structure du projet Flask

```
server_flask/
├── __init__.py          # Initialisation du package
├── app.py               # Application Flask principale
├── config.py            # Configuration de l'application
├── database.py          # Gestion de la base de données SQLite
├── google_vision.py     # Intégration Google Vision OCR
├── mistral_ai.py        # Intégration Mistral AI
└── mistral_analyzer.py  # Analyseur de bouteilles

run_flask.py             # Script de démarrage
requirements.txt         # Dépendances Python
```

## Routes API disponibles

### Configuration de la cave
- `GET /api/cave/config` - Récupérer la configuration
- `POST /api/cave/config` - Sauvegarder la configuration

### Gestion des bouteilles
- `GET /api/bottles` - Récupérer toutes les bouteilles
- `POST /api/bottles` - Sauvegarder une bouteille
- `DELETE /api/bottles` - Supprimer une bouteille (avec paramètres `row` et `col`)

### Analyse IA
- `POST /api/bottles/analyze` - Analyser une bouteille (upload de fichier)
- `POST /api/bottles/analyze-two-step` - Analyser en deux étapes (OCR + IA)
- `POST /api/bottles/analyze-text` - Analyser du texte manuel
- `POST /api/bottles/analyze-base64` - Analyser une image en base64

### Chat IA
- `POST /api/bottles/chat` - Poser une question au chat IA
- `GET /api/bottles/my-bottles` - Récupérer les bouteilles pour le chatbot
- `POST /api/bottles/wine-pairing` - Obtenir des conseils d'accords mets-vins
- `POST /api/bottles/wine-info` - Obtenir des informations sur un vin
- `GET /api/bottles/recommendations` - Obtenir des recommandations

### Statut
- `GET /api/bottles/mistral-status` - Vérifier le statut de Mistral AI
- `GET /api/bottles/google-status` - Vérifier le statut de Google Vision

### Base de données
- `POST /api/bottles/reset-db` - Réinitialiser la base de données

## Différences avec la version Node.js

1. **Framework** : Flask au lieu de Express
2. **Gestion des fichiers** : Utilisation de `werkzeug.utils.secure_filename` au lieu de `multer`
3. **Base de données** : Même structure SQLite, mais avec `sqlite3` natif au lieu du module Node.js
4. **Configuration** : Utilisation de `python-dotenv` au lieu d'un chargement manuel
5. **CORS** : Géré par `Flask-CORS` au lieu du middleware Express

## Résolution des problèmes

### Problème : Module non trouvé

Si vous obtenez une erreur "Module not found", assurez-vous que :
1. Vous avez installé les dépendances : `pip install -r requirements.txt`
2. Vous exécutez le script depuis le bon dossier

### Problème : Base de données non trouvée

Le serveur essaie plusieurs chemins pour la base de données :
- `./data/cave.db`
- `/workspace/thomRoot__Gestion_Cave/data/cave.db`
- `./cave.db`
- `/tmp/cave.db`

Si vous avez des problèmes, créez manuellement le dossier :
```bash
mkdir -p data
chmod 755 data
```

### Problème : Clés API non reconnues

Assurez-vous que :
1. Le fichier `.env` est dans le même dossier que `run_flask.py`
2. Le fichier `.env` contient les bonnes clés
3. Vous avez redémarré le serveur après avoir modifié le fichier `.env`

## Déploiement

Pour déployer en production :

```bash
# Installer gunicorn
gunicorn server_flask.app:app -b 0.0.0.0:3000
```

Ou avec uWSGI :

```bash
uwsgi --http :3000 --module server_flask.app --callable app
```

## Licence

MIT License - Copyright (c) 2026 thomRoot
