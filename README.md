# Ma Cave à Vin v6.0.0

Application de gestion de cave à vin intelligente avec reconnaissance d'étiquettes par IA.

## Fonctionnalités

- Reconnaissance d'étiquettes de vin : Analyse automatique des bouteilles via photo (OCR + IA)
- Gestion de cave virtuelle : Organisation visuelle de votre collection
- Chat IA : Conseiller en vin intégré pour les accords mets-vins et conseils
- Analyse intelligente : Extraction automatique des informations (nom, année, cépage, région, etc.)
- Optimisé mobile : Interface responsive pour téléphone et tablette
- Suivi de maturation : Indicateurs visuels pour la période optimale de consommation

## Optimisation Mobile

- Design responsive adapté à tous les écrans
- Feedback tactile amélioré
- Navigation intuitive sur mobile
- Boutons et formulaires optimisés pour le touch
- Prévention du zoom accidentel

## Configuration

### Prérequis

- Node.js 14+
- npm ou yarn
- SQLite (inclus avec Node.js)

### Clés API nécessaires

1. Mistral AI (obligatoire pour l'IA)
   - Obtenez votre clé sur : https://console.mistral.ai/api-keys/
   - Modèle recommandé : mistral-tiny (gratuit)

2. Google Vision API (REQUIS pour l'analyse d'image)
   - Obtenez votre clé sur : https://console.cloud.google.com/apis/credentials
   - Gratuit jusqu'à 1000 requêtes/mois

### Installation

bash
git clone https://github.com/thomRoot/Gestion_Cave.git
cd Gestion_Cave
npm install
cp .env.example .env
# Éditer .env et ajouter vos clés API
npm start

### Configuration du .env

env
# Clé API Mistral (obligatoire)
MISTRAL_API_KEY=votre_clé_api_mistral

# Modèle Mistral (optionnel)
MISTRAL_MODEL=mistral-tiny

# Clé API Google Vision (REQUIS pour l'analyse d'image)
GOOGLE_VISION_API_KEY=votre_clé_api_google_vision

## Utilisation

1. Configurer votre cave : Au premier lancement, définissez le nombre de rangées et colonnes
2. Ajouter une bouteille :
   - Cliquez sur une cellule vide
   - Sélectionnez une photo de l'étiquette
   - Cliquez sur Analyser avec IA pour extraction automatique
   - Ou remplissez manuellement les informations
3. Consulter les détails : Cliquez sur une bouteille pour voir ses informations
4. Rechercher : Utilisez la barre de recherche pour filtrer vos bouteilles
5. Chat IA : Posez des questions sur les vins, accords mets-vins, etc.

## Structure du projet

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
│   ├── mistralAnalyzer.js   # Analyse des bouteilles (CORRIGÉ v6.0.0)
│   ├── googleVision.js      # Intégration Google Vision OCR
│   └── routes/              # Routes API
│       ├── bottles.js       # Routes bouteilles
│       └── cave.js          # Routes cave
├── package.json
├── .env.example
└── README.md

## Corrections v6.0.0

### Problèmes corrigés
- Les valeurs par défaut génériques ont été supprimées
- Google Vision est maintenant OBLIGATOIRE pour l'analyse d'image
- Chaque bouteille est analysée individuellement avec son image
- Le chat IA fait de vraies requêtes vers Mistral
- Meilleure gestion des erreurs avec messages clairs

### Améliorations mobile
- Grille responsive adaptée aux petits écrans
- Boutons et formulaires optimisés pour le touch
- Feedback tactile amélioré
- Prévention du zoom accidentel

## Technologies utilisées

- Frontend : HTML5, CSS3, JavaScript (ES6+)
- Backend : Node.js, Express
- Base de données : SQLite3
- IA : Mistral AI (LLM), Google Vision (OCR)
- UI : Font Awesome, Google Fonts

## Contribution

Les contributions sont les bienvenues !

## Licence

MIT

---

Version : 6.0.0  
Dernière mise à jour : 19 juin 2026  
Auteur : thomRoot