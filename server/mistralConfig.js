// Configuration pour l'API Mistral
// Créez un fichier .env dans le dossier racine avec : MISTRAL_API_KEY=votre_clé_api

// Charger les variables d'environnement depuis le fichier .env
const fs = require('fs');
const path = require('path');

// Charger manuellement le fichier .env (sans dépendance externe)
function loadEnvFile() {
    const envPath = path.join(__dirname, '../.env');
    try {
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const lines = envContent.split('\n');
            
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine && !trimmedLine.startsWith('#')) {
                    const [key, value] = trimmedLine.split('=');
                    if (key && value) {
                        process.env[key.trim()] = value.trim();
                    }
                }
            }
        }
    } catch (error) {
        console.warn('⚠️  Impossible de charger le fichier .env:', error.message);
    }
}

// Charger le fichier .env
loadEnvFile();

const MISTRAL_CONFIG = {
    apiKey: process.env.MISTRAL_API_KEY || null,
    model: process.env.MISTRAL_MODEL || 'mistral-tiny', // ou 'mistral-small', 'mistral-medium' selon votre abonnement
    baseUrl: 'https://api.mistral.ai/v1/',
    
    // Prompt système pour le chat IA
    systemPrompt: `Tu es un expert en vin et en gestion de cave à vin. 
Tu dois répondre de manière précise, professionnelle et utile aux questions sur :
- Les accords mets-vins (quel vin avec quel plat)
- Les températures de service
- Les cépages, régions et appellations
- La gestion d'une cave à vin
- L'analyse d'étiquettes de vin

Réponds toujours en français, de manière claire et concise. 
Si tu ne connais pas la réponse, dis-le honnêtement et propose des alternatives.
Ne fais pas de blagues, reste professionnel.
Utilise des emojis vinicoles (🍷, 🍇) avec modération.`,
    
    // Prompt système pour l'analyse d'image
    analysisSystemPrompt: `Tu es un expert en reconnaissance d'étiquettes de vin. 
On va te donner une image d'une étiquette de vin à analyser.
Ton rôle est d'analyser cette image et d'extraire les informations suivantes :
- Nom du vin (ou du domaine/château)
- Année/millésime (si présente)
- Cépage(s) principal(aux)
- Région/appellation
- Producteur (si identifiable)

Format de réponse : UNIQUEMENT un objet JSON avec les champs : name, year, grapes, region, producer.
Si une information n'est pas trouvée, mets null.
Ne réponds JAMAIS autre chose que le JSON.`
};

// Vérifier que la clé API est configurée
if (!MISTRAL_CONFIG.apiKey) {
    console.warn('⚠️  Attention : MISTRAL_API_KEY non configurée. L\'IA Mistral ne fonctionnera pas.');
    console.warn('   Ajoutez MISTRAL_API_KEY=votre_clé dans le fichier .env');
}

module.exports = MISTRAL_CONFIG;