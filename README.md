# Ma Cave à Vin v5.0.0

Application de gestion de cave à vin intelligente avec reconnaissance d'étiquettes par IA.

## 🚀 Fonctionnalités

- **Reconnaissance d'étiquettes de vin** : Analyse automatique des bouteilles via photo (OCR + IA)
- **Gestion de cave virtuelle** : Organisation visuelle de votre collection
- **Chat IA** : Conseiller en vin intégré pour les accords mets-vins et conseils
- **Analyse intelligente** : Extraction automatique des informations (nom, année, cépage, région, etc.)
- **Optimisé mobile** : Interface responsive pour téléphone et tablette
- **Suivi de maturation** : Indicateurs visuels pour la période optimale de consommation

## 📱 Optimisation Mobile

- Design responsive adapté à tous les écrans
- Feedback tactile amélioré
- Navigation intuitive sur mobile
- Boutons et formulaires optimisés pour le touch
- Prévention du zoom accidentel

## 🔧 Configuration

### Prérequis

- Node.js 14+ 
- npm ou yarn
- SQLite (inclus avec Node.js)

### Clés API nécessaires

1. **Mistral AI** (obligatoire pour l'IA)
   - Obtenez votre clé sur : [https://console.mistral.ai/api-keys/](https://console.mistral.ai/api-keys/)
   - Modèle recommandé : `mistral-tiny` (gratuit)

2. **Google Vision API** (recommandé pour l'OCR)
   - Obtenez votre clé sur : [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
   - Gratuit jusqu'à 1000 requêtes/mois

### Installation

```bash
# Cloner le dépôt
git clone https://github.com/thomRoot/Gestion_Cave.git
cd Gestion_Cave

# Installer les dépendances
npm install

# Créer le fichier .env
cp .env.example .env
# Éditer .env et ajouter vos clés API

# Démarrer l'application
npm start
```

### Configuration du .env

```env
# Clé API Mistral (obligatoire)
MISTRAL_API_KEY=votre_clé_api_mistral

# Modèle Mistral (optionnel)
MISTRAL_MODEL=mistral-tiny

# Clé API Google Vision (recommandée)
GOOGLE_VISION_API_KEY=votre_clé_api_google_vision
```

## 🌐 Utilisation

1. **Configurer votre cave** : Au premier lancement, définissez le nombre de rangées et colonnes
2. **Ajouter une bouteille** : 
   - Cliquez sur une cellule vide
   - Sélectionnez une photo de l'étiquette
   - Cliquez sur "Analyser avec IA" pour extraction automatique
   - Ou remplissez manuellement les informations
3. **Consulter les détails** : Cliquez sur une bouteille pour voir ses informations
4. **Rechercher** : Utilisez la barre de recherche pour filtrer vos bouteilles
5. **Chat IA** : Posez des questions sur les vins, accords mets-vins, etc.

## 📁 Structure du projet

```
Gestion_Cave/
├── public/                  # Frontend
│   ├── index.html           # Page principale
│   ├── style.css            # Styles (optimisé mobile)
│   ├── script.js            # Logique frontend
│   ├── cave.js              # Gestion de la grille
│   ├── camera.js            # Gestion des images
│   └── uploads/             # Images uploadées
├── server/                  # Backend
│   ├── app.js               # Serveur Express
│   ├── database.js          # Base de données SQLite
│   ├── mistralConfig.js     # Configuration Mistral
│   ├── mistralAI.js         # Intégration API Mistral
│   ├── mistralAnalyzer.js   # Analyse des bouteilles
│   ├── googleVision.js      # Intégration Google Vision OCR
│   └── routes/              # Routes API
│       ├── bottles.js       # Routes bouteilles
│       └── cave.js          # Routes cave
├── package.json
├── .env.example
└── README.md
```

## 🎯 Améliorations v5.0.0

### ✅ Corrections majeures
- **VRAIE analyse IA** : Intégration de Google Vision OCR + Mistral pour une reconnaissance précise des étiquettes
- **Fin des réponses génériques** : Chaque bouteille est analysée individuellement avec son image
- **Chat IA amélioré** : Requêtes réelles vers Mistral avec meilleur parsing des réponses

### ✅ Optimisations mobile
- Grille responsive adaptée aux petits écrans
- Boutons et formulaires optimisés pour le touch
- Feedback tactile amélioré
- Prévention du zoom accidentel
- Scroll fluide sur iOS

### ✅ Nouvelles fonctionnalités
- Extraction de texte des étiquettes via Google Vision
- Analyse combinée OCR + LLM pour une précision maximale
- Messages d'erreur plus informatifs
- Indicateurs de statut API améliorés

## 🐛 Résolution des problèmes

### L'analyse IA retourne toujours les mêmes informations
**Cause** : L'image n'était pas envoyée à l'API Mistral.
**Solution** : Intégration de Google Vision pour OCR + Mistral pour interprétation.

### Le chat IA ne fonctionne pas
**Cause** : Problème de parsing JSON des réponses Mistral.
**Solution** : Parsing robuste avec gestion des marqueurs markdown et extraction JSON.

### Problèmes d'affichage sur mobile
**Cause** : CSS non optimisé pour les petits écrans.
**Solution** : Media queries améliorées, feedback tactile, prévention du zoom.

## 📊 Technologies utilisées

- **Frontend** : HTML5, CSS3, JavaScript (ES6+)
- **Backend** : Node.js, Express
- **Base de données** : SQLite3
- **IA** : Mistral AI (LLM), Google Vision (OCR)
- **UI** : Font Awesome, Google Fonts

## 🤝 Contribution

Les contributions sont les bienvenues ! Ouvrez une issue ou soumettez une pull request.

## 📄 Licence

MIT

---

**Version** : 5.0.0  
**Dernière mise à jour** : 2024  
**Auteur** : thomRoot
