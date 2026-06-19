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

async function analyzeLabelTextWithMistral(labelText) {
    const prompt = "Tu es un expert en vin. Analyse ce texte: """" + labelText + """" et extrais UNIQUEMENT un JSON avec: name, year, grapes, region, appellation, producer, country, alcohol. Tous null si non visible. JSON:";
    try {
        const response = await mistralAI.callMistral(prompt, mistralConfig.analysisSystemPrompt);
        if (!response) return null;
        return parseMistralResponse(response);
    } catch (error) {
        return null;
    }
}

async function analyzeWithManualText(manualData) {
    const { name, year, grapes, region } = manualData;
    const textParts = [];
    if (name) textParts.push("Nom: " + name);
    if (year) textParts.push("Annee: " + year);
    if (grapes) textParts.push("Cepage: " + grapes);
    if (region) textParts.push("Region: " + region);
    const text = textParts.join("
");
    if (!text) return getFallbackBottleInfo("Aucune donnee");
    try {
        const bottleInfo = await analyzeLabelTextWithMistral(text);
        if (!bottleInfo) return getFallbackBottleInfo("Analyse echouee");
        const completeInfo = completeBottleInfo(bottleInfo);
        return { ...completeInfo, analysisMethod: "Mistral AI (texte manuel)" };
    } catch (error) {
        return getFallbackBottleInfo("Erreur: " + error.message);
    }
}