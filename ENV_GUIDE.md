# Guide de configuration du fichier .env

## 📁 Fichier .env

Le fichier `.env` est utilisé pour configurer votre clé API Mistral. Il doit être placé à la **racine** de votre projet (au même niveau que `package.json` et `server/`).

### ⚠️ IMPORTANT : Ne jamais commiter votre fichier .env sur GitHub !

Il contient votre clé API secrète. Le fichier `.gitignore` est déjà configuré pour l'ignorer.

---

## 🔑 Configuration de base

### 1. Créer le fichier .env

```bash
cd /chemin/vers/votre/projet/Gestion_Cave
nano .env  # ou utilisez un autre éditeur de texte
```

### 2. Ajouter votre clé API Mistral

```
# Clé API Mistral (obligatoire pour utiliser l'IA avancée)
MISTRAL_API_KEY=votre_clé_api_ici

# Modèle à utiliser (optionnel - par défaut : mistral-tiny)
MISTRAL_MODEL=mistral-small
```

### 3. Où obtenir une clé API Mistral ?

1. Allez sur [https://mistral.ai/](https://mistral.ai/)
2. Créez un compte (gratuit)
3. Allez dans votre tableau de bord
4. Générez une nouvelle clé API
5. Copiez-la dans votre fichier .env

---

## 📊 Modèles disponibles

| Modèle | Description | Prix |
|--------|-------------|------|
| `mistral-tiny` | Modèle léger, rapide | Gratuit (limité) |
| `mistral-small` | Bon équilibre vitesse/qualité | Payant |
| `mistral-medium` | Meilleure qualité | Payant |

**Recommandation** : Commencez avec `mistral-tiny` pour tester, puis passez à `mistral-small` pour une meilleure qualité.

---

## 🚀 Configuration complète

Exemple de fichier `.env` complet :

```
# Mistral AI Configuration
MISTRAL_API_KEY=sk-1234567890abcdef1234567890abcdef
MISTRAL_MODEL=mistral-small

# Configuration optionnelle du serveur (si nécessaire)
PORT=3000
NODE_ENV=development
```

---

## 🔍 Vérification

Pour vérifier que votre configuration fonctionne :

1. Lancez le serveur :
   ```bash
   node server/app.js
   ```

2. Ouvrez votre navigateur à l'adresse : `http://localhost:3000`

3. Essayez d'analyser une étiquette de vin :
   - Cliquez sur une cellule vide
   - Sélectionnez une image d'étiquette
   - L'IA devrait reconnaître le vin et remplir les informations

---

## ❓ Problèmes courants

### "MISTRAL_API_KEY non configurée"
**Solution** : Vérifiez que :
- Le fichier `.env` existe bien à la racine
- Il contient bien `MISTRAL_API_KEY=votre_clé`
- Le serveur a été redémarré après la création du fichier

### L'IA ne fonctionne pas mais pas d'erreur
**Solution** :
- Vérifiez que votre clé API est valide
- Vérifiez que vous avez des crédits sur votre compte Mistral
- Essayez avec `mistral-tiny` qui est gratuit

### "Erreur HTTP 401"
**Solution** : Votre clé API est invalide. Générez-en une nouvelle sur le site de Mistral.

---

## 💡 Astuces

1. **Gardez votre clé secrète** : Ne partagez jamais votre fichier .env
2. **Utilisez des variables d'environnement** : Pour le déploiement, utilisez les variables d'environnement de votre hébergeur
3. **Testez localement** : Vérifiez que tout fonctionne en local avant de déployer
4. **Sauvegardez votre clé** : Conservez une copie de votre clé API dans un endroit sûr

---

## 📝 Notes techniques

- Le fichier `.env` est chargé au démarrage du serveur
- Si vous modifiez le fichier, vous devez redémarrer le serveur
- Le système utilise le module `https` natif de Node.js, pas de dépendance supplémentaire nécessaire
- La configuration est gérée par `server/mistralConfig.js`
