// mistralAnalyzer.js - Analyseur de bouteilles de vin avec Google Vision + Mistral AI
// Version 5.0.0 - VRAIE analyse IA avec OCR + LLM

const fs = require('fs');
const path = require('path');
const mistralConfig = require('./mistralConfig');
const googleVision = require('./googleVision');
const mistralAI = require('./mistralAI');

/**
 * Analyser une bouteille avec VRAIE IA : Google Vision pour OCR + Mistral pour interprétation
 * @param {string} imagePathOrBase64 - Chemin du fichier ou image en base64
 * @param {boolean} isBase64 - Si true, imagePathOrBase64 est déjà en base64
 * @returns {Promise<Object>} - Informations de la bouteille
 */
async function analyzeBottleWithMistralOnly(imagePathOrBase64, isBase64 = false) {
    // Vérifier que Mistral est configuré
    if (!mistralConfig.apiKey) {
        return getFallbackBottleInfo("Mistral AI non configuré - ajoutez MISTRAL_API_KEY dans .env");
    }
    
    try {
        let labelText = null;
        
        // Étape 1 : Extraire le texte de l'image avec Google Vision
        if (imagePathOrBase64) {
            try {
                labelText = await googleVision.getCleanedLabelText(imagePathOrBase64, isBase64);
                console.log("Texte extrait de l'étiquette :", labelText);
            } catch (visionError) {
                console.warn("Google Vision non disponible ou erreur :", visionError.message);
                // Continuer sans OCR - on utilisera seulement le texte fourni
            }
        }
        
        // Étape 2 : Analyser le texte avec Mistral
        let bottleInfo;
        
        if (labelText && labelText.trim()) {
            // On a du texte extrait de l'image
            bottleInfo = await analyzeLabelTextWithMistral(labelText);
        } else {
            // Pas de texte extrait, utiliser une analyse générique
            bottleInfo = await analyzeGenericWithMistral();
        }
        
        if (!bottleInfo) {
            return getFallbackBottleInfo("Réponse Mistral invalide");
        }
        
        // Étape 3 : Compléter avec les informations dérivées
        const completeInfo = completeBottleInfo(bottleInfo);
        
        return {
            ...completeInfo,
            analysisMethod: labelText ? 'Google Vision + Mistral AI' : 'Mistral AI (texte)',
            extractedText: labelText
        };
        
    } catch (error) {
        console.error("Erreur analyse complète :", error.message);
        return getFallbackBottleInfo(`Erreur: ${error.message}`);
    }
}

/**
 * Analyser du texte d'étiquette avec Mistral
 * @param {string} labelText - Texte extrait de l'étiquette
 * @returns {Promise<Object>} - Informations de la bouteille
 */
async function analyzeLabelTextWithMistral(labelText) {
    const prompt = `Tu es un expert en vin français. J'ai extrait le texte suivant d'une étiquette de bouteille de vin :

"""
${labelText}
"""

Analyse ce texte et extrais UNIQUEMENT les informations suivantes dans un JSON valide :

{
  "name": "nom complet du vin tel qu'il apparaît sur l'étiquette",
  "year": "année du millésime (nombre entre 1800 et 2100, ou null si non visible)",
  "grapes": "cépage ou cépages principaux (ex: Cabernet Sauvignon, Merlot, etc.), ou null",
  "region": "région viticole (ex: Bordeaux, Bourgogne, Rioja, etc.), ou null",
  "appellation": "appellation officielle (AOC, IGP, DOC, etc.), ou null",
  "producer": "nom du producteur/château/domaine, ou null",
  "country": "pays d'origine (ex: France, Espagne, Italie), ou null",
  "alcohol": "degré d'alcool en % (ex: 13.5, ou null)"
}

Règles STRICTES :
- Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire avant ou après
- Si une information n'est PAS clairement visible dans le texte, mets null
- Ne fais PAS de suppositions, seulement ce qui est écrit dans le texte
- Pour les années, utilise un nombre entier ou null
- Pour les pourcentages, utilise un nombre décimal ou null
- Si le texte est vide ou illisible, retourne {"name": null, "year": null, "grapes": null, "region": null, "appellation": null, "producer": null, "country": null, "alcohol": null}

JSON:`;

    try {
        const response = await mistralAI.callMistral(prompt, mistralConfig.analysisSystemPrompt);
        
        if (!response) {
            return null;
        }
        
        // Parser la réponse pour extraire le JSON
        const bottleInfo = parseMistralResponse(response);
        
        return bottleInfo;
    } catch (error) {
        console.error("Erreur analyse texte avec Mistral :", error.message);
        return null;
    }
}

