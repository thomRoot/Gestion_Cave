// aiAnalyzer.js - Analyseur de bouteilles de vin avec Mistral AI
// Approche : OCR local pour extraire le texte, puis Mistral AI pour l'analyser intelligemment

const ai = require('./ai');
const mistralAI = require('./mistralAI');
const mistralConfig = require('./mistralConfig');

/**
 * Analyser une bouteille avec une approche robuste
 * 1. Extraire le texte avec OCR local (Tesseract.js)
 * 2. Nettoyer le texte
 * 3. Envoyer à Mistral AI pour analyse intelligente
 * 4. Valider et compléter les résultats
 * 5. Retourner toutes les informations
 */
async function analyzeBottleWithMistral(imagePathOrBase64, isBase64 = false) {
    try {
        let ocrText = '';
        
        // Étape 1 : Extraire le texte avec OCR local
        if (isBase64) {
            const ocrResult = await ai.analyzeBottleImageBase64(imagePathOrBase64);
            if (ocrResult && ocrResult.rawText) {
                ocrText = ocrResult.rawText;
            }
        } else {
            const ocrResult = await ai.analyzeBottleImage(imagePathOrBase64);
            if (ocrResult && ocrResult.rawText) {
                ocrText = ocrResult.rawText;
            }
        }
        
        // Si OCR a échoué, retourner des valeurs par défaut
        if (!ocrText || ocrText.trim().length < 10) {
            console.log("OCR a échoué ou texte trop court, utilisation des valeurs par défaut");
            return getDefaultBottleInfo();
        }
        
        // Étape 2 : Nettoyer le texte
        const cleanText = ai.cleanOCRText(ocrText);
        
        // Étape 3 : Si Mistral est disponible, utiliser l'API pour analyser
        if (mistralConfig.apiKey) {
            try {
                const mistralResult = await analyzeWithMistral(cleanText);
                if (mistralResult) {
                    // Étape 4 : Valider et compléter
                    const validatedResult = validateAndCompleteMistralResult(mistralResult, cleanText);
                    validatedResult.rawText = cleanText;
                    validatedResult.analysisMethod = 'OCR + Mistral AI';
                    return validatedResult;
                }
            } catch (mistralError) {
                console.error("Erreur Mistral AI :", mistralError.message);
            }
        }
        
        // Étape 5 : Fallback vers l'analyse locale améliorée
        console.log("Mistral non disponible, utilisation de l'analyse locale");
        const localResult = ai.extractBottleInfoFromText(cleanText);
        const improvedResult = ai.improveBottleInfoWithDatabase(localResult, cleanText);
        improvedResult.rawText = cleanText;
        improvedResult.analysisMethod = 'OCR Local + Base de données';
        
        return improvedResult;
        
    } catch (error) {
        console.error("Erreur analyse complète :", error);
        return getDefaultBottleInfo();
    }
}

/**
 * Analyser le texte avec Mistral AI
 */
async function analyzeWithMistral(text) {
    if (!mistralConfig.apiKey) {
        return null;
    }
    
    try {
        // Construire un prompt optimisé pour l'analyse d'étiquettes de vin
        const prompt = `Tu es un expert en vin. Analyse cette étiquette de bouteille de vin et extrais les informations suivantes dans un JSON VALIDE :

{
  "name": "nom complet du vin (ex: Château Margaux 2015)",
  "year": "année du millésime (nombre entre 1800 et 2100, ou null)",
  "grapes": "cépage ou cépages principaux (ex: Cabernet Sauvignon, ou null)",
  "region": "région viticole (ex: Bordeaux, Bourgogne, ou null)",
  "appellation": "appellation (AOC, IGP, Grand Cru, ou null)",
  "producer": "producteur/château/domaine (ex: Château Margaux, ou null)",
  "country": "pays (ex: France, Espagne, Italie, ou null)"
}

Texte de l'étiquette :
"""
${text}
"""

Règles STRICTES :
- Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire
- Si une information n'est pas présente ou incertaine, mets null
- Pour les noms, utilise le nom complet tel qu'il apparaît sur l'étiquette
- Pour les années, utilise un nombre entier ou null
- Ne fais PAS de suppositions, seulement ce qui est clairement visible dans le texte
- Si le texte est illisible ou ne contient pas d'informations sur le vin, retourne {"name": null, "year": null, "grapes": null, "region": null, "appellation": null, "producer": null, "country": null}

JSON:`;
        
        const response = await mistralAI.analyzeWineLabel(prompt);
        
        // Parser la réponse (Mistral retourne du texte, il faut extraire le JSON)
        if (response && typeof response === 'string') {
            try {
                // Extraire le JSON de la réponse
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
            } catch (parseError) {
                console.error("Erreur parsing JSON Mistral :", parseError);
            }
        }
        
        return response;
        
    } catch (error) {
        console.error("Erreur appel Mistral :", error);
        return null;
    }
}

/**
 * Valider et compléter les résultats de Mistral
 */
