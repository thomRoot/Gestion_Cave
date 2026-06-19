// mistralAnalyzer.js - Analyseur de bouteilles de vin avec Google Vision + Mistral AI
// Version 6.0.2 - Complete avec toutes les fonctions

const mistralConfig = require("./mistralConfig");
const googleVision = require("./googleVision");
const mistralAI = require("./mistralAI");

async function analyzeBottleWithMistralOnly(imagePathOrBase64, isBase64 = false) {
    if (!mistralConfig.apiKey) {
        return getFallbackBottleInfo("Mistral AI non configure");
    }
    if (imagePathOrBase64 && !googleVision.isGoogleVisionConfigured()) {
        return getFallbackBottleInfo("Google Vision non configure");
    }
    try {
        let labelText = null;
        if (imagePathOrBase64) {
            try {
                labelText = await googleVision.getCleanedLabelText(imagePathOrBase64, isBase64);
            } catch (visionError) {
                return getFallbackBottleInfo("OCR echouee: " + visionError.message);
            }
        }
        let bottleInfo = null;
        if (labelText && labelText.trim()) {
            bottleInfo = await analyzeLabelTextWithMistral(labelText);
        }
        if (!bottleInfo) {
            return getFallbackBottleInfo("Aucun texte detecte");
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