# Ma Cave à Vin v6.0.3

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

## Corrections v6.0.3

### Problèmes corrigés
- **Correction critique** : Erreur de syntaxe dans la regex pour le traitement des images base64 (`bottles.js:92`).
- **Correction majeure** : La photo ne disparaît plus lors de la modification d'une bouteille (`public/script.js`).
- **Correction majeure** : Les informations du vin sont maintenant complètes après reconnaissance photo (`server/mistralAnalyzer.js`).
- **Amélioration** : Meilleure gestion des data URLs dans `googleVision.js` pour une extraction plus robuste du texte base64.
- **Optimisation** : `mistralAnalyzer.js` permet désormais une analyse avec Mistral AI **même si Google Vision n'est pas configuré** (sans OCR).
- Les valeurs par défaut génériques ont été supprimées.
- Chaque bouteille est analysée individuellement avec son image.
- Le chat IA fait de vraies requêtes vers Mistral.
- Meilleure gestion des erreurs avec messages clairs.

### Corrections techniques détaillées
1. **`public/script.js`** :
   - Correction de la disparition de la photo lors de la modification d'une bouteille.
   - `currentEditingBottlePhoto` est maintenant toujours conservé jusqu'à la sauvegarde.

2. **`server/mistralAnalyzer.js`** :
   - Prompt Mistral ultra-précis pour forcer le remplissage de **tous les champs** (nom, année, cépage, région, etc.).
   - Analyse alternative avec Mistral si Google Vision échoue ou n'est pas configuré.
   - Nettoyage et validation des données retournées.

3. **`server/routes/bottles.js`** :
   - Correction de la regex `/^data:image\/\w+;base64,/` pour éviter l'erreur `SyntaxError: Invalid regular expression flags`.

4. **`server/googleVision.js`** :
   - Amélioration de l'extraction des données base64 depuis les data URLs avec une regex plus robuste.

5. **`public/style.css`** :
   - Design **épuré et moderne** inspiré des meilleures applications mobiles (Vivino, Delectable).
   - Adapté aux tablettes Android avec des boutons tactiles et des polices lisibles.
   - Palette de couleurs moderne (rouge vin + or).

### Améliorations mobile
- Grille responsive adaptée aux petits écrans.
- Boutons et formulaires optimisés pour le touch.
- Feedback tactile amélioré.
- Prévention du zoom accidentel.
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

Version : 6.0.3  
Dernière mise à jour : 20 juin 2026  
Auteur : thomRoot