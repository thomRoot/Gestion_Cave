# Ma Cave à Vin - Version Flask Python

Cette version convertit l'application Node.js/Express originale en une application Python utilisant Flask.

## Structure du projet

```
Gestion_Cave/
├── python_server/                  # Backend Flask
│   ├── __init__.py
│   ├── app.py                      # Application Flask principale
│   └── routes/
│       ├── __init__.py
│       ├── bottles.py              # Routes pour les bouteilles
│       └── cave.py                 # Routes pour la configuration de la cave
├── public/                         # Frontend (inchangé)
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   ├── cave.js
│   ├── camera.js
│   └── uploads/
├── data/                          # Base de données SQLite
│   └── cave.db
├── run_flask.py                   # Script pour lancer l'application
├── requirements.txt               # Dépendances Python
└── .env.example                   # Configuration
```

## Prérequis

- Python 3.7+
- pip (gestionnaire de paquets Python)

## Installation

### 1. Cloner le dépôt (si ce n'est pas déjà fait)
```bash
git clone https://github.com/thomRoot/Gestion_Cave.git
cd Gestion_Cave
```

### 2. Installer les dépendances Python
```bash
pip install -r requirements.txt
```

### 3. Configurer les variables d'environnement
```bash
cp .env.example .env
# Éditer .env et ajouter vos clés API
```

Les variables d'environnement nécessaires :
- `FLASK_SECRET_KEY` : Clé secrète pour Flask (changez-la en production)
- `MISTRAL_API_KEY` : Clé API Mistral (optionnelle, pour l'IA)
- `GOOGLE_VISION_API_KEY` : Clé API Google Vision (optionnelle, pour l'OCR)
- `PORT` : Port du serveur (par défaut : 5000)

## Lancement

### Méthode 1 : Utiliser le script de lancement
```bash
python run_flask.py
```

### Méthode 2 : Lancer directement
```bash
cd python_server
python -m python_server.app
```

### Méthode 3 : En mode développement
```bash
# Sur Linux/Mac
FLASK_APP=python_server.app FLASK_ENV=development flask run --port 5000

# Sur Windows
set FLASK_APP=python_server.app
set FLASK_ENV=development
flask run --port 5000
```

L'application sera disponible sur [http://localhost:5000](http://localhost:5000)

## Dépendances

Les dépendances sont spécifiées dans `requirements.txt` :
- Flask==3.0.0
- Flask-CORS==4.0.0
- Flask-Session==0.5.0
- python-dotenv==1.0.0
- requests==2.31.0

## Fonctionnalités implémentées

### API Endpoints

#### Cave Configuration
- `GET /api/cave/config` - Récupérer la configuration de la cave
- `POST /api/cave/config` - Sauvegarder la configuration de la cave

#### Bottles
- `GET /api/bottles/` - Récupérer toutes les bouteilles
- `POST /api/bottles/` - Ajouter/mettre à jour une bouteille
- `DELETE /api/bottles/` - Supprimer une bouteille
- `POST /api/bottles/analyze` - Analyser une image de bouteille (placeholder)
- `POST /api/bottles/analyze-two-step` - Analyse en deux étapes (placeholder)
- `POST /api/bottles/analyze-text` - Analyser du texte (placeholder)
- `POST /api/bottles/analyze-base64` - Analyser une image base64 (placeholder)
- `GET /api/bottles/recommendations` - Obtenir des recommandations
- `GET /api/bottles/search` - Rechercher un vin
- `POST /api/bottles/reset-db` - Réinitialiser la base de données
- `POST /api/bottles/chat` - Chat avec l'IA (placeholder)
- `GET /api/bottles/my-bottles` - Obtenir mes bouteilles
- `POST /api/bottles/wine-pairing` - Conseils d'accords mets-vins
- `POST /api/bottles/wine-info` - Informations sur un vin
- `GET /api/bottles/mistral-status` - Statut de Mistral AI
- `GET /api/bottles/google-status` - Statut de Google Vision

#### Autres
- `GET /api/health` - Vérification de santé
- `GET /` - Servir l'index.html
- `GET /<path:path>` - Servir les fichiers statiques

### Notes sur l'IA

Les endpoints liés à l'IA (Mistral, Google Vision) sont actuellement des placeholders. Pour une implémentation complète, vous devez :

1. Configurer vos clés API dans le fichier `.env`
2. Implémenter les appels réels à l'API Mistral dans les fichiers appropriés
3. Implémenter les appels à Google Vision pour l'OCR

## Migration depuis Node.js

### Différences principales

1. **Backend** : Node.js/Express → Python/Flask
2. **Base de données** : SQLite3 (inchangée, compatible)
3. **Gestion des fichiers** : `multer` → `werkzeug.utils.secure_filename`
4. **Middleware** : Express middleware → Flask blueprints et decorators
5. **CORS** : `cors` package → `Flask-CORS`
6. **Sessions** : `express-session` → `Flask-Session`

### Compatibilité

- ✅ Toutes les routes API sont implémentées
- ✅ La base de données SQLite est compatible
- ✅ Le frontend (HTML/CSS/JS) reste inchangé
- ✅ Les fichiers statiques sont servis correctement
- ⚠️ L'intégration IA est en placeholder (à implémenter)

## Déploiement

### Pour la production

1. Utilisez un serveur WSGI comme Gunicorn ou uWSGI
2. Configurez un reverse proxy (Nginx, Apache)
3. Activez HTTPS
4. Changez `FLASK_SECRET_KEY` et utilisez des variables d'environnement sécurisées

Exemple avec Gunicorn :
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 python_server.app:app
```

### Avec Docker

Créez un Dockerfile :
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY . .

RUN pip install -r requirements.txt

EXPOSE 5000
CMD ["python", "run_flask.py"]
```

## Contribution

Les contributions sont les bienvenues ! Veuillez :

1. Forker le dépôt
2. Créer une branche (`git checkout -b feature/ma-fonctionnalité`)
3. Commiter vos changements (`git commit -m 'Ajout de ma fonctionnalité'`)
4. Pousser sur la branche (`git push origin feature/ma-fonctionnalité`)
5. Ouvrir une Pull Request

## Licence

MIT License - voir le fichier LICENSE pour plus de détails.
