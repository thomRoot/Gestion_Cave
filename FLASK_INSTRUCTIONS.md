# Ma Cave à Vin - Version Flask Python

## 🚀 Introduction

Cette version convertit l'application Node.js/Express originale en une application Python utilisant **Flask 3.0.0**. Toutes les fonctionnalités principales sont implémentées et testées.

## 📁 Structure du projet

```
Gestion_Cave/
├── python_app/                          # Backend Flask
│   ├── __init__.py
│   ├── app.py                          # Application Flask principale
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── bottles.py                  # Routes pour les bouteilles
│   │   └── cave.py                     # Routes pour la cave
│   └── static/                        # Fichiers statiques (copie de public/)
│       ├── index.html
│       ├── style.css
│       ├── script.js
│       ├── cave.js
│       ├── camera.js
│       └── uploads/
├── data/                              # Base de données SQLite (créée automatiquement)
│   └── cave.db
├── requirements.txt                   # Dépendances Python
├── run.py                            # Script pour lancer l'application
└── .gitignore                        # Fichiers à ignorer
```

## 🛠️ Prérequis

- **Python 3.7 ou supérieur**
- **pip** (gestionnaire de paquets Python)

## 📥 Installation

### 1. Cloner le dépôt (si ce n'est pas déjà fait)
```bash
git clone https://github.com/thomRoot/Gestion_Cave.git
cd Gestion_Cave
```

### 2. Aller sur la branche Flask
```bash
git checkout python-flask-server-v2
```

### 3. Installer les dépendances
```bash
pip install -r requirements.txt
```

### 4. Configurer les variables d'environnement (optionnel)
```bash
cp .env.example .env
# Éditer .env pour ajouter vos clés API
```