/**
 * Analyse générique sans texte d'étiquette
 * @returns {Promise<Object>}
 */
async function analyzeGenericWithMistral() {
    const prompt = `Tu es un expert en vin. Je n'ai pas pu extraire de texte de l'étiquette.
Retourne des informations par défaut pour une bouteille inconnue.

Retourne UNIQUEMENT un JSON avec les champs : name, year, grapes, region, appellation, producer, country, alcohol.
Tous les champs doivent être null.

JSON:`;

    try {
        const response = await mistralAI.callMistral(prompt);
        return parseMistralResponse(response) || {
            name: null,
            year: null,
            grapes: null,
            region: null,
            appellation: null,
            producer: null,
            country: null,
            alcohol: null
        };
    } catch (error) {
        return {
            name: null,
            year: null,
            grapes: null,
            region: null,
            appellation: null,
            producer: null,
            country: null,
            alcohol: null
        };
    }
}

/**
 * Analyser une bouteille avec du texte fourni manuellement
 * @param {Object} manualData - Données saisies manuellement
 * @returns {Promise<Object>}
 */
async function analyzeWithManualText(manualData) {
    const { name, year, grapes, region } = manualData;
    
    // Construire un texte à partir des données manuelles
    const textParts = [];
    if (name) textParts.push(`Nom: ${name}`);
    if (year) textParts.push(`Année: ${year}`);
    if (grapes) textParts.push(`Cépage: ${grapes}`);
    if (region) textParts.push(`Région: ${region}`);
    
    const text = textParts.join('\n');
    
    if (!text) {
        return getFallbackBottleInfo("Aucune donnée fournie");
    }
    
    try {
        const bottleInfo = await analyzeLabelTextWithMistral(text);
        if (!bottleInfo) {
            return getFallbackBottleInfo("Analyse échouée");
        }
        
        // Compléter avec les informations dérivées
        const completeInfo = completeBottleInfo(bottleInfo);
        
        return {
            ...completeInfo,
            analysisMethod: 'Mistral AI (texte manuel)'
        };
    } catch (error) {
        console.error("Erreur analyse texte manuel :", error.message);
        return getFallbackBottleInfo(`Erreur: ${error.message}`);
    }
}

/**
 * Parser la réponse de Mistral pour extraire le JSON
 */
function parseMistralResponse(response) {
    if (!response) return null;
    
    try {
        // Si la réponse est déjà un objet
        if (typeof response === 'object' && !Array.isArray(response)) {
            return response;
        }
        
        // Si c'est une chaîne, essayer d'extraire le JSON
        if (typeof response === 'string') {
            // Nettoyer la réponse
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
        }
        
        return null;
    } catch (error) {
        console.error("Erreur parsing réponse Mistral :", error);
        return null;
    }
}

/**
 * Compléter les informations de la bouteille avec des valeurs dérivées
 */
function completeBottleInfo(bottleInfo) {
    const currentYear = new Date().getFullYear();
    
    // Si on a un nom mais pas de year, essayer d'extraire l'année du nom
    let year = bottleInfo.year;
    let name = bottleInfo.name;
    
    if (name && !year) {
        const yearMatch = name.match(/\b(18|19|20)\d{2}\b/);
        if (yearMatch) {
            year = parseInt(yearMatch[0]);
            // Retirer l'année du nom
            name = name.replace(yearMatch[0], '').trim();
        }
    }
    
    // Calculer la période de consommation
    const { drinkFrom, drinkTo } = calculateDrinkPeriod(year, bottleInfo.grapes);
    
    // Déterminer les accords mets-vins
    const foodPairing = getFoodPairing(bottleInfo.grapes, bottleInfo.region);
    
    // Déterminer la température de service
    const temperature = getTemperature(bottleInfo.grapes, bottleInfo.region);
    
    return {
        ...bottleInfo,
        name: name || "Vin inconnu",
        year: year || null,
        drinkFrom: drinkFrom,
        drinkTo: drinkTo,
        foodPairing: foodPairing,
        temperature: temperature
    };
}

/**
 * Calculer la période de consommation
 */
