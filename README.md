# Gestion Cave à Vin

Une application web locale pour gérer votre cave à vin, avec reconnaissance IA des bouteilles, suivi des périodes de consommation et accords mets-vins.

## 📌 Fonctionnalités

- **Grille personnalisable** : Configurez la taille de votre cave (rangées × colonnes).
- **Ajout de bouteilles** :
  - Prise de photo via webcam ou téléchargement d'image.
  - Reconnaissance automatique des étiquettes (via Google Vision API).
  - Saisie manuelle des informations (nom, année, cépage, etc.).
- **Popup d'informations** :
  - Photo de la bouteille.
  - Détails (nom, année, cépage, région, etc.).
  - Barre de progression pour la période optimale de consommation (bleu/vert/rouge).
  - Accords mets-vins.
- **Recherche intelligente** :
  - Filtrez les bouteilles par nom, année, cépage, région ou accord mets-vins.
  - Surlignage des bouteilles correspondantes dans la grille.
- **Base de données locale** : SQLite (fichier `cave.db`).

## 🚀 Installation

### 1. Cloner le dépôt
```bash
git clone https://github.com/thomRoot/Gestion_Cave.git
cd Gestion_Cave
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer l'API Google Vision (optionnel)
Pour la reconnaissance des étiquettes de vin :
1. Créez un projet sur [Google Cloud Console](https://console.cloud.google.com/).
2. Activez l'API **Google Vision API**.
3. Créez une clé API et remplacez `YOUR_GOOGLE_VISION_API_KEY` dans `server/ai.js`.

### 4. Démarrer le serveur
```bash
npm start
```
Le serveur démarrera sur `http://localhost:3000`.

## 📂 Structure du projet
```
Gestion_Cave/
├── public/                  # Frontend
│   ├── index.html           # Page principale
│   ├── style.css            # Styles
│   ├── script.js            # Logique frontend
│   ├── cave.js              # Gestion de la grille
│   ├── camera.js            # Prise de photo
│   └── assets/              # Images (icônes, bouteilles)
├── server/                  # Backend
│   ├── app.js               # Serveur Express
│   ├── database.js          # Base de données SQLite
│   ├── ai.js                # Intégration IA
│   └── routes/              # Routes API
│       ├── bottles.js       # Gestion des bouteilles
│       └── cave.js          # Gestion de la cave
├── data/                    # Base de données
│   └── cave.db              # Fichier SQLite
├── package.json
└── README.md
```

## 🌐 Déploiement sur NAS Synology

### 1. Installer Node.js sur votre NAS
1. Ouvrez le **Centre de paquets** sur votre NAS.
2. Recherchez **Node.js** et installez-le.

### 2. Copier l'application sur votre NAS
1. Copiez le dossier `Gestion_Cave` dans un dossier partagé sur votre NAS (ex: `web`).
2. Assurez-vous que le dossier `public/uploads` a les permissions d'écriture.

### 3. Démarrer l'application
1. Connectez-vous en SSH à votre NAS.
2. Naviguez vers le dossier de l'application :
   ```bash
   cd /volume1/web/Gestion_Cave
   ```
3. Installez les dépendances :
   ```bash
   npm install
   ```
4. Démarrez le serveur :
   ```bash
   npm start
   ```
   Pour exécuter en arrière-plan, utilisez `nohup` :
   ```bash
   nohup npm start &
   ```

### 4. Accéder à l'application
Ouvrez un navigateur et allez sur :
```
http://<IP_DU_NAS>:3000
```
(Remplacez `<IP_DU_NAS>` par l'IP locale de votre NAS.)

## 🔧 Configuration avancée

### Utiliser un reverse proxy (optionnel)
Pour accéder à l'application sans spécifier le port (ex: `http://<IP_DU_NAS>/cave`) :
1. Installez le package **Reverse Proxy** depuis le Centre de paquets.
2. Créez une nouvelle règle :
   - **Source** : `http://<IP_DU_NAS>/cave`
   - **Destination** : `http://localhost:3000`

### Utiliser une autre API pour la reconnaissance
Si vous ne souhaitez pas utiliser Google Vision, vous pouvez :
- Utiliser l'API **Vivino** (nécessite une clé API).
- Implémenter une reconnaissance locale avec **TensorFlow.js** (moins précise).

## 📝 Licence
MIT