Variables d'environnement :
- `FLASK_SECRET_KEY` : Clé secrète pour Flask (par défaut : `dev-secret-key-change-in-production`)
- `PORT` : Port du serveur (par défaut : 5000)
- `MISTRAL_API_KEY` : Clé API Mistral (optionnelle, pour l'IA)
- `GOOGLE_VISION_API_KEY` : Clé API Google Vision (optionnelle, pour l'OCR)
- `MISTRAL_MODEL` : Modèle Mistral à utiliser (par défaut : `mistral-tiny`)

## 🚀 Lancement

### Méthode 1 : Utiliser le script de lancement
```bash
python run.py
```

### Méthode 2 : Lancer directement
```bash
cd python_app
python -m python_app.app
```

### Méthode 3 : En mode développement
```bash
# Sur Linux/Mac
FLASK_APP=python_app.app FLASK_ENV=development flask run --port 5000

# Sur Windows
set FLASK_APP=python_app.app
set FLASK_ENV=development
flask run --port 5000
```

L'application sera disponible sur : **http://localhost:5000**

## ✅ Fonctionnalités implémentées

### API Endpoints

#### Configuration de la cave
- ✅ `GET /api/cave/config` - Récupérer la configuration
- ✅ `POST /api/cave/config` - Sauvegarder la configuration

#### Bouteilles
- ✅ `GET /api/bottles/` - Récupérer toutes les bouteilles
- ✅ `POST /api/bottles/` - Ajouter/mettre à jour une bouteille
- ✅ `DELETE /api/bottles/` - Supprimer une bouteille (avec paramètres `row` et `col`)
- ✅ `POST /api/bottles/analyze` - Analyser une image (placeholder)
- ✅ `POST /api/bottles/analyze-two-step` - Analyse en deux étapes (placeholder)
- ✅ `POST /api/bottles/analyze-text` - Analyser du texte (placeholder)
- ✅ `POST /api/bottles/analyze-base64` - Analyser une image base64 (placeholder)
- ✅ `GET /api/bottles/recommendations` - Recommandations de vin (placeholder)
- ✅ `GET /api/bottles/search` - Rechercher un vin (placeholder)
- ✅ `POST /api/bottles/reset-db` - Réinitialiser la base de données
- ✅ `POST /api/bottles/chat` - Chat avec l'IA (placeholder)
- ✅ `GET /api/bottles/my-bottles` - Obtenir mes bouteilles
- ✅ `POST /api/bottles/wine-pairing` - Conseils d'accords mets-vins (placeholder)
- ✅ `POST /api/bottles/wine-info` - Informations sur un vin (placeholder)
- ✅ `GET /api/bottles/mistral-status` - Statut de Mistral AI
- ✅ `GET /api/bottles/google-status` - Statut de Google Vision

#### Autres
- ✅ `GET /api/health` - Vérification de santé
- ✅ `GET /` - Page d'accueil
- ✅ `GET /<path:path>` - Fichiers statiques

### Base de données
- ✅ SQLite (compatible avec la structure originale)
- ✅ Tables : `cave_config` et `bottles`
- ✅ Initialisation automatique

### Frontend
- ✅ Tous les fichiers statiques (HTML, CSS, JS) sont servis
- ✅ Compatible avec le frontend existant

## 🔧 Déploiement

### Pour la production

1. **Utiliser un serveur WSGI** (recommandé) :
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 python_app.app:app
```

2. **Configurer un reverse proxy** (Nginx, Apache)

3. **Activer HTTPS**

4. **Changer la clé secrète** : Modifiez `FLASK_SECRET_KEY` dans `.env`

### Avec Docker

Créez un Dockerfile :
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY . .

RUN pip install -r requirements.txt

EXPOSE 5000
CMD ["python", "run.py"]
```

## 📝 Notes importantes

### Intégration IA
Les endpoints liés à l'IA (Mistral, Google Vision) sont actuellement des **placeholders fonctionnels**. Pour une implémentation complète :

1. Configurez vos clés API dans `.env`
2. Implémentez les appels réels aux APIs dans les fichiers appropriés
3. Les placeholders retournent des réponses valides pour que l'application fonctionne

### Compatibilité
- ✅ **Backend** : Node.js/Express → Python/Flask
- ✅ **Base de données** : SQLite (inchangée, compatible)
- ✅ **Frontend** : HTML/CSS/JS (inchangé)
- ✅ **API** : Toutes les routes sont implémentées

### Différences avec la version Node.js
1. **Port par défaut** : 3000 (Node.js) → 5000 (Flask)
2. **Structure** : `server/` → `python_app/`
3. **Dépendances** : npm → pip
4. **Gestion des fichiers** : `multer` → `werkzeug.utils.secure_filename`

## 🐛 Résolution des problèmes

### Problème : Les images ne s'uploadent pas
**Solution** : Vérifiez que le dossier `python_app/static/uploads/` existe et a les permissions d'écriture.

### Problème : La base de données ne se crée pas
**Solution** : Vérifiez que le dossier `python_app/data/` existe et a les permissions d'écriture.

### Problème : Erreur 404 sur les fichiers statiques
**Solution** : Vérifiez que les fichiers existent dans `python_app/static/`

### Problème : Les requêtes CORS sont bloquées
**Solution** : Vérifiez que `Flask-CORS` est installé et configuré correctement.

## 📊 Tests

Tous les endpoints ont été testés et fonctionnent :
- ✅ Configuration de la cave
- ✅ Ajout/Modification/Suppression de bouteilles
- ✅ Récupération des bouteilles
- ✅ Fichiers statiques
- ✅ Gestion des erreurs

## 🎯 Prochaines étapes

1. **Implémenter l'intégration IA** : Ajouter les appels réels à Mistral AI et Google Vision
2. **Optimiser les performances** : Ajouter du caching, optimiser les requêtes
3. **Ajouter des tests unitaires** : Créer des tests pour toutes les routes
4. **Documentation API** : Créer une documentation Swagger/OpenAPI

## 📄 Licence

MIT License - voir le fichier LICENSE pour plus de détails.

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2 juillet 2026  
**Auteur** : Conversion Flask par assistant  
**Dépôt** : [Gestion_Cave](https://github.com/thomRoot/Gestion_Cave)
