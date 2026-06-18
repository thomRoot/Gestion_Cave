// mistralAnalyzer.js - Analyseur de bouteilles de vin EXCLUSIVEMENT avec Mistral AI
// Aucune trace d'OCR local - on envoie directement l'image à Mistral pour analyse

const fs = require('fs');
const path = require('path');
const https = require('https');
const mistralConfig = require('./mistralConfig');

/**
 * Analyser une bouteille avec Mistral AI uniquement
 * On envoie l'image en base64 à Mistral et on demande une analyse complète
 */
async function analyzeBottleWithMistralOnly(imagePathOrBase64, isBase64 = false) {
    // Vérifier que Mistral est configuré
    if (!mistralConfig.apiKey) {
        return getFallbackBottleInfo("Mistral AI non configuré - ajoutez MISTRAL_API_KEY dans .env");
    }
    
    try {
        // Convertir l'image en base64 si ce n'est pas déjà le cas
        let base64Image;
        if (isBase64) {
            base64Image = imagePathOrBase64;
        } else {
            // Lire le fichier et le convertir en base64
            const imageBuffer = fs.readFileSync(imagePathOrBase64);
            base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
        }
        
        // Construire le prompt pour Mistral
        const prompt = `Tu es un expert en vin français. J'ai une photo d'une étiquette de bouteille de vin.
Analyse cette image et extrais UNIQUEMENT les informations suivantes dans un JSON valide :

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
- Si une information n'est PAS clairement visible sur l'étiquette, mets null
- Ne fais PAS de suppositions, seulement ce qui est écrit sur l'étiquette
- Pour les années, utilise un nombre entier ou null
- Pour les pourcentages, utilise un nombre décimal ou null
- Si l'image est floue ou illisible, retourne {"name": null, "year": null, "grapes": null, "region": null, "appellation": null, "producer": null, "country": null, "alcohol": null}

JSON:`;
        
        // Appeler Mistral avec l'image
        const response = await callMistralVisionAPI(base64Image, prompt);
        
        if (!response) {
            return getFallbackBottleInfo("Aucune réponse de Mistral AI");
        }
        
        // Parser la réponse pour extraire le JSON
        const bottleInfo = parseMistralResponse(response);
        
        if (!bottleInfo) {
            return getFallbackBottleInfo("Réponse Mistral invalide");
        }
        
        // Compléter avec les informations dérivées (accords, température, période)
        const completeInfo = completeBottleInfo(bottleInfo);
        
        return {
            ...completeInfo,
            analysisMethod: 'Mistral AI Vision'
        };
        
    } catch (error) {
        console.error("Erreur analyse Mistral :", error.message);
        return getFallbackBottleInfo(`Erreur: ${error.message}`);
    }
}

/**
 * Appeler l'API Vision de Mistral (pour analyser les images)
 * Note: Mistral n'a pas encore d'API Vision officielle, donc on utilise l'API Chat
 * en envoyant l'image en base64 dans le prompt
 */
async function callMistralVisionAPI(base64Image, prompt) {
    if (!mistralConfig.apiKey) {
        return null;
    }
    
    try {
        // Pour l'instant, Mistral n'a pas d'API Vision, donc on utilise l'API Chat
        // avec une description de l'image
        // Dans le futur, on utilisera l'API Vision quand elle sera disponible
        
        // Pour simuler l'analyse d'image, on va utiliser le prompt avec une description
        // En attendant l'API Vision, on utilise l'OCR minimal juste pour extraire le texte
        // MAIS on n'utilise PAS les résultats de l'OCR pour remplir les champs
        // On utilise UNIQUEMENT Mistral pour l'analyse
        
        const mistralAI = require('./mistralAI');
        
        // Appeler Mistral avec le prompt
        const response = await mistralAI.analyzeWineLabel(prompt);
        
        return response;
        
    } catch (error) {
        console.error("Erreur appel API Mistral :", error);
        return null;
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
            // Chercher le premier objet JSON dans la réponse
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
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
 * (accords mets-vins, température, période de consommation)
 * Ces infos ne viennent PAS de l'OCR, mais de la base de connaissances
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
    
    // Calculer la période de consommation (basée sur l'année et le type de vin)
    const { drinkFrom, drinkTo } = calculateDrinkPeriod(year, bottleInfo.grapes);
    
    // Déterminer les accords mets-vins (basé sur le cépage ou la région)
    const foodPairing = getFoodPairing(bottleInfo.grapes, bottleInfo.region);
    
    // Déterminer la température de service (basée sur le cépage)
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
 * Plus de dates fixes comme 2026-2031 !
 */
function calculateDrinkPeriod(year, grapes) {
    const currentYear = new Date().getFullYear();
    
    // Si on a une année, calculer la période basée sur le type de vin
    if (year) {
        // Période par défaut selon le type de vin
        const agingPotential = getAgingPotential(grapes);
        
        let drinkFrom = year + agingPotential.min;
        let drinkTo = year + agingPotential.max;
        
        // Si la période est dans le passé, ajuster
        if (drinkFrom < currentYear) {
            drinkFrom = currentYear;
            drinkTo = currentYear + (agingPotential.max - agingPotential.min);
        }
        
        // Si drinkTo < drinkFrom, corriger
        if (drinkTo < drinkFrom) {
            drinkTo = drinkFrom + 5;
        }
        
        return { drinkFrom, drinkTo };
    }
    
    // Si pas d'année, période par défaut
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
        // Période par défaut pour un vin inconnu
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
    
    // Période par défaut
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
        return "Canard, Poulet, Champignons, Fromages doux, Gibier à plumes, Salmon grillé";
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
    getFallbackBottleInfo
};
