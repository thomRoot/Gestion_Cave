# Ma Cave à Vin - Application de Gestion Intelligente

**Version Actuelle : 4.0.1** 🍷

Une application web moderne pour gérer votre cave à vin avec **Mistral AI** intégrée, optimisée pour mobile et tablette.

## 🎯 Fonctionnalités Principales

### ✨ Version 4.0.1 - Mistral AI Exclusif
- **Analyse 100% Mistral AI** : Plus d'OCR local, uniquement Mistral pour une reconnaissance parfaite
- **Chat IA conversationnel** : Posez n'importe quelle question sur le vin comme avec Mistral Chat
- **Tous les champs remplis** : Nom, année, cépage, région, drinkFrom, drinkTo, foodPairing, temperature
- **Calculs dynamiques** : Périodes de consommation basées sur le type de vin et le millésime
- **Conseils personnalisés** : Accords mets-vins, températures, périodes de garde, etc.
- **Indicateur de statut** : Visualisation de la connexion Mistral AI
- **Historique des conversations** : Gardez une trace de vos échanges
- **Suggestions intelligentes** : Boutons de suggestions pour vous inspirer

### 🤖 Intelligence Artificielle (Mistral AI)
L'application utilise **exclusivement Mistral AI** pour :

1. **Analyse d'images** : Reconnaissance intelligente des étiquettes de vin
2. **Chat conversationnel** : Réponses naturelles et contextuelles
3. **Conseils experts** : Basés sur une connaissance approfondie du vin
4. **Calculs dynamiques** : Périodes de consommation adaptées à chaque vin

### 📊 Base de Connaissances
Mistral AI connaît :
- **Tous les cépages** : Cabernet Sauvignon, Merlot, Pinot Noir, Chardonnay, Syrah, etc.
- **Toutes les régions** : Bordeaux, Bourgogne, Champagne, Loire, Alsace, Rhône, Espagne, Italie, etc.
- **Les appellations** : AOC, IGP, DOC, Grand Cru, Premier Cru, etc.
- **Les accords mets-vins** : Pour chaque type de vin et de plat
- **Les températures** : Adaptées à chaque cépage
- **Les périodes de garde** : Calculées dynamiquement

## 📱 Optimisation Mobile

- Grille de cave adaptative selon la taille de l'écran
- Bouton flottant pour ajouter une bouteille sur mobile
- Taille des cellules ajustée pour les petits écrans
- Navigation tactile optimisée (appui court/long)
- Design épuré et intuitif

## 🚀 Installation

