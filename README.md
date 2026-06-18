# Ma Cave à Vin - Application de Gestion Intelligente

Une application web moderne pour gérer votre cave à vin avec reconnaissance IA intégrée, optimisée pour mobile et tablette.

## 🎯 Fonctionnalités Principales

### ✨ Nouvelle Version 2.0
- **Design responsive** optimisé pour mobile, tablette et desktop
- **Reconnaissance IA locale** (remplace Google Vision) pour analyser les étiquettes de vin
- **Bouton "Aide IA"** avec assistant conversationnel intégré
- **Remplissage automatique** des champs (nom, année, cépage, région, période optimale, accords mets-vins, température)
- **Arrière-plan élégant** avec effets visuels modernes
- **Boutons de photo fonctionnels** avec accès à l'appareil photo et à la galerie

## 📱 Optimisation Mobile

- Grille de cave adaptative selon la taille de l'écran
- Bouton flottant pour ajouter une bouteille sur mobile
- Taille des cellules ajustée pour les petits écrans
- Navigation tactile optimisée (appui court/long)
- Design épuré et intuitif

## 🤖 Intelligence Artificielle

L'application utilise désormais une **IA locale** pour :

1. **Reconnaissance d'images** : Extraction du texte des étiquettes via OCR (Tesseract.js)
2. **Analyse sémantique** : Identification automatique du nom, année, cépage, région
3. **Base de connaissances** : Plus de 20 cépages et 30 régions françaises référencés
4. **Recommandations** : 
   - Période optimale de consommation (basée sur le cépage et le millésime)
   - Accords mets-vins personnalisés
   - Température de service idéale

### Base de Données des Vins
L'IA connaît :
- **Cépages** : Cabernet Sauvignon, Merlot, Pinot Noir, Chardonnay, etc.
- **Régions** : Bordeaux, Bourgogne, Champagne, Loire, Alsace, Rhône, etc.
- **Appellations** : AOC, IGP, Grand Cru, Premier Cru, etc.
- **Accords mets-vins** : Pour chaque cépage, des suggestions d'accords
- **Températures** : Températures de service optimales
- **Potentiel de garde** : Durée de conservation estimée

## 🚀 Installation

### Prérequis
- Node.js 16+ 
- npm ou yarn
- Un navigateur moderne (Chrome, Firefox, Safari, Edge)

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

4. Démarrer le serveur :
```bash
npm start
```

5. Ouvrir l'application dans votre navigateur :
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
│   ├── camera.js           # Gestion de la caméra et des photos
│   ├── cave.js             # Gestion de la grille de la cave
│   └── uploads/            # Dossier pour les photos uploadées
├── server/                 # Backend Node.js
│   ├── app.js              # Configuration Express
│   ├── ai.js               # Intelligence Artificielle locale
│   ├── database.js         # Gestion SQLite
│   └── routes/             # Routes API
│       ├── bottles.js      # Routes pour les bouteilles
│       └── cave.js         # Routes pour la configuration
├── package.json            # Dépendances
└── README.md               # Documentation
```

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

## 📸 Fonctionnement de la Reconnaissance Photo

1. **Prise de photo** : Utilise l'API MediaDevices pour accéder à la caméra
2. **Téléchargement** : Accès à la galerie via `<input type="file" capture="environment">`
3. **OCR** : Tesseract.js extrait le texte de l'image
4. **Analyse** : L'IA identifie les informations du vin dans le texte
5. **Remplissage** : Les champs du formulaire sont remplis automatiquement

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
- `POST /api/bottles/analyze` - Analyser une image avec l'IA
- `GET /api/bottles/recommendations` - Obtenir des recommandations
- `GET /api/bottles/search?name=X` - Rechercher un vin par nom

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

### Rechercher
- Utilisez la barre de recherche pour trouver des bouteilles par nom, année, cépage, région ou accords
- Les bouteilles correspondantes seront surlignées en vert

### Aide IA
- Cliquez sur le bouton "Aide IA" pour discuter avec l'assistant
- Posez des questions sur le vin, les accords, la conservation, etc.

## 🌐 Compatibilité Navigateurs

| Navigateur | Support Caméra | Support OCR | Recommandé |
|------------|----------------|-------------|------------|
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

## 🔧 Configuration

### Configuration de la Cave
- Nombre de rangées : 1-20
- Nombre de colonnes : 1-20
- Configurable via la popup de première utilisation

### Stockage
- Base de données SQLite (`data/cave.db`)
- Photos stockées dans `public/uploads/`

## 📊 Performances

- **OCR** : ~2-5 secondes par image (selon la taille et la qualité)
- **Analyse IA** : Instantanée (base de connaissances locale)
- **Chargement** : Optimisé pour mobile (lazy loading des images)

## 🛠️ Développement

### Scripts disponibles
- `npm start` - Démarrer le serveur en production
- `npm run dev` - Démarrer avec nodemon (développement)

### Technologies utilisées
- **Frontend** : HTML5, CSS3, JavaScript (ES6+)
- **Backend** : Node.js, Express
- **Base de données** : SQLite3
- **IA/OCR** : Tesseract.js
- **UI Icons** : Font Awesome 6
- **Polices** : Google Fonts (Playfair Display, Roboto)

## 📝 Changelog

### Version 2.0.0
- ✨ **Nouveau design moderne et responsive**
- 🤖 **Intégration IA locale** (remplace Google Vision)
- 📱 **Optimisation mobile complète**
- 🎨 **Amélioration esthétique** (arrière-plan, couleurs, polices)
- 💬 **Assistant IA conversationnel**
- 📸 **Correction des boutons de photo** (accès caméra/galerie)
- 🔄 **Remplissage automatique des champs** via IA

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

*Ma Cave à Vin - Votre cave, intelligente et connectée*
