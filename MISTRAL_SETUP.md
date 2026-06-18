# 🚀 Configuration de l'API Mistral pour Ma Cave à Vin

## 📋 Pourquoi utiliser Mistral ?

Vous avez maintenant accès à une **vraie intelligence artificielle** grâce à l'API Mistral que vous payez déjà. Plus besoin de simples correspondances de mots-clés, vous obtenez des réponses **naturelles, intelligentes et contextuelles**.

### Comparaison :

| Fonctionnalité | Avant (Recherche de mots-clés) | Maintenant (Mistral AI) |
|---------------|-------------------------------|------------------------|
| Chat IA | Réponses préenregistrées | **Réponses dynamiques et intelligentes** |
| Analyse d'image | Reconnaissance basique | **Analyse intelligente avec compréhension du contexte** |
| Accords mets-vins | Liste statique | **Conseils personnalisés et détaillés** |
| Questions générales | Réponses génériques | **Réponses adaptées au contexte** |

---

## 🔧 Configuration

### 1. Obtenir votre clé API Mistral

1. Allez sur [https://console.mistral.ai/](https://console.mistral.ai/)
2. Connectez-vous avec votre compte
3. Allez dans **"API Keys"** ou **"Clés d'API"**
4. Créez une nouvelle clé API (ou utilisez une existante)
5. **Copiez cette clé**

### 2. Configurer votre application

Dans le dossier racine de votre projet (`/workspace/thomRoot__Gestion_Cave`), créez un fichier `.env` :

```bash
# Créez le fichier .env
cd /workspace/thomRoot__Gestion_Cave
touch .env
```

Éditez le fichier `.env` et ajoutez :

```env
# Clé API Mistral (REMPLACEZ par votre clé)
MISTRAL_API_KEY=votre_clé_api_ici

# Modèle à utiliser (optionnel)
# mistral-tiny = rapide et économique
# mistral-small = plus puissant
# mistral-medium = le plus puissant
MISTRAL_MODEL=mistral-tiny
```

### 3. Exemple de fichier `.env`

```env
MISTRAL_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MISTRAL_MODEL=mistral-small
```

---

## ✅ Fonctionnalités activées avec Mistral

### 1. **Chat IA Intelligent** 💬

Posez n'importe quelle question sur le vin :

- `"Quel vin avec un barbecue ?"` → Mistral analysera et proposera des vins adaptés
- `"Qu'est-ce qui irait bien avec un entrecôte ?"` → Réponse détaillée avec explications
- `"À quelle température servir un Bordeaux 2018 ?"` → Température précise + conseils
- `"C'est quoi la différence entre un Pinot Noir et un Syrah ?"` → Explication détaillée

**Exemple de conversation :**
```
Vous: Quel vin avec un magret de canard ?
Mistral: Pour un magret de canard, je vous recommande un vin rouge avec une belle structure tannique mais des tanins souples. 
Excellents choix : un Saint-Émilion, un Pomerol, ou un Pinot Noir de Bourgogne. 
Température de service : 16-18°C. Accords parfaits !
```

### 2. **Analyse d'image intelligente** 🖼️

Quand vous analysez une étiquette de vin :
1. **Mistral AI analyse directement l'image** pour identifier :
   - Nom du vin
   - Millésime
   - Cépage
   - Région
   - Producteur
2. L'application complète automatiquement les champs

**Résultat :** Plus de noms absurdes comme "NS Ji ez" ou "3 nN y \ Aié"rd", mais de **vraies informations** extraites intelligemment.

### 3. **Conseils personnalisés** 🍷

- **Accords mets-vins** : Mistral comprend le contexte et propose des vins adaptés
- **Températures** : Réponses précises selon le type de vin
- **Informations sur les vins** : Descriptions détaillées, régions, cépages, etc.

---

## 🛠️ Dépannage

### "Mistral non disponible" ou "MISTRAL_API_KEY non configurée"

**Solution :**
1. Vérifiez que le fichier `.env` existe dans `/workspace/thomRoot__Gestion_Cave`
2. Vérifiez que la clé API est correcte (sans espaces, sans guillemets)
3. Redémarrez le serveur :
   ```bash
   npm start
   ```

### "Erreur HTTP 401" ou "Unauthorized"

**Solution :** Votre clé API est invalide ou expirée.
1. Vérifiez que votre abonnement Mistral est actif
2. Générez une nouvelle clé API sur [console.mistral.ai](https://console.mistral.ai/)
3. Mettez à jour le fichier `.env`

### "Erreur HTTP 429" ou "Too Many Requests"

**Solution :** Vous avez dépassé votre quota de requêtes.
1. Attendez quelques minutes
2. Si le problème persiste, vérifiez votre quota sur le tableau de bord Mistral
3. Passez à un modèle moins gourmand (ex: `mistral-tiny`)

### L'API fonctionne mais c'est lent

**Solutions :**
1. Utilisez `MISTRAL_MODEL=mistral-tiny` dans votre `.env` (plus rapide)
2. Vérifiez votre connexion internet
3. Mistral peut mettre quelques secondes à répondre (c'est normal)

---

## 📊 Modèles disponibles

| Modèle | Vitesse | Qualité | Coût |
|--------|---------|---------|------|
| `mistral-tiny` | ⚡⚡⚡⚡⚡ | ★★★☆☆ | € |
| `mistral-small` | ⚡⚡⚡⚡ | ★★★★☆ | €€ |
| `mistral-medium` | ⚡⚡⚡ | ★★★★★ | €€€ |

**Recommandation :** Commencez avec `mistral-tiny` pour tester, puis passez à `mistral-small` pour de meilleurs résultats.

---

## 🔒 Sécurité

⚠️ **Ne partagez JAMAIS votre clé API** :
- Ne commitez pas le fichier `.env` dans Git
- Ne montrez pas votre clé à qui que ce soit
- Le fichier `.env` est dans `.gitignore` par défaut

---

## 🎉 C'est prêt !

Une fois configuré, votre application utilisera **la vraie puissance de Mistral AI** pour :
- ✅ Répondre intelligemment à vos questions sur le vin
- ✅ Analyser les étiquettes de vin avec compréhension du contexte
- ✅ Donner des conseils personnalisés et détaillés
- ✅ Comprendre le langage naturel (pas juste des mots-clés)

**Profitez de votre assistant vinicole intelligent !** 🍇🍷