function calculateDrinkPeriod(year, grapes) {
    const currentYear = new Date().getFullYear();
    
    if (year) {
        const agingPotential = getAgingPotential(grapes);
        
        let drinkFrom = year + agingPotential.min;
        let drinkTo = year + agingPotential.max;
        
        // Si la période est dans le passé, ajuster
        if (drinkFrom < currentYear) {
            drinkFrom = currentYear;
            drinkTo = currentYear + (agingPotential.max - agingPotential.min);
        }
        
        if (drinkTo < drinkFrom) {
            drinkTo = drinkFrom + 5;
        }
        
        return { drinkFrom, drinkTo };
    }
    
    return {
        drinkFrom: currentYear,
        drinkTo: currentYear + 5
    };
}

/**
 * Obtenir le potentiel de garde selon le cépage
 */
function getAgingPotential(grapes) {
    if (!grapes) {
        return { min: 2, max: 8 };
    }
    
    const grapesLower = grapes.toLowerCase();
    
    // Vins rouges avec long potentiel de garde
    if (grapesLower.includes('cabernet sauvignon') || grapesLower.includes('nebbiolo') || grapesLower.includes('barolo')) {
        return { min: 5, max: 25 };
    }
    
    // Vins rouges avec bon potentiel
    if (grapesLower.includes('syrah') || grapesLower.includes('malbec') || grapesLower.includes('tempranillo') || grapesLower.includes('sangiovese')) {
        return { min: 3, max: 15 };
    }
    
    // Vins rouges avec potentiel moyen
    if (grapesLower.includes('merlot') || grapesLower.includes('pinot noir') || grapesLower.includes('grenache') || grapesLower.includes('barbera')) {
        return { min: 2, max: 10 };
    }
    
    // Vins blancs avec long potentiel
    if (grapesLower.includes('riesling') || grapesLower.includes('chenin blanc')) {
        return { min: 2, max: 20 };
    }
    
    // Vins blancs avec bon potentiel
    if (grapesLower.includes('chardonnay') || grapesLower.includes('viognier')) {
        return { min: 1, max: 10 };
    }
    
    // Vins blancs avec potentiel court
    if (grapesLower.includes('sauvignon blanc') || grapesLower.includes('muscat') || grapesLower.includes('pinot gris')) {
        return { min: 1, max: 5 };
    }
    
    // Champagnes et vins effervescents
    if (grapesLower.includes('champagne') || grapesLower.includes('prosecco') || grapesLower.includes('cava')) {
        return { min: 0, max: 3 };
    }
    
    // Rosés
    if (grapesLower.includes('rosé') || grapesLower.includes('rose')) {
        return { min: 0, max: 3 };
    }
    
    return { min: 2, max: 8 };
}

/**
 * Obtenir les accords mets-vins selon le cépage ou la région
 */