### Prérequis
- Node.js 16+
- npm ou yarn
- Un navigateur moderne (Chrome, Firefox, Safari, Edge)
- **Clé API Mistral** (pour activer l'IA)

### Étapes d'installation

1. Cloner le dépôt :
```bash
git clone https://github.com/thomRoot/Gestion_Cave.git
cd Gestion_Cave
```

2. Installer les dépendances :
```bash
npm install
```

3. Créer le fichier `.env` :
```bash
cp .env.example .env
```

4. Configurer votre clé API Mistral dans `.env` :
```
MISTRAL_API_KEY=votre_clé_api_mistral
```

5. Démarrer le serveur :
```bash
npm start
```

6. Ouvrir l'application dans votre navigateur :
```
http://localhost:3000
```

## 📂 Structure du Projet

```
gestion_cave/
├── public/                  # Fichiers statiques
│   ├── index.html          # Page principale
│   ├── style.css           # Styles modernes et responsive
│   ├── script.js           # Logique principale
│   ├── camera.js           # Gestion des photos
│   ├── cave.js             # Gestion de la grille de la cave
│   └── uploads/            # Dossier pour les photos uploadées
├── server/                 # Backend Node.js
│   ├── app.js              # Configuration Express
│   ├── mistralAnalyzer.js  # Analyse avec Mistral AI (UNIQUEMENT)
│   ├── mistralAI.js        # Appels API Mistral
│   ├── mistralConfig.js    # Configuration Mistral
│   ├── database.js         # Gestion SQLite
│   └── routes/             # Routes API
│       ├── bottles.js      # Routes pour les bouteilles
│       └── cave.js         # Routes pour la configuration
├── VERSION.md              # Historique des versions
├── MISTRAL_SETUP.md        # Guide de configuration Mistral
├── ENV_GUIDE.md            # Guide pour le fichier .env
├── package.json            # Dépendances
└── README.md               # Documentation
```

## 💬 Utilisation du Chat IA

### Comment ouvrir le chat
1. Cliquez sur le bouton **"Chat IA"** dans le header (en haut à droite)
2. Une popup s'ouvre avec l'interface de chat
3. Posez votre question dans le champ de texte

### Exemples de questions
Vous pouvez demander **n'importe quoi** sur le vin :

**Accords mets-vins** :
- "Quel vin rouge avec un boeuf bourguignon ?"
- "Que servir avec un plateau de fromages ?"
- "Quel vin blanc avec des huîtres ?"

**Températures** :
- "À quelle température servir un Bordeaux 2018 ?"
- "Comment conserver un vin blanc ?"

**Conseils** :
- "Quel vin offrir pour un dîner romantique ?"
- "Quels sont les meilleurs cépages pour vieillir 10 ans ?"
- "Peux-tu m'expliquer la différence entre AOC et IGP ?"

**Analyse** :
- "Peux-tu analyser cette étiquette de vin ?" (après avoir upload une photo)
- "C'est quoi ce vin ?"

### Fonctionnalités du chat
- ✅ **Réponses en temps réel** avec Mistral AI
- ✅ **Historique de conversation** pour suivre l'échange
- ✅ **Suggestions de questions** pour vous inspirer
- ✅ **Indicateur de saisie** (typing...) pour une meilleure UX
- ✅ **Formatage riche** : gras, italique, listes
- ✅ **Gestion des erreurs** claire

## 📸 Fonctionnement de la Reconnaissance Photo

1. **Prise de photo** : Utilise l'API MediaDevices pour accéder à la caméra
2. **Téléchargement** : Accès à la galerie via `<input type="file" capture="environment">`
3. **Analyse Mistral AI** : L'image est envoyée à Mistral pour analyse complète
4. **Remplissage automatique** : Tous les 8 champs du formulaire sont remplis intelligemment

### Support Mobile
- `capture="environment"` : Force l'ouverture de la caméra arrière sur mobile
- `facingMode: 'environment'` : Privilégie la caméra arrière
- Gestion des permissions avec messages d'erreur clairs

## 🔌 API Endpoints

### Cave
- `GET /api/cave/config` - Récupérer la configuration
- `POST /api/cave/config` - Sauvegarder la configuration

### Bouteilles
- `GET /api/bottles` - Lister toutes les bouteilles
- `POST /api/bottles` - Ajouter/mettre à jour une bouteille
- `DELETE /api/bottles?row=X&col=Y` - Supprimer une bouteille
- `POST /api/bottles/analyze` - Analyser une image avec Mistral AI
- `POST /api/bottles/analyze-base64` - Analyser une image en base64
- `GET /api/bottles/recommendations` - Obtenir des recommandations
- `GET /api/bottles/search?name=X` - Rechercher un vin par nom
- `GET /api/bottles/mistral-status` - Vérifier le statut de Mistral AI

### Chat
- `POST /api/bottles/chat` - Envoyer un message au chat Mistral

## 💡 Utilisation

### Ajouter une bouteille
1. Cliquez sur une cellule vide ou sur le bouton "+"
2. Prenez une photo ou téléchargez une image
3. Cliquez sur "Analyser avec IA" pour remplir automatiquement les champs
4. Complétez manuellement si nécessaire
5. Enregistrez

### Modifier une bouteille
1. Cliquez sur une bouteille existante
2. Visualisez les détails
3. Cliquez sur "Modifier"
4. Apportes vos modifications
5. Enregistrez

**Note** : Les images sont préservées lors de l'édition

### Rechercher
- Utilisez la barre de recherche pour trouver des bouteilles par nom, année, cépage, région ou accords
- Les bouteilles correspondantes seront surlignées en vert

### Chat IA
- Cliquez sur le bouton "Chat IA" pour discuter avec l'assistant
- Posez des questions sur le vin, les accords, la conservation, etc.

## 🌐 Compatibilité Navigateurs

| Navigateur | Support Caméra | Support Mistral AI | Recommandé |
|------------|----------------|---------------------|------------|
| Chrome | ✅ Oui | ✅ Oui | ✅ Oui |
| Firefox | ✅ Oui | ✅ Oui | ✅ Oui |
| Safari | ✅ Oui | ✅ Oui | ✅ Oui |
| Edge | ✅ Oui | ✅ Oui | ✅ Oui |
| Mobile Chrome | ✅ Oui* | ✅ Oui | ✅ Oui |
| Mobile Firefox | ✅ Oui* | ✅ Oui | ✅ Oui |
| Mobile Safari | ⚠️ Partiel | ✅ Oui | ❌ Non |

*✅ Sur mobile, la caméra fonctionne **uniquement en HTTPS** ou en **local (localhost)***

---

## ⚠️ Problèmes de Caméra sur Mobile ?

### **Pourquoi ça ne marche pas ?**
Sur mobile, les navigateurs **bloquent l'accès à la caméra** dans certains cas :

1. **Connexion non sécurisée (HTTP)**
   - ❌ La caméra est **bloquée** sur HTTP
   - ✅ **Solution** : Utilisez **HTTPS** ou testez en **local (localhost)**

2. **Permissions non accordées**
   - Le navigateur demande l'autorisation → **Acceptez**
   - Sur Android : Vérifiez les permissions dans **Paramètres → Applications → [Votre navigateur] → Autorisations → Caméra**

3. **Navigateur non supporté**
   - ❌ Safari mobile a des restrictions
   - ✅ **Solution** : Utilisez **Chrome** ou **Firefox** sur mobile

4. **Appareil sans caméra**
   - Certains tablettes/anciens téléphones n'ont pas de caméra
   - ✅ **Solution** : Utilisez le bouton **"Galerie"** pour télécharger une photo

### **Solutions pour tester sur mobile**

#### **Option 1 : Tester en local (recommandé)**
1. Lancez le serveur sur votre PC : `npm start`
2. Sur votre mobile, connectez-vous à : `http://[ADRESSE_IP_PC]:3000`
   - Exemple : `http://192.168.1.42:3000`
3. **La caméra fonctionnera** car c'est en local

#### **Option 2 : Utiliser HTTPS**
- Déployez l'application sur un hébergement avec **HTTPS** (ex: Heroku, Vercel, Netlify)
- Ou utilisez **ngrok** pour exposer votre local en HTTPS :
  ```bash
  npm install -g ngrok
  ngrok http 3000
  ```
  → Ouvrez l'URL `https://xxxx.ngrok.io` sur votre mobile

#### **Option 3 : Utiliser la galerie**
- Si la caméra ne fonctionne pas, cliquez sur **"Galerie"** pour sélectionner une photo existante
- Le bouton **"Analyser avec IA"** fonctionnera de la même manière

---

## 🎨 Design et UX

### Palette de Couleurs
- **Rouge vin** (#8B0000) - Couleur principale
- **Or** (#D4AF37) - Couleur secondaire (accents)
- **Noir profond** (#121212) - Arrière-plan
- **Gris foncé** (#1E1E1E) - Surfaces
- **Vert** (#4CAF50) - Actions positives
- **Rouge** (#F44336) - Actions dangereuses

### Polices
- **Playfair Display** - Titres (élégant, serif)
- **Roboto** - Texte principal (moderne, lisible)

### Animations
- Transitions fluides
- Effets de hover
- Animations de popup
- Scroll personnalisé

---

## 🔧 Configuration

### Configuration de la Cave
- Nombre de rangées : 1-20
- Nombre de colonnes : 1-20
- Configurable via la popup de première utilisation

### Stockage
- Base de données SQLite (`data/cave.db`)
- Photos stockées dans `public/uploads/`

## 📊 Performances

- **Analyse Mistral AI** : ~3-10 secondes par image (selon la taille et la qualité)
- **Chat IA** : Réponses en temps réel
- **Chargement** : Optimisé pour mobile (lazy loading des images)

## 🛠️ Développement

### Scripts disponibles
- `npm start` - Démarrer le serveur en production
- `npm run dev` - Démarrer avec nodemon (développement)

### Technologies utilisées
- **Frontend** : HTML5, CSS3, JavaScript (ES6+)
- **Backend** : Node.js, Express
- **Base de données** : SQLite3
- **IA** : Mistral AI API
- **UI Icons** : Font Awesome 6
- **Polices** : Google Fonts (Playfair Display, Roboto)

## 📝 Changelog

### Version 4.0.1
- ✅ Correction de l'erreur `extractBasicInfoFromText is not defined`
- ✅ Correction de l'import manquant dans app.js
- ✅ Suppression définitive de toutes les références à l'OCR local

### Version 4.0.0
- ✅ **Chat IA complet** : Interface de chat conversationnel
- ✅ **Analyse Mistral AI uniquement** : Suppression complète de l'OCR local
- ✅ **Tous les champs remplis** : 8 champs dynamiquement calculés
- ✅ **Calculs dynamiques** : Périodes de consommation basées sur le vin
- ✅ **Indicateur de statut** : Visualisation de la connexion Mistral

### Version 3.0.0
- ✅ Suppression complète de l'OCR local (Tesseract.js)
- ✅ Utilisation exclusive de Mistral AI pour l'analyse des images
- ✅ Fin des dates fixes (2026-2031) - calcul dynamique
- ✅ Suppression de la dépendance tesseract.js

### Version 2.0.0
- ✨ Nouveau design moderne et responsive
- 🤖 Intégration Mistral AI
- 📱 Optimisation mobile complète
- 🎨 Amélioration esthétique

### Version 1.0.0
- Version initiale avec Google Vision API
- Gestion basique de la cave
- Fonctionnalités CRUD pour les bouteilles

## 🤝 Contribution

Les contributions sont les bienvenues ! Ouvrez une issue ou soumettez une pull request.

## 📄 Licence

MIT License - Libre d'utilisation, modification et distribution.

---

**Créé avec ❤️ pour les amateurs de vin**

*Ma Cave à Vin - Votre cave, intelligente et connectée avec Mistral AI*