function validateAndCompleteMistralResult(mistralResult, ocrText) {
    const result = {
        name: null,
        year: null,
        grapes: null,
        region: null,
        drinkFrom: null,
        drinkTo: null,
        foodPairing: null,
        temperature: null,
        appellation: null,
        producer: null,
        country: null
    };
    
    // 1. Nom
    if (mistralResult.name) {
        result.name = cleanWineName(mistralResult.name);
    }
    
    // 2. Année
    if (mistralResult.year !== null && mistralResult.year !== undefined) {
        const year = parseInt(mistralResult.year);
        if (!isNaN(year) && year >= 1800 && year <= 2100) {
            result.year = year;
        }
    }
    
    // 3. Cépage
    if (mistralResult.grapes) {
        result.grapes = findBestGrapeMatch(mistralResult.grapes);
    }
    
    // 4. Région
    if (mistralResult.region) {
        result.region = findBestRegionMatch(mistralResult.region);
    }
    
    // 5. Appellation
    if (mistralResult.appellation) {
        result.appellation = mistralResult.appellation;
    }
    
    // 6. Producteur
    if (mistralResult.producer) {
        result.producer = mistralResult.producer;
    }
    
    // 7. Pays
    if (mistralResult.country) {
        result.country = mistralResult.country;
    }
    
    // 8. Compléter les accords mets-vins
    result.foodPairing = getFoodPairing(result.grapes, result.region);
    
    // 9. Compléter la température
    result.temperature = getTemperature(result.grapes, result.region);
    
    // 10. Compléter la période de consommation
    const period = getDrinkPeriod(result.year, result.grapes);
    result.drinkFrom = period.drinkFrom;
    result.drinkTo = period.drinkTo;
    
    // 11. Si le nom est toujours null, essayer de l'extraire du texte OCR
    if (!result.name && ocrText) {
        result.name = extractBestNameFromText(ocrText);
    }
    
    // 12. Si on a un producteur mais pas de nom, utiliser le producteur comme nom
    if (!result.name && result.producer) {
        result.name = result.producer;
    }
    
    // 13. Si on a un nom mais pas de producteur, essayer d'extraire le producteur
    if (result.name && !result.producer) {
        result.producer = extractProducerFromName(result.name);
    }
    
    return result;
}

/**
 * Nettoyer un nom de vin
 */
