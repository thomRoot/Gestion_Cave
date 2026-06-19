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
    analyzeWineLabel,
    extractBottleInfoFromText,
    getWinePairingAdvice,
    getWineInfo,
    recommendWineForOccasion,
    searchWineByName,
    generateFallbackResponse
};
