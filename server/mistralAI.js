// mistralAI.js - Intégration de l'API Mistral pour une VRAIE IA
// Version 5.0.0 - Corrigée et optimisée

const https = require('https');
const mistralConfig = require('./mistralConfig');

/**
 * Effectuer une requête HTTP POST vers l'API Mistral
 * @param {string} path - Le chemin de l'API
 * @param {Object} body - Le corps de la requête
 * @returns {Promise<Object>} - La réponse JSON
 */
function mistralRequest(path, body) {
    return new Promise((resolve, reject) => {
        if (!mistralConfig.apiKey) {
            reject(new Error('MISTRAL_API_KEY non configurée. Ajoutez-la dans le fichier .env'));
            return;
        }
        
        const postData = JSON.stringify(body);
        
        const options = {
            hostname: 'api.mistral.ai',
            path: `/v1/${path}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'Authorization': `Bearer ${mistralConfig.apiKey}`
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (parseError) {
                        reject(new Error(`Erreur de parsing JSON: ${parseError.message}`));
                    }
                } else {
                    reject(new Error(`Erreur HTTP ${res.statusCode}: ${data}`));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.write(postData);
        req.end();
    });
}

/**
 * Appeler l'API Mistral avec un prompt
 * @param {string} prompt - Le prompt utilisateur
 * @param {string} systemPrompt - Le prompt système (optionnel)
 * @returns {Promise<string>} - La réponse de Mistral
 */
async function callMistral(prompt, systemPrompt = null) {
    if (!mistralConfig.apiKey) {
        throw new Error('MISTRAL_API_KEY non configurée. Ajoutez-la dans le fichier .env');
    }
    
    try {
        const requestBody = {
            model: mistralConfig.model,
            messages: []
        };
        
        // Ajouter le prompt système si fourni
        if (systemPrompt) {
            requestBody.messages.push({
                role: 'system',
                content: systemPrompt
            });
        }
        
        // Ajouter le prompt utilisateur
        requestBody.messages.push({
            role: 'user',
            content: prompt
        });
        
        const response = await mistralRequest('chat/completions', requestBody);
        
        if (response && response.choices && response.choices.length > 0) {
            return response.choices[0].message.content;
        }
        
        throw new Error('Aucune réponse reçue de Mistral');
    } catch (error) {
        console.error('Erreur Mistral API:', error.message);
        throw error;
    }
}

/**
 * Poser une question au chat IA (pour l'assistant)
 * @param {string} question - La question de l'utilisateur
 * @returns {Promise<string>} - La réponse du chat
 */
async function askChatQuestion(question) {
    try {
        const response = await callMistral(
            question,
            mistralConfig.systemPrompt
        );
        return response;
    } catch (error) {
        // Fallback vers une réponse locale si Mistral échoue
        console.error('Mistral non disponible, utilisation du fallback:', error.message);
        return generateFallbackResponse(question);
    }
}

/**
 * Poser une question au chat IA avec accès à la cave de l'utilisateur
 * @param {string} question - La question de l'utilisateur
 * @param {Array} bottles - Les bouteilles de la cave de l'utilisateur
 * @returns {Promise<string|Object>} - La réponse du chat (peut être un objet structuré pour les recommandations)
 */
async function askChatQuestionWithCave(question, bottles) {
    try {
        // Créer un prompt enrichi avec les bouteilles de la cave
        const caveContext = generateCaveContext(bottles);
        const enhancedPrompt = `${caveContext}

Question de l'utilisateur : ${question}`;
        
        const systemPrompt = `Tu es un expert en vin et le conseiller personnel de l'utilisateur. 
Tu as accès à sa cave à vin personnelle. 
Analyse sa question en tenant compte des bouteilles qu'il possède.
Si l'utilisateur demande une recommandation, privilégie les vins de sa cave.
Si l'utilisateur demande "quel vin" ou "recommande moi un vin", propose toujours un vin de sa cave si possible.

IMPORTANT : Si l'utilisateur demande une recommandation de vin, réponds UNIQUEMENT avec un objet JSON contenant :
{
  "type": "recommendations",
  "message": "ton message d'introduction",
  "bottles": [
    {
      "name": "nom du vin",
      "year": année,
      "grapes": "cépage",
      "region": "région",
      "foodPairing": "accords mets-vins",
      "temperature": "température de service",
      "drinkFrom": année_debut,
      "drinkTo": année_fin,
      "photo": "nom_du_fichier_photo"
    }
  ]
}

Sinon, réponds normalement en texte. NE JAMAIS mélanger les deux formats.`;
        
        const response = await callMistral(
            enhancedPrompt,
            systemPrompt
        );
        
        // Essayer de parser comme JSON (pour les recommandations structurées)
        try {
            const trimmedResponse = response.trim();
            // Supprimer les marqueurs markdown si présents
            const cleanedResponse = trimmedResponse
                .replace(/^```json\s*/, '')
                .replace(/```\s*$/, '')
                .replace(/^```\s*/, '');
            
            // Vérifier si c'est un JSON valide
            const jsonMatch = cleanedResponse.match(/^\{[\[\]\s\S]*\}$/);
            if (jsonMatch) {
                const parsed = JSON.parse(cleanedResponse);
                if (parsed.type === 'recommendations' && parsed.bottles) {
                    return parsed;
                }
            }
        } catch (e) {
            // Ce n'est pas du JSON, retourner la réponse texte
        }
        
        // Si ce n'est pas une recommandation structurée, retourner le texte
        return response;
    } catch (error) {
        // Fallback vers une réponse locale si Mistral échoue
        console.error('Mistral non disponible, utilisation du fallback:', error.message);
        return generateFallbackResponseWithCave(question, bottles);
    }
}

/**
 * Générer un contexte à partir des bouteilles de la cave
 * @param {Array} bottles - Les bouteilles de la cave
 * @returns {string} - Le contexte formaté
 */
function generateCaveContext(bottles) {
    if (!bottles || bottles.length === 0) {
        return "L'utilisateur n'a pas encore de bouteilles dans sa cave.";
    }
    
    const caveSummary = bottles.map((bottle, index) => {
        const name = bottle.name || "Inconnu";
        const year = bottle.year || "N/A";
        const region = bottle.region || "N/A";
        const grapes = bottle.grapes || "N/A";
        const foodPairing = bottle.foodPairing || "N/A";
        const temperature = bottle.temperature || "N/A";
        const drinkFrom = bottle.drinkFrom || "N/A";
        const drinkTo = bottle.drinkTo || "N/A";
        
        return `Bouteille ${index + 1}: ${name} (${year}) - Région: ${region}, Cépage: ${grapes}, Accords: ${foodPairing}, Température: ${temperature}, À boire: ${drinkFrom}-${drinkTo}`;
    }).join('\n');
    
    return `Voici les bouteilles dans la cave de l'utilisateur:\n${caveSummary}\n\n`;
}

/**
 * Générer une réponse de fallback avec accès à la cave
 * @param {string} question - La question
 * @param {Array} bottles - Les bouteilles de la cave
 * @returns {string|Object} - Réponse basique ou objet structuré pour les recommandations
 */
function generateFallbackResponseWithCave(question, bottles) {
    const questionLower = question.toLowerCase();
    
    // Si l'utilisateur demande une recommandation
    if (questionLower.includes('quel vin') || questionLower.includes('recommande') || 
        questionLower.includes('conseil') || questionLower.includes('suggère') ||
        questionLower.includes('conseille') || questionLower.includes('propose')) {
        
        if (!bottles || bottles.length === 0) {
            return {
                type: 'text',
                content: "Vous n'avez pas encore de bouteilles dans votre cave. Ajoutez-en pour que je puisse vous conseiller !"
            };
        }
        
        // Filtrer les bouteilles prêtes à boire
        const currentYear = new Date().getFullYear();
        const readyBottles = bottles.filter(bottle => {
            if (!bottle.drinkFrom && !bottle.drinkTo) return true;
            const drinkFrom = bottle.drinkFrom || currentYear;
            const drinkTo = bottle.drinkTo || currentYear + 10;
            return currentYear >= drinkFrom && currentYear <= drinkTo;
        });
        
        // Si on a des bouteilles prêtes, en proposer plusieurs (jusqu'à 5)
        if (readyBottles.length > 0) {
            // Trier par pertinence (si possible) ou prendre aléatoirement
            const recommendedBottles = readyBottles
                .sort(() => 0.5 - Math.random())
                .slice(0, Math.min(5, readyBottles.length));
            
            return {
                type: 'recommendations',
                message: `Voici ${recommendedBottles.length} bouteille(s) prête(s) à être dégustée(s) dans votre cave :`,
                bottles: recommendedBottles.map(bottle => ({
                    name: bottle.name || 'Bouteille inconnue',
                    year: bottle.year || null,
                    grapes: bottle.grapes || null,
                    region: bottle.region || null,
                    foodPairing: bottle.foodPairing || null,
                    temperature: bottle.temperature || null,
                    drinkFrom: bottle.drinkFrom || null,
                    drinkTo: bottle.drinkTo || null,
                    photo: bottle.photo || null,
                    row: bottle.row !== undefined ? bottle.row : null,
                    col: bottle.col !== undefined ? bottle.col : null
                }))
            };
        }
        
        // Si aucune bouteille n'est prête, proposer celles qui sont disponibles
        if (bottles.length > 0) {
            const availableBottles = bottles
                .sort(() => 0.5 - Math.random())
                .slice(0, Math.min(5, bottles.length));
            
            return {
                type: 'recommendations',
                message: `Voici quelques bouteilles de votre cave que je vous suggère :`,
                bottles: availableBottles.map(bottle => ({
                    name: bottle.name || 'Bouteille inconnue',
                    year: bottle.year || null,
                    grapes: bottle.grapes || null,
                    region: bottle.region || null,
                    foodPairing: bottle.foodPairing || null,
                    temperature: bottle.temperature || null,
                    drinkFrom: bottle.drinkFrom || null,
                    drinkTo: bottle.drinkTo || null,
                    photo: bottle.photo || null,
                    row: bottle.row !== undefined ? bottle.row : null,
                    col: bottle.col !== undefined ? bottle.col : null
                }))
            };
        }
    }
    
    // Sinon, utiliser la réponse standard
    return {
        type: 'text',
        content: generateFallbackResponse(question)
    };
}

/**
 * Analyser du texte d'étiquette de vin avec Mistral
 * @param {string} text - Le texte à analyser
 * @returns {Promise<Object>} - Les informations extraites (name, year, grapes, region, producer)
 */
async function analyzeWineLabel(text) {
    try {
        const prompt = `Analyse ce texte d'étiquette de vin et extrais les informations dans un objet JSON.
Texte de l'étiquette : """${text}"""

Retourne UNIQUEMENT un objet JSON avec les champs : name, year, grapes, region, appellation, producer, country, alcohol.
Si une information n'est pas trouvée, utilise null.
Ne réponds JAMAIS autre chose que le JSON.`;
        
        const response = await callMistral(
            prompt,
            mistralConfig.analysisSystemPrompt
        );
        
        // Essayer de parser la réponse JSON
        try {
            // Nettoyer la réponse pour extraire le JSON
            let cleanedResponse = response.trim();
            
            // Supprimer les marqueurs de code markdown
            cleanedResponse = cleanedResponse.replace(/^```json\s*/, '');
            cleanedResponse = cleanedResponse.replace(/```\s*$/, '');
            cleanedResponse = cleanedResponse.replace(/^```\s*/, '');
            
            // Chercher le premier objet JSON dans la réponse
            const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            // Essayer de parser directement
            try {
                return JSON.parse(cleanedResponse);
            } catch (e) {
                // Dernière tentative : extraire entre accolades
                const start = cleanedResponse.indexOf('{');
                const end = cleanedResponse.lastIndexOf('}');
                if (start !== -1 && end !== -1 && end > start) {
                    const jsonStr = cleanedResponse.substring(start, end + 1);
                    return JSON.parse(jsonStr);
                }
            }
            
            // Si rien ne fonctionne, retourner null
            return null;
        } catch (parseError) {
            console.error('Erreur de parsing JSON:', parseError);
            return null;
        }
    } catch (error) {
        console.error('Mistral non disponible pour l\'analyse:', error.message);
        return null;
    }
}

/**
 * Extraire les informations d'une bouteille à partir de texte
 * @param {string} text - Texte à analyser
 * @returns {Promise<Object>}
 */
async function extractBottleInfoFromText(text) {
    return analyzeWineLabel(text);
}

/**
 * Générer une réponse de fallback (si Mistral n'est pas disponible)
 * @param {string} question - La question
 * @returns {string} - Réponse basique
 */
function generateFallbackResponse(question) {
    const questionLower = question.toLowerCase();
    
    // Accords mets-vins basiques
    if (questionLower.includes('barbecue')) {
        return "Pour un barbecue, je recommande un vin rouge puissant comme un Côtes du Rhône, un Malbec ou un Syrah. Ces vins accompagnent parfaitement les viandes grillées.";
    }
    if (questionLower.includes('entrecôte') || questionLower.includes('boeuf')) {
        return "Avec un entrecôte ou du bœuf, optez pour un Bordeaux (Pauillac, Saint-Julien), un Cabernet Sauvignon ou un Syrah. Ces vins ont la structure nécessaire pour accompagner les viandes rouges.";
    }
    if (questionLower.includes('poisson') || questionLower.includes('fruits de mer')) {
        return "Pour le poisson et les fruits de mer, je conseille un vin blanc comme un Chablis, un Muscadet, un Sancerre ou un Sauvignon Blanc.";
    }
    if (questionLower.includes('fromage')) {
        return "Avec le fromage, essayez un vin rouge comme un Bordeaux, un Bourgogne ou un Côtes du Rhône. Pour les fromages bleus, un vin liquoreux comme le Sauternes est parfait.";
    }
    
    // Températures
    if (questionLower.includes('température') && questionLower.includes('rouge')) {
        return "La température idéale pour servir un vin rouge est entre 16 et 18°C.";
    }
    if (questionLower.includes('température') && questionLower.includes('blanc')) {
        return "La température idéale pour servir un vin blanc sec est entre 10 et 12°C.";
    }
    if (questionLower.includes('température') && questionLower.includes('champagne')) {
        return "Le champagne se sert bien frais, entre 6 et 8°C.";
    }
    
    // Questions générales
    if (questionLower.includes('comment ça marche') || questionLower.includes('aide')) {
        return "Je suis votre assistant IA pour la gestion de cave à vin. Vous pouvez me poser des questions sur les accords mets-vins, les températures de service, ou l'analyse d'étiquettes de vin. Essayez par exemple : 'Quel vin avec un barbecue ?' ou 'À quelle température servir un Bordeaux ?' ";
    }
    
    return "Je suis là pour vous aider avec votre cave à vin. Posez-moi une question spécifique sur les vins, les accords mets-vins ou les températures de service.";
}

/**
 * Obtenir des conseils d'accords mets-vins avec Mistral
 * @param {string} food - Le plat ou l'ingrédient
 * @returns {Promise<string>} - Les conseils d'accords
 */
async function getWinePairingAdvice(food) {
    const prompt = `Donne-moi des conseils d'accords mets-vins pour : ${food}.
Réponds de manière concise et professionnelle, en proposant 3-5 vins adaptés.`;
    
    return askChatQuestion(prompt);
}

/**
 * Obtenir des informations sur un vin spécifique
 * @param {string} wineName - Le nom du vin
 * @returns {Promise<string>} - Les informations sur le vin
 */
async function getWineInfo(wineName) {
    const prompt = `Donne-moi des informations détaillées sur le vin : ${wineName}.
Inclus : cépage, région, température de service, accords mets-vins, période de garde.`;
    
    return askChatQuestion(prompt);
}

/**
 * Recommander un vin pour une occasion
 * @param {string} occasion - L'occasion
 * @param {string} food - Le plat
 * @param {string} budget - Le budget
 * @returns {Promise<string>}
 */
async function recommendWineForOccasion(occasion, food, budget) {
    const prompt = `Recommande-moi un vin pour l'occasion suivante : ${occasion || 'non spécifiée'}, avec le plat : ${food || 'non spécifié'}, et un budget de : ${budget || 'non spécifié'}.
Donne-moi 3 suggestions avec des explications.`;
    
    return askChatQuestion(prompt);
}

/**
 * Chercher un vin par nom
 * @param {string} name - Le nom du vin
 * @returns {Promise<Object|null>}
 */
async function searchWineByName(name) {
    try {
        const prompt = `Donne-moi des informations détaillées sur le vin appelé : ${name}.
Retourne UNIQUEMENT un objet JSON avec les champs : name, year, grapes, region, appellation, producer, country, alcohol, drinkFrom, drinkTo, foodPairing, temperature.
Si tu ne connais pas ce vin, retourne null.`;
        
        const response = await callMistral(prompt);
        
        try {
            // Parser la réponse
            let cleanedResponse = response.trim();
            cleanedResponse = cleanedResponse.replace(/^```json\s*/, '');
            cleanedResponse = cleanedResponse.replace(/```\s*$/, '');
            
            const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return null;
        } catch (e) {
            return null;
        }
    } catch (error) {
        console.error('Erreur recherche vin par nom:', error.message);
        return null;
    }
}

module.exports = {
    callMistral,
    askChatQuestion,
    askChatQuestionWithCave,
    analyzeWineLabel,
    extractBottleInfoFromText,
    getWinePairingAdvice,
    getWineInfo,
    recommendWineForOccasion,
    searchWineByName,
    generateFallbackResponse,
    generateCaveContext,
    generateFallbackResponseWithCave
};
