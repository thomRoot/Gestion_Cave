// mistralAnalyzer.js - Analyseur de bouteilles de vin avec Google Vision + Mistral AI
// Version 1.2 - NOUVEAU WORKFLOW : Google Vision (nom + année) → Mistral (complétion des champs)

const mistralConfig = require("./mistralConfig");
const googleVision = require("./googleVision");
const mistralAI = require("./mistralAI");

// Importer callMistral depuis mistralAI
const { callMistral } = mistralAI;

// Vérifier que callMistral est bien défini
if (typeof callMistral !== 'function') {
    console.error('[MistralAnalyzer] callMistral is not defined!');
    console.error('[MistralAnalyzer] Available functions in mistralAI:', Object.keys(mistralAI));
}

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
 * Analyse du texte avec Mistral AI pour compléter les informations de la bouteille
 * NOUVEAU : Reçoit le nom et l'année, et complète les autres champs
 * @param {string} name - Nom de la bouteille
 * @param {number|null} year - Année de la bouteille
 * @returns {Promise<Object|null>} - Résultat de l'analyse
 */
async function analyzeBottleWithMistral(name, year) {
    if (!name || !name.trim()) {
        return null;
    }

    // NOUVEAU PROMPT : On fournit le nom et l'année, Mistral complète les autres champs
    const prompt = `Tu es un expert en vin. J'ai une bouteille avec les informations suivantes :
    - Nom : "${name}"
    ${year ? `- Année : ${year}` : ''}

    Complète TOUTES les informations manquantes pour cette bouteille avec tes connaissances sur les vins.
    Retourne UNIQUEMENT un objet JSON valide avec TOUS ces champs (même si null) :
    {
        "name": "${name}",
        "year": ${year || 'null'},
        "grapes": "Cépage(s) principal(aux) (ex: Cabernet Sauvignon, Merlot)",
        "region": "Région ou appellation (ex: Bordeaux, Bourgogne)",
        "appellation": "Appellation officielle (ex: Pauillac, Saint-Émilion)",
        "producer": "Producteur ou domaine (ex: Château Margaux)",
        "country": "Pays (ex: France, Italie)",
        "alcohol": 13.5, // Degré d'alcool (nombre ou null)
        "drinkFrom": 2025, // Année de début de consommation optimale (nombre ou null)
        "drinkTo": 2035, // Année de fin de consommation optimale (nombre ou null)
        "foodPairing": "Accords mets-vins (ex: Viandes rouges, Fromages)",
        "temperature": "Température de service (ex: 16-18°C)"
    }
    Règles strictes :
    - Si une information n'est pas connue, utilise null.
    - Les champs "year", "alcohol", "drinkFrom", "drinkTo" doivent être des nombres ou null.
    - Pour drinkFrom et drinkTo : estime la période optimale de consommation en fonction de l'année et du type de vin.
    - Pour foodPairing : propose des accords mets-vins typiques pour ce type de vin.
    - Pour temperature : indique la température de service idéale.
    - Ne réponds JAMAIS autre chose que le JSON.`;

    try {
        const response = await callMistral(prompt, mistralConfig.analysisSystemPrompt);

        // Nettoyer la réponse
        let cleanedResponse = response.trim();
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '');
        cleanedResponse = cleanedResponse.replace(/```\s*$/, '');
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '');

        // Extraire le JSON
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const result = JSON.parse(jsonMatch[0]);
                // Forcer tous les champs à exister et nettoyer les valeurs
                return {
                    name: result.name || name || null,
                    year: result.year !== undefined ? (result.year === null ? null : parseInt(result.year)) : (year || null),
                    grapes: result.grapes || null,
                    region: result.region || null,
                    appellation: result.appellation || null,
                    producer: result.producer || null,
                    country: result.country || null,
                    alcohol: result.alcohol !== undefined ? (result.alcohol === null ? null : parseFloat(result.alcohol)) : null,
                    drinkFrom: result.drinkFrom !== undefined ? (result.drinkFrom === null ? null : parseInt(result.drinkFrom)) : null,
                    drinkTo: result.drinkTo !== undefined ? (result.drinkTo === null ? null : parseInt(result.drinkTo)) : null,
                    foodPairing: result.foodPairing || null,
                    temperature: result.temperature || null
                };
            } catch (e) {
                console.error("Erreur de parsing JSON :", e);
                return null;
            }
        }
        return null;
    } catch (error) {
        console.error("Erreur Mistral :", error.message);
        return null;
    }
}

/**
 * Analyse du texte avec Mistral AI (ancienne version pour compatibilité)
 * @param {string} text - Texte à analyser
 * @returns {Promise<Object|null>} - Résultat de l'analyse
 */
async function analyzeLabelTextWithMistral(text) {
    if (!text || !text.trim()) {
        return null;
    }

    // Ancien prompt pour compatibilité
    const prompt = `Tu es un expert en vin. Analyse ce texte d'étiquette de vin et extrais TOUTES les informations possibles.
    Texte de l'étiquette : """${text}"""

    Retourne UNIQUEMENT un objet JSON valide avec TOUS ces champs (même si null) :
    {
        "name": "Nom du vin ou du domaine (ex: Château Margaux)",
        "year": 2020, // Année (nombre entier ou null)
        "grapes": "Cépage(s) principal(aux) (ex: Cabernet Sauvignon, Merlot)",
        "region": "Région ou appellation (ex: Bordeaux, Bourgogne)",
        "appellation": "Appellation officielle (ex: Pauillac, Saint-Émilion)",
        "producer": "Producteur ou domaine (ex: Château Margaux)",
        "country": "Pays (ex: France, Italie)",
        "alcohol": 13.5, // Degré d'alcool (nombre ou null)
        "drinkFrom": 2025, // Année de début de consommation (nombre ou null)
        "drinkTo": 2035, // Année de fin de consommation (nombre ou null)
        "foodPairing": "Accords mets-vins (ex: Viandes rouges, Fromages)",
        "temperature": "Température de service (ex: 16-18°C)"
    }
    Règles :
    - Si une information n'est pas présente dans le texte, utilise null.
    - Les champs "year", "alcohol", "drinkFrom", "drinkTo" doivent être des nombres ou null.
    - Ne réponds JAMAIS autre chose que le JSON.`;

    try {
        const response = await callMistral(prompt, mistralConfig.analysisSystemPrompt);

        // Nettoyer la réponse
        let cleanedResponse = response.trim();
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '');
        cleanedResponse = cleanedResponse.replace(/```\s*$/, '');
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '');

        // Extraire le JSON
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const result = JSON.parse(jsonMatch[0]);
                return {
                    name: result.name || null,
                    year: result.year !== undefined ? (result.year === null ? null : parseInt(result.year)) : null,
                    grapes: result.grapes || null,
                    region: result.region || null,
                    appellation: result.appellation || null,
                    producer: result.producer || null,
                    country: result.country || null,
                    alcohol: result.alcohol !== undefined ? (result.alcohol === null ? null : parseFloat(result.alcohol)) : null,
                    drinkFrom: result.drinkFrom !== undefined ? (result.drinkFrom === null ? null : parseInt(result.drinkFrom)) : null,
                    drinkTo: result.drinkTo !== undefined ? (result.drinkTo === null ? null : parseInt(result.drinkTo)) : null,
                    foodPairing: result.foodPairing || null,
                    temperature: result.temperature || null
                };
            } catch (e) {
                console.error("Erreur de parsing JSON :", e);
                return null;
            }
        }
        return null;
    } catch (error) {
        console.error("Erreur Mistral :", error.message);
        return null;
    }
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
 * NOUVEAU WORKFLOW : Analyse une bouteille avec Google Vision + Mistral AI
 * Étape 1 : Google Vision extrait le nom et l'année
 * Étape 2 : Mistral complète les autres champs (cépage, période, accords, température)
 * @param {string|null} imagePathOrBase64 - Chemin de l'image ou base64
 * @param {boolean} isBase64 - Si true, imagePathOrBase64 est en base64
 * @param {Object|null} manualData - Données manuelles {name, year} si Google Vision échoue
 * @returns {Promise<Object>} - Résultat complet de l'analyse
 */
