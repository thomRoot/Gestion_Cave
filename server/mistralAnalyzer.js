// mistralAnalyzer.js - Analyseur de bouteilles de vin avec Google Vision + Mistral AI
// Version 6.0.3 - CORRIGÉE : Toutes les fonctions manquantes ajoutées

const mistralConfig = require("./mistralConfig");
const googleVision = require("./googleVision");
const mistralAI = require("./mistralAI");

/**
 * Retourne des informations par défaut pour une bouteille en cas d'erreur
 * @param {string} errorMessage - Message d'erreur
 * @returns {Object} - Objet bouteille avec valeurs null
 */
function getFallbackBottleInfo(errorMessage) {
    console.warn(`[MistralAnalyzer] Fallback: ${errorMessage}`);
    return {
        name: null,
        year: null,
        grapes: null,
        region: null,
        appellation: null,
        producer: null,
        country: null,
        alcohol: null,
        drinkFrom: null,
        drinkTo: null,
        foodPairing: null,
        temperature: null,
        photo: null,
        analysisMethod: "Fallback (erreur)",
        extractedText: null,
        error: errorMessage || "Erreur inconnue"
    };
}

/**
 * Complète les informations de la bouteille avec des valeurs par défaut
 * @param {Object} bottleInfo - Informations de la bouteille depuis Mistral
 * @returns {Object} - Informations complètes
 */
function completeBottleInfo(bottleInfo) {
    if (!bottleInfo) {
        return getFallbackBottleInfo("Aucune information de bouteille");
    }
    
    return {
        name: bottleInfo.name || null,
        year: bottleInfo.year ? parseInt(bottleInfo.year) : null,
        grapes: bottleInfo.grapes || null,
        region: bottleInfo.region || bottleInfo.appellation || null,
        appellation: bottleInfo.appellation || null,
        producer: bottleInfo.producer || null,
        country: bottleInfo.country || null,
        alcohol: bottleInfo.alcohol ? parseFloat(bottleInfo.alcohol) : null,
        drinkFrom: bottleInfo.drinkFrom ? parseInt(bottleInfo.drinkFrom) : null,
        drinkTo: bottleInfo.drinkTo ? parseInt(bottleInfo.drinkTo) : null,
        foodPairing: bottleInfo.foodPairing || null,
        temperature: bottleInfo.temperature || null
    };
}

/**
 * Analyse du texte avec Mistral AI
 * @param {string} text - Texte à analyser
 * @returns {Promise<Object|null>} - Résultat de l'analyse
 */
async function analyzeLabelTextWithMistral(text) {
    if (!text || !text.trim()) {
        return null;
    }
    return mistralAI.analyzeWineLabel(text);
}

/**
 * Analyse une bouteille avec texte manuel (sans image)
 * @param {Object} manualData - Données manuelles {name, year, grapes, region}
 * @returns {Promise<Object>} - Informations de la bouteille
 */
async function analyzeWithManualText(manualData) {
    const { name, year, grapes, region } = manualData;
    const text = `${name || ''} ${year || ''} ${grapes || ''} ${region || ''}`;
    
    if (!text.trim()) {
        return getFallbackBottleInfo("Aucun texte à analyser");
    }
    
    try {
        const bottleInfo = await analyzeLabelTextWithMistral(text);
        if (!bottleInfo) {
            return getFallbackBottleInfo("Aucune information extraite du texte");
        }
        return completeBottleInfo(bottleInfo);
    } catch (error) {
        return getFallbackBottleInfo(error.message);
    }
}

/**
 * Analyse une bouteille avec Google Vision + Mistral AI
 * @param {string|null} imagePathOrBase64 - Chemin de l'image ou base64
 * @param {boolean} isBase64 - Si true, imagePathOrBase64 est en base64
 * @returns {Promise<Object>} - Résultat complet de l'analyse
 */
async function analyzeBottleWithMistralOnly(imagePathOrBase64, isBase64 = false) {
    if (!mistralConfig.apiKey) {
        return getFallbackBottleInfo("Mistral AI non configurée - Ajoutez MISTRAL_API_KEY dans .env");
    }
    
    if (imagePathOrBase64 && !googleVision.isGoogleVisionConfigured()) {
        return getFallbackBottleInfo("Google Vision non configurée - Ajoutez GOOGLE_VISION_API_KEY dans .env");
    }
    
    try {
        let labelText = null;
        if (imagePathOrBase64) {
            try {
                labelText = await googleVision.getCleanedLabelText(imagePathOrBase64, isBase64);
            } catch (visionError) {
                return getFallbackBottleInfo(`OCR échouée: ${visionError.message}`);
            }
        }
        
        let bottleInfo = null;
        if (labelText && labelText.trim()) {
            bottleInfo = await analyzeLabelTextWithMistral(labelText);
        }
        
        if (!bottleInfo) {
            return getFallbackBottleInfo("Aucun texte détecté ou analysé");
        }
        
        const completeInfo = completeBottleInfo(bottleInfo);
        return {
            ...completeInfo,
            analysisMethod: labelText ? "Google Vision + Mistral AI" : "Mistral AI",
            extractedText: labelText
        };
    } catch (error) {
        return getFallbackBottleInfo(`Erreur: ${error.message}`);
    }
}

module.exports = {
    analyzeBottleWithMistralOnly,
    getFallbackBottleInfo,
    analyzeLabelTextWithMistral,
    completeBottleInfo,
    analyzeWithManualText
};