function cleanWineName(name) {
    if (!name) return null;
    
    // Supprimer les caractères spéciaux
    let cleaned = name
        .replace(/[^a-zA-Z0-9\s\-',]/g, '')
        .trim();
    
    // Supprimer les espaces multiples
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    // Si le nom est trop court ou invalide, retourner null
    if (cleaned.length < 3) {
        return null;
    }
    
    return cleaned;
}

/**
 * Trouver le meilleur cépage correspondant
 */
function findBestGrapeMatch(input) {
    if (!input) return null;
    
    const inputLower = input.toLowerCase().trim();
    
    // Vérifier l'exact match
    for (const grape of ai.WINE_DATABASE.grapes) {
        if (grape.toLowerCase() === inputLower) {
            return grape;
        }
    }
    
    // Vérifier si l'input contient un cépage
    for (const grape of ai.WINE_DATABASE.grapes) {
        if (inputLower.includes(grape.toLowerCase())) {
            return grape;
        }
    }
    
    // Vérifier si un cépage contient l'input
    for (const grape of ai.WINE_DATABASE.grapes) {
        if (grape.toLowerCase().includes(inputLower)) {
            return grape;
        }
    }
    
    // Si rien trouvé, retourner l'input nettoyé
    return input.charAt(0).toUpperCase() + input.slice(1);
}

/**
 * Trouver la meilleure région correspondante
 */
function findBestRegionMatch(input) {
    if (!input) return null;
    
    const inputLower = input.toLowerCase().trim();
    
    // Vérifier l'exact match
    for (const region of ai.WINE_DATABASE.regions) {
        if (region.toLowerCase() === inputLower) {
            return region;
        }
    }
    
    // Vérifier si l'input contient une région
    for (const region of ai.WINE_DATABASE.regions) {
        if (inputLower.includes(region.toLowerCase())) {
            return region;
        }
    }
    
    // Vérifier si une région contient l'input
    for (const region of ai.WINE_DATABASE.regions) {
        if (region.toLowerCase().includes(inputLower)) {
            return region;
        }
    }
    
    return input.charAt(0).toUpperCase() + input.slice(1);
}

/**
 * Extraire le meilleur nom du texte OCR
 */
function extractBestNameFromText(text) {
    if (!text) return null;
    
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Chercher des lignes qui ressemblent à des noms de vin
    for (const line of lines) {
        const cleanedLine = line.replace(/[^a-zA-Z0-9\s\-',]/g, '').trim();
        
        // Ignorer les lignes qui sont juste des années
        if (/^\d{4}$/.test(cleanedLine)) continue;
        
        // Ignorer les lignes trop courtes
        if (cleanedLine.length < 3) continue;
        
        // Ignorer les lignes qui sont juste des pourcentages ou des chiffres
        if (/^[0-9%°]+$/.test(cleanedLine)) continue;
        
        // Vérifier si la ligne contient des mots-clés de vin
        const wineKeywords = ['château', 'domaine', 'clos', 'cuvée', 'grand cru', 'premier cru', 'aoc', 'igp', 'vin de', 'appellation', 'cru'];
        const lineLower = cleanedLine.toLowerCase();
        
        for (const keyword of wineKeywords) {
            if (lineLower.includes(keyword)) {
                return cleanedLine;
            }
        }
        
        // Si la ligne a plus de 10 caractères et contient des espaces, c'est probablement un nom
        if (cleanedLine.length > 10 && cleanedLine.includes(' ')) {
            return cleanedLine;
        }
    }
    
    // Si rien trouvé, retourner la première ligne non vide
    if (lines.length > 0) {
        return lines[0].replace(/[^a-zA-Z0-9\s\-',]/g, '').trim();
    }
    
    return "Vin inconnu";
}

/**
 * Extraire le producteur du nom
 */
function extractProducerFromName(name) {
    if (!name) return null;
    
    const producerKeywords = ['Château', 'Domaine', 'Clos', 'Chai', 'Maison', 'Cave', 'Mas', 'Bastide', 'Prieuré', 'Abbaye'];
    
    for (const keyword of producerKeywords) {
        const regex = new RegExp(`(${keyword})\\s+([A-ZÉÈÊËÀÂÇÔÛÏÜa-zéèêëàâçôûïü\\s-]+)`, 'i');
        const match = name.match(regex);
        if (match) {
            return `${keyword} ${match[2]}`;
        }
    }
    
    return null;
}

/**
 * Obtenir les accords mets-vins
 */
function getFoodPairing(grapes, region) {
    if (grapes && ai.WINE_DATABASE.foodPairings[grapes]) {
        return ai.WINE_DATABASE.foodPairings[grapes].join(', ');
    }
    
    if (region) {
        const regionalPairings = {
            'Bordeaux': 'Bœuf, Agneau, Gibier, Fromage à pâte dure, Cassoulet',
            'Bourgogne': 'Canard, Poulet, Fromages affinés, Escargots, Bœuf bourguignon',
            'Champagne': 'Apéritif, Fruits de mer, Desserts, Foie gras',
            'Alsace': 'Choucroute, Tarte flambée, Poisson, Fromage de Munster',
            'Loire': 'Poisson, Fruits de mer, Fromage de chèvre, Rillettes',
            'Rhône': 'Viandes grillées, Gibier, Plats épicés, Daube, Tapenade',
            'Provence': 'Bouillabaisse, Ratatouille, Aïoli, Tapenade, Socca',
            'Languedoc': 'Cassoulet, Tielles, Roquefort, Agneau de Sisteron',
            'Roussillon': 'Catalane, Anchoïs, Charcuterie, Fromages de brebis'
        };
        return regionalPairings[region] || 'Viandes, Fromages, Plats variés';
    }
    
    return 'Viandes, Fromages, Plats variés';
}

/**
 * Obtenir la température de service
 */
function getTemperature(grapes, region) {
    if (grapes && ai.WINE_DATABASE.temperatures[grapes]) {
        return ai.WINE_DATABASE.temperatures[grapes];
    }
    
    // Température par défaut selon le type
    const redWineGrapes = ['Cabernet Sauvignon', 'Merlot', 'Pinot Noir', 'Syrah', 'Grenache', 'Malbec', 'Tempranillo', 'Sangiovese', 'Barbera', 'Nebbiolo'];
    if (grapes && redWineGrapes.includes(grapes)) {
        return '16-18°C';
    }
    
    return '10-12°C';
}

/**
 * Obtenir la période de consommation
 */
function getDrinkPeriod(year, grapes) {
    const currentYear = new Date().getFullYear();
    
    if (year && grapes && ai.WINE_DATABASE.agingPotential[grapes]) {
        const aging = ai.WINE_DATABASE.agingPotential[grapes];
        let drinkFrom = year + aging.min;
        let drinkTo = year + aging.max;
        
        if (drinkFrom < currentYear) {
            drinkFrom = currentYear;
        }
        if (drinkTo < drinkFrom) {
            drinkTo = drinkFrom + 5;
        }
        
        return { drinkFrom, drinkTo };
    }
    
    if (year) {
        let drinkFrom = year + 3;
        let drinkTo = year + 10;
        
        if (drinkFrom < currentYear) {
            drinkFrom = currentYear;
        }
        if (drinkTo < drinkFrom) {
            drinkTo = drinkFrom + 5;
        }
        
        return { drinkFrom, drinkTo };
    }
    
    return { drinkFrom: currentYear, drinkTo: currentYear + 5 };
}

/**
 * Retourner des informations par défaut
 */
function getDefaultBottleInfo() {
    const currentYear = new Date().getFullYear();
    return {
        name: "Vin inconnu",
        year: null,
        grapes: null,
        region: null,
        drinkFrom: currentYear,
        drinkTo: currentYear + 5,
        foodPairing: "Viandes, Fromages, Plats variés",
        temperature: "10-12°C",
        appellation: null,
        producer: null,
        country: null,
        analysisMethod: 'Fallback'
    };
}

module.exports = {
    analyzeBottleWithMistral,
    analyzeWithMistral,
    validateAndCompleteMistralResult,
    getDefaultBottleInfo
};