async function analyzeBottleWithTwoStepProcess(imagePathOrBase64, isBase64 = false, manualData = null) {
    if (!mistralConfig.apiKey) {
        return {
            ...getFallbackBottleInfo("Mistral AI non configurée - Ajoutez MISTRAL_API_KEY dans .env"),
            requiresManualInput: false,
            googleVisionAvailable: googleVision.isGoogleVisionConfigured()
        };
    }
    
    const googleVisionAvailable = googleVision.isGoogleVisionConfigured();
    let name = null;
    let year = null;
    let rawText = null;
    let analysisMethod = "";
    
    try {
        // ÉTAPE 1 : Extraire le nom et l'année avec Google Vision
        if (imagePathOrBase64 && googleVisionAvailable) {
            try {
                const visionResult = await googleVision.analyzeBottleForNameAndYear(imagePathOrBase64, isBase64);
                if (visionResult.success) {
                    name = visionResult.name;
                    year = visionResult.year;
                    rawText = visionResult.rawText;
                    analysisMethod = "Google Vision + Mistral AI";
                } else {
                    console.warn("Google Vision n'a pas pu extraire le nom/année :", visionResult.error);
                    analysisMethod = "Mistral AI (sans OCR)";
                }
            } catch (visionError) {
                console.warn("Erreur Google Vision :", visionError.message);
                analysisMethod = "Mistral AI (sans OCR)";
            }
        } else if (!googleVisionAvailable) {
            analysisMethod = "Mistral AI (sans OCR)";
        }
        
        // Si on a des données manuelles, les utiliser
        if (manualData) {
            if (manualData.name) {
                name = manualData.name;
            }
            // TOUJOURS utiliser l'année manuelle si fournie (même si name est vide)
            if (manualData.year !== undefined && manualData.year !== null && manualData.year !== '') {
                year = parseInt(manualData.year);
            }
            if (analysisMethod) {
                analysisMethod += " + Saisie manuelle";
            } else {
                analysisMethod = "Saisie manuelle + Mistral AI";
            }
        }
        
        // ÉTAPE 2 : Compléter avec Mistral AI
        let bottleInfo = null;
        if (name) {
            bottleInfo = await analyzeBottleWithMistral(name, year);
        } else if (rawText) {
            // Fallback : analyser le texte brut avec l'ancien système
            bottleInfo = await analyzeLabelTextWithMistral(rawText);
        }
        
        // Si on n'a toujours pas d'info, essayer avec un prompt générique
        if (!bottleInfo && imagePathOrBase64) {
            console.log("Tentative d'analyse avec Mistral uniquement (sans OCR)");
            const genericText = "Analyse cette bouteille de vin et extrais toutes les informations possibles : nom, année, cépage, région, appellation, producteur, pays, degré d'alcool, période de consommation, accords mets-vins, température de service.";
            bottleInfo = await analyzeLabelTextWithMistral(genericText);
        }
        
        if (!bottleInfo) {
            return {
                ...getFallbackBottleInfo("Aucune information extraite"),
                requiresManualInput: !name || !year,
                missingFields: {
                    name: !name,
                    year: !year
                },
                partialData: { name, year },
                analysisMethod,
                googleVisionAvailable
            };
        }
        
        const completeInfo = completeBottleInfo(bottleInfo);
        
        // Vérifier si l'année est manquante dans les résultats finaux
        const finalYear = completeInfo.year;
        const finalName = completeInfo.name;
        const hasMissingFields = !finalName || !finalYear;
        
        return {
            ...completeInfo,
            analysisMethod,
            extractedText: rawText,
            mistralAvailable: true,
            googleVisionAvailable,
            requiresManualInput: hasMissingFields,
            missingFields: hasMissingFields ? {
                name: !finalName,
                year: !finalYear
            } : null,
            partialData: hasMissingFields ? { name: finalName, year: finalYear } : null
        };
    } catch (error) {
        return {
            ...getFallbackBottleInfo(`Erreur: ${error.message}`),
            requiresManualInput: !name || !year,
            missingFields: {
                name: !name,
                year: !year
            },
            partialData: { name, year },
            analysisMethod,
            googleVisionAvailable
        };
    }
}

