// mistralAnalyzer.js - Version 6.0.0
const mistralConfig = require("./mistralConfig");
const googleVision = require("./googleVision");
const mistralAI = require("./mistralAI");

async function analyzeBottleWithMistralOnly(imagePathOrBase64, isBase64 = false) {
    if (!mistralConfig.apiKey) {
        return getFallbackBottleInfo("Mistral AI non configuré");
    }
    if (imagePathOrBase64 && !googleVision.isGoogleVisionConfigured()) {
        return getFallbackBottleInfo("Google Vision non configuré");
    }
    try {
        let labelText = null;
        if (imagePathOrBase64) {
            try {
                labelText = await googleVision.getCleanedLabelText(imagePathOrBase64, isBase64);
            } catch (visionError) {
                return getFallbackBottleInfo("OCR échoué: " + visionError.message);
            }
        }
        let bottleInfo = null;
        if (labelText && labelText.trim()) {
            bottleInfo = await analyzeLabelTextWithMistral(labelText);
        }
        if (!bottleInfo) {
            return getFallbackBottleInfo("Aucun texte détecté");
        }
        const completeInfo = completeBottleInfo(bottleInfo);
        return {
            ...completeInfo,
            analysisMethod: labelText ? "Google Vision + Mistral AI" : "Mistral AI",
            extractedText: labelText
        };
    } catch (error) {
        return getFallbackBottleInfo("Erreur: " + error.message);
    }
}

function getFallbackBottleInfo(reason) {
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
        analysisMethod: "Echec - " + reason,
        error: reason
    };
}

module.exports = { analyzeBottleWithMistralOnly, getFallbackBottleInfo };