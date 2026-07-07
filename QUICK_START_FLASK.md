# Quick Start - Serveur Flask

## 🚀 Démarrage rapide

### 1. Installer les dépendances

```bash
cd Gestion_Cave
pip install -r requirements.txt
```

### 2. Configurer les clés API (optionnel mais recommandé)

```bash
cp .env.example .env
# Éditer .env et ajouter vos clés
nano .env
```

Ajoutez vos clés :
```
MISTRAL_API_KEY=votre_clé_mistral
GOOGLE_VISION_API_KEY=votre_clé_google_vision
```

> ⚠️ **Note** : Le serveur fonctionne sans ces clés, mais l'IA et l'OCR ne seront pas disponibles.

### 3. Démarrer le serveur

#### Option A : Avec le script Python
```bash
python run_flask.py
```

#### Option B : Directement
```bash
cd server_flask
python app.py
```

#### Option C : Avec le script bash
```bash
chmod +x start_flask.sh
./start_flask.sh
```

Le serveur démarrera sur [http://localhost:3000](http://localhost:3000)

### 4. Ouvrir l'application

Ouvrez votre navigateur et allez sur :
👉 [http://localhost:3000](http://localhost:3000)

## 📋 Vérification

Pour vérifier que tout fonctionne :

```bash
python test_flask_server.py
```

Si tous les tests passent (✅), votre serveur est prêt !

## 🎯 Fonctionnalités disponibles

### Sans clés API
- ✅ Gestion de la cave (configuration, ajout, suppression de bouteilles)
- ✅ Interface utilisateur complète
- ✅ Recherche locale dans la cave
- ✅ Affichage des bouteilles

### Avec MISTRAL_API_KEY
- ✅ Analyse intelligente des étiquettes (si Google Vision aussi configuré)
- ✅ Chat IA avec conseils personnalisés
- ✅ Recommandations de vin
- ✅ Accords mets-vins

### Avec GOOGLE_VISION_API_KEY
- ✅ Reconnaissance OCR des étiquettes
- ✅ Extraction automatique du texte des images

## 🔧 Dépannage

### "Module not found"
```bash
pip install -r requirements.txt
```

### "Port already in use"
```bash
# Changer de port
PORT=5000 python run_flask.py
```

### "Database not found"
```bash
mkdir -p data
chmod 755 data
```

### "No such file or directory: .env"
```bash
cp .env.example .env
```

## 📁 Structure du projet

```
Gestion_Cave/
├── server_flask/          # Serveur Flask
│   ├── app.py             # Application principale
│   ├── config.py          # Configuration
│   ├── database.py        # Base de données
│   ├── mistral_ai.py      # IA Mistral
│   ├── mistral_analyzer.py # Analyseur
│   └── google_vision.py   # OCR Google
│
├── public/                # Frontend
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── ...
│
├── requirements.txt        # Dépendances Python
├── run_flask.py           # Script de démarrage
├── .env.example            # Modèle de configuration
└── README.md               # Documentation
```

## 🌐 Accès à l'API

Toutes les routes API sont disponibles sur `http://localhost:3000/api/`

Exemples :
- `GET /api/bottles` - Liste des bouteilles
- `POST /api/bottles` - Ajouter une bouteille
- `GET /api/cave/config` - Configuration de la cave
- `POST /api/bottles/chat` - Poser une question au chat

## 💡 Conseils

1. **Pour le développement** : Utilisez `debug=True` dans `app.py`
2. **Pour la production** : Utilisez Gunicorn ou uWSGI
3. **Pour les tests** : Exécutez `python test_flask_server.py`

## 🎉 C'est parti !

Votre application Ma Cave à Vin est maintenant prête avec Flask !

Ouvrez [http://localhost:3000](http://localhost:3000) et commencez à gérer votre cave à vin intelligemment.
