# Ma Cave à Vin v1.1

**Application de gestion de cave à vin intelligente avec reconnaissance d'étiquettes par IA**

---

## 📋 Table des matières
1. [Fonctionnalités](#-fonctionnalités)
2. [Nouveautés v1.1](#-nouveautés-v11)
3. [Optimisation Mobile & Tablette](#-optimisation-mobile--tablette)
4. [Configuration](#-configuration)
5. [Installation](#-installation)
6. [Utilisation](#-utilisation)
7. [Structure du projet](#-structure-du-projet)
8. [Historique des versions](#-historique-des-versions)
9. [Branches disponibles](#-branches-disponibles)
10. [Technologies utilisées](#-technologies-utilisées)
11. [Contribution](#-contribution)
12. [Licence](#-licence)

---

## 🚀 Fonctionnalités

### ✅ Fonctionnalités principales
- **Reconnaissance d'étiquettes de vin** : Analyse automatique des bouteilles via photo (OCR + IA)
- **Gestion de cave virtuelle** : Organisation visuelle de votre collection avec grille responsive
- **Chat IA intégré** : Conseiller en vin pour les accords mets-vins, températures de service, conseils de dégustation
- **Analyse intelligente** : Extraction automatique des informations (nom, année, cépage, région, appellation, producteur, pays, degré d'alcool, période de consommation, accords mets-vins, température de service)
- **Suivi de maturation** : Indicateurs visuels (⏳/✅/⚠️) pour la période optimale de consommation
- **Recherche avancée** : Filtrez vos bouteilles par nom, année, cépage, région, etc.

### ✅ Fonctionnalités techniques
- **Analyse sans OCR** : Fonctionne avec Mistral AI uniquement si Google Vision n'est pas configuré
- **Compression d'images** : Images automatiquement compressées pour un traitement rapide
- **Gestion des erreurs** : Messages clairs et fallback intelligent
- **Stockage local** : Base de données SQLite pour une persistance des données

---

## 🆕 Nouveautés v1.1

### 🎨 Design Ultra-Épuré
- **Palette de couleurs modernisée** :
  - Fond : `#121212` (Noir profond)
  - Primaire : `#722f37` (Rouge vin élégant)
  - Accent : `#c9a86c` (Or chaud)
  - Cartes : `#1a1a1a` (Noir légèrement plus clair)

- **Interface repensée** :
  - Boutons cohérents avec classes `.btn`, `.btn-primary`, `.btn-ai`, `.btn-danger`
  - Popups centrées et compactes
  - Grille de cave visible sans scroll

### 📱 Améliorations Interface
- **Header repensé** :
  - Logo + barre de recherche + boutons Chat IA/Ajouter **centrés**
  - Indicateurs Mistral/Google **à droite** (icônes seulement, 32x32px)
  - Bouton "Vider la cave" = **icône seule** (pas de texte)

- **Grille de cave optimisée** :
  - Cellules : 60px (desktop), 55px (tablette), 50px (mobile)
  - Gap réduit : 8px (desktop/tablette), 6px (mobile)
  - **Toute la cave tient à l'écran sans scroll**

- **Popups améliorées** :
  - Largeur maximale : 600px (desktop), 550px (tablette), 450px (mobile)
  - Formulaires centrés avec `max-width: 400px`
  - Boutons alignés et responsive

### 🔧 Corrections Techniques
- **Gestion des popups** : Utilisation de classes `.active` au lieu de `style.display`
- **Suppression des styles inline** : Normalisation des classes CSS
- **Code CSS réduit** : 961 lignes → 352 lignes (63% de réduction)
- **Meilleure organisation du code** : Structure claire et maintenable

---

## 📱 Optimisation Mobile & Tablette

### ✅ Adaptation responsive
- **Mobile (portrait)** :
  - Header en colonne avec éléments centrés
  - Cellules de cave : 50px × 68px
  - Grille : gap 6px
  - Boutons : 32px de hauteur

- **Tablette (portrait)** :
  - Header en ligne avec flex-wrap
  - Cellules de cave : 55px × 75px
  - Grille : gap 8px

- **Tablette (paysage) & Desktop** :
  - Header en ligne avec éléments centrés
  - Cellules de cave : 60px × 80px
  - Grille : gap 8px

### ✅ Expérience tactile
- Boutons avec `min-height: 44px` pour une meilleure prise en main
- Feedback visuel au touch (hover/active)
- Prévention du zoom accidentel sur les inputs
- Scroll fluide sur iOS/Android

---

## ⚙️ Configuration

### 📋 Prérequis
- Node.js 14+ (recommandé : 18+)
- npm ou yarn
- SQLite (inclus avec Node.js)

### 🔑 Clés API nécessaires

#### 1. Mistral AI (OBLIGATOIRE pour l'IA)
- **Obtenir une clé** : [https://console.mistral.ai/api-keys/](https://console.mistral.ai/api-keys/)
- **Modèle recommandé** : `mistral-tiny` (gratuit)
- **Modèles supportés** : `mistral-tiny`, `mistral-small`, `mistral-medium`

#### 2. Google Vision API (OPTIONNEL - pour l'OCR)
- **Obtenir une clé** : [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
- **Gratuité** : 1000 requêtes/mois
- **Fonctionne sans** : L'analyse se fera avec Mistral AI uniquement (moins précise)

---

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

### 3. Configurer les variables d'environnement
```bash
cp .env.example .env
# Éditer .env et ajouter vos clés API
```

### 4. Lancer l'application
```bash
npm start
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000)

---

## 💡 Utilisation

### 1. Première configuration
Au premier lancement, une popup vous demandera de configurer votre cave :
- **Nombre de rangées** : 5 (par défaut)
- **Nombre de colonnes** : 10 (par défaut)

### 2. Ajouter une bouteille
1. Cliquez sur une **cellule vide** de la grille
2. **Option 1 - Avec photo** :
   - Sélectionnez une photo de l'étiquette (galerie ou drag & drop)
   - Cliquez sur **"Analyser avec IA"** pour extraction automatique
3. **Option 2 - Manuel** :
   - Remplissez les champs manuellement
4. Cliquez sur **"Enregistrer"**

### 3. Modifier une bouteille
1. Cliquez sur une **cellule occupée**
2. Cliquez sur **"Modifier"** dans la popup de détails
3. Modifiez les informations
4. Cliquez sur **"Enregistrer"**

### 4. Supprimer une bouteille
1. Cliquez sur une bouteille
2. Cliquez sur **"Supprimer"** dans la popup de détails
3. Confirmez la suppression

### 5. Rechercher des bouteilles
- Utilisez la **barre de recherche** en haut
- Filtrez par : nom, année, cépage, région, accords mets-vins, etc.
- Les bouteilles correspondantes seront **surlignées**

### 6. Utiliser le Chat IA
1. Cliquez sur le bouton **💬 Chat IA** (en haut au centre)
2. Posez votre question (exemples ci-dessous)
3. Recevez une réponse instantanée

**Exemples de questions :**
- "Quel vin avec un bœuf bourguignon ?"
- "À quelle température servir un Bordeaux 2018 ?"
- "Quels sont les meilleurs cépages pour vieillir 10 ans ?"
- "Peux-tu m'expliquer la différence entre AOC et IGP ?"
- "Quel vin offrir pour un dîner romantique ?"

### 7. Vider la cave
- Cliquez sur l'icône **🗑️** (en haut à droite)
- Confirmez l'action (irréversible)

---

## 📁 Structure du projet

```
Gestion_Cave/
├── public/                          # Frontend
│   ├── index.html                   # Page principale
│   ├── style.css                    # Styles CSS (v1.1 - Ultra-épuré)
│   ├── script.js                    # Logique frontend principale
│   ├── cave.js                      # Gestion de la grille de cave
│   ├── camera.js                    # Gestion des images et compression
│   └── uploads/                     # Images uploadées (créé automatiquement)
│
├── server/                          # Backend
│   ├── app.js                       # Serveur Express
│   ├── database.js                  # Base de données SQLite
│   ├── mistralConfig.js             # Configuration Mistral AI
│   ├── mistralAI.js                 # Intégration API Mistral
│   ├── mistralAnalyzer.js           # Analyse des bouteilles (CORRIGÉ)
│   ├── googleVision.js              # Intégration Google Vision OCR
│   └── routes/                      # Routes API
│       ├── bottles.js               # Routes bouteilles
│       └── cave.js                  # Routes cave
│
├── .env.example                     # Exemple de configuration
├── package.json
├── package-lock.json
└── README.md
```

---

## 📜 Historique des versions

### v1.1 (20 juin 2026) - **Dernière version**
**Corrections demandées par l'utilisateur :**
- ✅ Cave visible sans scroll (cellules réduites à 60px)
- ✅ Indicateurs Mistral/Google plus petits (32x32px avec icônes)
- ✅ Bouton "Vider la cave" = icône seule
- ✅ Barre recherche + Ajouter + Chat IA centrés

**Améliorations :**
- Design ultra-épuré avec palette modernisée
- Popups compactes et centrées
- Code CSS réduit de 63%
- Meilleure organisation du code

### v6.0.4 (20 juin 2026)
**Corrections bugs majeurs :**
- FIX: `callMistral is not defined` (import manquant)
- FIX: Popups qui s'ouvrent toutes au chargement
- FIX: Zone cliquable qui prend tout l'écran
- FIX: Boutons moches et mal placés
- FIX: Analyse IA qui ne fonctionne plus

### v6.0.3 (20 juin 2026)
**Corrections critiques :**
- Correction de la disparition de la photo lors de la modification
- Analyse complète avec Mistral AI (même sans OCR)
- Design épuré et moderne pour mobile/tablette
- Prompt Mistral ultra-précis pour tous les champs
- Correction de la regex pour le traitement des images base64
- Meilleure gestion des data URLs dans googleVision.js

### v6.0.0 (19 juin 2026)
**Fonctionnalités initiales :**
- Reconnaissance d'étiquettes avec Google Vision + Mistral AI
- Gestion de cave virtuelle
- Chat IA intégré
- Interface responsive

---

## 🌿 Branches disponibles

| Branche | Version | État | Description |
|---------|---------|------|-------------|
| **main** | v1.1 | ✅ Stable | Version principale avec toutes les corrections |
| **1.1_interface_OK_IA_NOK** | v1.1 | ⚠️ Sauvegarde | Interface OK, IA à vérifier (problème de cache possible) |
| **vibe/fix-bugs-design-28e8e5** | v1.0 | ❌ Obsolète | Ancienne version avant les corrections d'interface |

### 🔄 Comment changer de branche ?
```bash
# Pour aller sur main (recommandé)
git checkout main

# Pour aller sur la sauvegarde
git checkout SAVE_V1_0_interface_OK_IA_NOK

# Pour voir les différences entre branches
git diff main...SAVE_V1_0_interface_OK_IA_NOK
```

---

## 🛠️ Technologies utilisées

| Catégorie | Technologies |
|----------|--------------|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+) |
| **Backend** | Node.js, Express |
| **Base de données** | SQLite3 |
| **IA** | Mistral AI (LLM), Google Vision (OCR) |
| **UI** | Font Awesome 6.4.0, Google Fonts (Segoe UI, Playfair Display) |
| **Build** | npm |

---

## 🤝 Contribution

Les contributions sont les bienvenues !

### Comment contribuer ?
1. Forker le dépôt
2. Créer une branche (`git checkout -b feature/ma-fonctionnalité`)
3. Commiter vos changements (`git commit -m 'Ajout de ma fonctionnalité'`)
4. Pousser sur la branche (`git push origin feature/ma-fonctionnalité`)
5. Ouvrir une Pull Request

### Bonnes pratiques
- Respecter le style de code existant
- Ajouter des commentaires pour les fonctions complexes
- Tester vos modifications avant de commiter
- Mettre à jour le README si nécessaire

---

## 📜 Licence

**MIT License**

Copyright (c) 2026 thomRoot

Permission est accordée, gratuitement, à toute personne obtenant une copie de ce logiciel et des fichiers de documentation associés, de traiter avec le logiciel sans restriction, y compris sans limitation les droits d'utiliser, copier, modifier, fusionner, publier, distribuer, sous-licencier, et/ou vendre des copies du logiciel, et de permettre aux personnes auxquelles le logiciel est fourni de le faire, sous réserve des conditions suivantes :

Les avis de copyright ci-dessus et cet avis de permission doivent être inclus dans toutes les copies ou parties substantielles du logiciel.

---

**Version** : 1.1  
**Dernière mise à jour** : 20 juin 2026  
**Auteur** : [thomRoot](https://github.com/thomRoot)  
**Dépôt** : [Gestion_Cave](https://github.com/thomRoot/Gestion_Cave)