/**
 * Analyse une bouteille avec Google Vision + Mistral AI (ancienne version pour compatibilité)
 * @param {string|null} imagePathOrBase64 - Chemin de l'image ou base64
 * @param {boolean} isBase64 - Si true, imagePathOrBase64 est en base64
 * @returns {Promise<Object>} - Résultat complet de l'analyse
 */
async function analyzeBottleWithMistralOnly(imagePathOrBase64, isBase64 = false) {
    if (!mistralConfig.apiKey) {
        return getFallbackBottleInfo("Mistral AI non configurée - Ajoutez MISTRAL_API_KEY dans .env");
    }
    
    const googleVisionAvailable = googleVision.isGoogleVisionConfigured();
    
    try {
        let labelText = null;
        if (imagePathOrBase64) {
            if (googleVisionAvailable) {
                try {
                    labelText = await googleVision.getCleanedLabelText(imagePathOrBase64, isBase64);
                } catch (visionError) {
                    console.warn("OCR échoué, tentative avec Mistral uniquement :", visionError.message);
                    labelText = "Image de bouteille de vin à analyser";
                }
            } else {
                console.warn("Google Vision non configuré, analyse avec Mistral uniquement");
                labelText = "Analyse cette image de bouteille de vin et extrais toutes les informations possibles.";
            }
        }
        
        let bottleInfo = null;
        if (labelText && labelText.trim()) {
            bottleInfo = await analyzeLabelTextWithMistral(labelText);
        }
        
        if (!bottleInfo && imagePathOrBase64) {
            console.log("Tentative d'analyse avec Mistral uniquement (sans OCR)");
            const genericText = "Analyse cette bouteille de vin et extrais toutes les informations possibles : nom, année, cépage, région, appellation, producteur, pays, degré d'alcool, période de consommation, accords mets-vins, température de service.";
            bottleInfo = await analyzeLabelTextWithMistral(genericText);
        }
        
        if (!bottleInfo) {
            return getFallbackBottleInfo("Aucune information extraite");
        }
        
        const completeInfo = completeBottleInfo(bottleInfo);
        return {
            ...completeInfo,
            analysisMethod: labelText ? (googleVisionAvailable ? "Google Vision + Mistral AI" : "Mistral AI (sans OCR)") : "Mistral AI (analyse générique)",
            extractedText: labelText,
            mistralAvailable: true,
            googleVisionAvailable: googleVisionAvailable
        };
    } catch (error) {
        return getFallbackBottleInfo(`Erreur: ${error.message}`);
    }
}

module.exports = {
    analyzeBottleWithMistralOnly,
    analyzeBottleWithTwoStepProcess,
    getFallbackBottleInfo,
    analyzeLabelTextWithMistral,
    analyzeBottleWithMistral,
    completeBottleInfo,
    analyzeWithManualText
};