function getFoodPairing(grapes, region) {
    if (!grapes && !region) {
        return "Viandes, Fromages, Plats variés";
    }
    
    const grapesLower = grapes ? grapes.toLowerCase() : '';
    const regionLower = region ? region.toLowerCase() : '';
    
    // Accords par cépage
    if (grapesLower.includes('cabernet sauvignon')) {
        return "Bœuf grillé, Agneau, Gibier, Fromage à pâte dure, Cassoulet, Magret de canard";
    }
    if (grapesLower.includes('merlot')) {
        return "Canard, Agneau, Viandes rouges, Fromages affinés, Plats en sauce, Charcuterie";
    }
    if (grapesLower.includes('pinot noir')) {
        return "Canard, Poulet, Champignons, Fromages doux, Gibier à plumes, Saumon grillé";
    }
    if (grapesLower.includes('syrah')) {
        return "Viandes grillées, Gibier, Fromages forts, Plats épicés, Agneau, Côtes d'agneau";
    }
    if (grapesLower.includes('chardonnay')) {
        return "Poisson blanc, Fruits de mer, Volaille, Fromages crémeux, Plats en sauce blanche";
    }
    if (grapesLower.includes('sauvignon blanc')) {
        return "Poisson, Fruits de mer, Salades, Fromage de chèvre, Asperges, Ceviche";
    }
    if (grapesLower.includes('riesling')) {
        return "Poisson, Fruits de mer, Cuisine asiatique, Fromage de chèvre, Choucroute";
    }
    if (grapesLower.includes('gewürztraminer')) {
        return "Cuisine asiatique, Foie gras, Fromages forts, Desserts aux fruits, Tarte aux quetsches";
    }
    
    // Accords par région
    if (regionLower.includes('bordeaux')) {
        return "Bœuf, Agneau, Gibier, Fromage à pâte dure, Cassoulet";
    }
    if (regionLower.includes('bourgogne')) {
        return "Canard, Poulet, Fromages affinés, Escargots, Bœuf bourguignon";
    }
    if (regionLower.includes('champagne')) {
        return "Apéritif, Fruits de mer, Desserts, Foie gras";
    }
    if (regionLower.includes('alsace')) {
        return "Choucroute, Tarte flambée, Poisson, Fromage de Munster";
    }
    if (regionLower.includes('loire')) {
        return "Poisson, Fruits de mer, Fromage de chèvre, Rillettes";
    }
    if (regionLower.includes('rhône')) {
        return "Viandes grillées, Gibier, Plats épicés, Daube, Tapenade";
    }
    if (regionLower.includes('provence')) {
        return "Bouillabaisse, Ratatouille, Aïoli, Tapenade, Socca";
    }
    if (regionLower.includes('espagne') || regionLower.includes('spain')) {
        return "Tapas, Paella, Jamón ibérique, Plats épicés";
    }
    if (regionLower.includes('italie') || regionLower.includes('italy')) {
        return "Pâtes, Pizza, Viandes rouges, Fromages italiens, Antipasti";
    }
    
    return "Viandes, Fromages, Plats variés";
}

/**
 * Obtenir la température de service selon le cépage ou la région
 */
function getTemperature(grapes, region) {
    if (!grapes && !region) {
        return "10-12°C";
    }
    
    const grapesLower = grapes ? grapes.toLowerCase() : '';
    const regionLower = region ? region.toLowerCase() : '';
    
    // Températures par cépage
    if (grapesLower.includes('cabernet sauvignon') || grapesLower.includes('syrah') || 
        grapesLower.includes('malbec') || grapesLower.includes('tempranillo') || 
        grapesLower.includes('sangiovese') || grapesLower.includes('barbera') || 
        grapesLower.includes('nebbiolo') || grapesLower.includes('merlot')) {
        return "16-18°C";
    }
    if (grapesLower.includes('pinot noir') || grapesLower.includes('grenache')) {
        return "14-16°C";
    }
    if (grapesLower.includes('chardonnay') || grapesLower.includes('viognier') || 
        grapesLower.includes('pinot gris') || grapesLower.includes('pinot blanc')) {
        return "10-12°C";
    }
    if (grapesLower.includes('sauvignon blanc') || grapesLower.includes('riesling') || 
        grapesLower.includes('gewürztraminer') || grapesLower.includes('muscat') || 
        grapesLower.includes('chenin blanc')) {
        return "8-10°C";
    }
    if (grapesLower.includes('champagne') || grapesLower.includes('prosecco') || 
        grapesLower.includes('cava') || grapesLower.includes('rosé')) {
        return "6-8°C";
    }
    
    // Températures par région
    if (regionLower.includes('bordeaux') || regionLower.includes('rhône')) {
        return "16-18°C";
    }
    if (regionLower.includes('bourgogne')) {
        return "14-16°C";
    }
    if (regionLower.includes('alsace') || regionLower.includes('loire')) {
        return "10-12°C";
    }
    if (regionLower.includes('champagne')) {
        return "6-8°C";
    }
    
    return "10-12°C";
}

/**
 * Retourner des informations par défaut
 */
function getFallbackBottleInfo(reason) {
    const currentYear = new Date().getFullYear();
    return {
        name: "Vin inconnu",
        year: null,
        grapes: null,
        region: null,
        appellation: null,
        producer: null,
        country: null,
        alcohol: null,
        drinkFrom: currentYear,
        drinkTo: currentYear + 5,
        foodPairing: "Viandes, Fromages, Plats variés",
        temperature: "10-12°C",
        analysisMethod: `Fallback - ${reason}`
    };
}

module.exports = {
    analyzeBottleWithMistralOnly,
    analyzeWithManualText,
    getFallbackBottleInfo,
    parseMistralResponse,
    completeBottleInfo,
    calculateDrinkPeriod,
    getAgingPotential,
    getFoodPairing,
    getTemperature
};
