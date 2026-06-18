// ai.js - Intelligence Artificielle locale pour la reconnaissance de bouteilles de vin
// Cette version utilise une approche hybride :
// 1. Reconnaissance OCR locale pour extraire le texte de l'étiquette
// 2. Analyse sémantique pour identifier les informations du vin
// 3. Base de connaissances intégrée pour les accords mets-vins

const fs = require('fs');
const path = require('path');
const { createWorker } = require('tesseract.js');

// Base de connaissances des vins
const WINE_DATABASE = {
    // Cépages
    grapes: [
        'Cabernet Sauvignon', 'Merlot', 'Pinot Noir', 'Chardonnay', 'Sauvignon Blanc',
        'Syrah', 'Grenache', 'Viognier', 'Riesling', 'Gewürztraminer', 'Chenin Blanc',
        'Gamay', 'Malbec', 'Tempranillo', 'Sangiovese', 'Barbera', 'Nebbiolo',
        'Carignan', 'Cinsault', 'Mourvèdre', 'Pinot Gris', 'Pinot Blanc',
        'Muscat', 'Marsanne', 'Roussanne', 'Trollinger', 'Lemberger'
    ],
    
    // Régions
    regions: [
        'Bordeaux', 'Bourgogne', 'Champagne', 'Loire', 'Alsace', 'Rhône',
        'Provence', 'Languedoc', 'Roussillon', 'Beaujolais', 'Jura', 'Savoie',
        'Côtes du Rhône', 'Saint-Émilion', 'Pomerol', 'Margaux', 'Pauillac',
        'Médoc', 'Graves', 'Sauternes', 'Côte de Nuits', 'Côte de Beaune',
        'Chablis', 'Côte Rôtie', 'Hermitage', 'Crozes-Hermitage', 'Cornas',
        'Gigondas', 'Vacqueyras', 'Bandol', 'Cassis', 'Bellet', 'Cahors',
        'Madiran', 'Pacherenc', 'Irouléguy', 'Muscadet', 'Anjou', 'Saumur'
    ],
    
    // Appellations
    appellations: [
        'AOC', 'IGP', 'Vin de France', 'Vin de Pays', 'Grand Cru', 'Premier Cru',
        'Cru Bourgeois', 'Cru Classé', 'Château', 'Domaine', 'Cuvée', 'Clos'
    ],
    
    // Accords mets-vins par cépage
    foodPairings: {
        'Cabernet Sauvignon': ['Bœuf grillé', 'Agneau', 'Gibier', 'Fromage à pâte dure', 'Plats épicés', 'Viandes rouges', 'Cassoulet'],
        'Merlot': ['Canard', 'Agneau', 'Viandes rouges', 'Fromages affinés', 'Plats en sauce', 'Charcuterie', 'Pâtes aux champignons'],
        'Pinot Noir': ['Canard', 'Poulet', 'Champignons', 'Fromages doux', 'Gibier à plumes', 'Salmon grillé', 'Tartare de bœuf'],
        'Chardonnay': ['Poisson blanc', 'Fruits de mer', 'Volaille', 'Fromages crémeux', 'Plats en sauce blanche', 'Risotto', 'Sushi'],
        'Sauvignon Blanc': ['Poisson', 'Fruits de mer', 'Salades', 'Fromage de chèvre', 'Asperges', 'Ceviche', 'Tartare de saumon'],
        'Syrah': ['Viandes grillées', 'Gibier', 'Fromages forts', 'Plats épicés', 'Agneau', 'Côtes d\'agneau', 'Tajine'],
        'Grenache': ['Viandes rouges', 'Plats épicés', 'Fromages', 'Charcuterie', 'Pâtes à la viande', 'Pizza'],
        'Viognier': ['Poisson noble', 'Volaille', 'Plats crémeux', 'Fromages doux', 'Foie gras', 'Homard'],
        'Riesling': ['Poisson', 'Fruits de mer', 'Cuisine asiatique', 'Fromage de chèvre', 'Choucroute', 'Tarte flambée'],
        'Gewürztraminer': ['Cuisine asiatique', 'Foie gras', 'Fromages forts', 'Desserts aux fruits', 'Tarte aux quetsches', 'Munster'],
        'Chenin Blanc': ['Poisson', 'Fruits de mer', 'Volaille', 'Fromage de chèvre', 'Rillettes', 'Tarte au citron'],
        'Gamay': ['Charcuterie', 'Fromages', 'Viandes blanches', 'Plats légers', 'Quiche', 'Salades composées'],
        'Malbec': ['Viandes rouges', 'Gibier', 'Fromages', 'Plats épicés', 'Empanadas', 'Barbecue'],
        'Tempranillo': ['Viandes rouges', 'Gibier', 'Fromages', 'Tapas', 'Paella', 'Jambon ibérique'],
        'Sangiovese': ['Pâtes', 'Pizza', 'Viandes rouges', 'Fromages italiens', 'Antipasti', 'Ossobuco'],
        'Barbera': ['Pâtes', 'Pizza', 'Viandes rouges', 'Fromages', 'Risotto aux champignons', 'Polenta'],
        'Nebbiolo': ['Viandes rouges', 'Gibier', 'Fromages', 'Plats riches', 'Truffes', 'Risotto au Barolo']
    },
    
    // Températures de service par type de vin
    temperatures: {
        // Vins rouges
        'Cabernet Sauvignon': '16-18°C',
        'Merlot': '16-18°C',
        'Pinot Noir': '14-16°C',
        'Syrah': '16-18°C',
        'Grenache': '16-18°C',
        'Malbec': '16-18°C',
        'Tempranillo': '16-18°C',
        'Sangiovese': '16-18°C',
        'Barbera': '16-18°C',
        'Nebbiolo': '18-20°C',
        'Carignan': '16-18°C',
        'Mourvèdre': '16-18°C',
        'Cinsault': '14-16°C',
        'Gamay': '12-14°C',
        
        // Vins blancs
        'Chardonnay': '10-12°C',
        'Sauvignon Blanc': '8-10°C',
        'Viognier': '10-12°C',
        'Riesling': '8-10°C',
        'Gewürztraminer': '8-10°C',
        'Chenin Blanc': '8-10°C',
        'Pinot Gris': '10-12°C',
        'Pinot Blanc': '10-12°C',
        'Muscat': '6-8°C',
        'Marsanne': '10-12°C',
        'Roussanne': '10-12°C',
        
        // Rosés
        'Rosé': '8-10°C',
        
        // Champagnes
        'Champagne': '6-8°C',
        'Crémant': '6-8°C'
    },
    
    // Durées de garde par type de vin (en années)
    agingPotential: {
        'Cabernet Sauvignon': { min: 5, max: 20 },
        'Merlot': { min: 3, max: 15 },
        'Pinot Noir': { min: 3, max: 10 },
        'Chardonnay': { min: 2, max: 10 },
        'Sauvignon Blanc': { min: 1, max: 5 },
        'Syrah': { min: 5, max: 15 },
        'Grenache': { min: 3, max: 10 },
        'Viognier': { min: 1, max: 5 },
        'Riesling': { min: 2, max: 20 },
        'Gewürztraminer': { min: 1, max: 5 },
        'Chenin Blanc': { min: 2, max: 10 },
        'Gamay': { min: 1, max: 5 },
        'Malbec': { min: 3, max: 10 },
        'Tempranillo': { min: 3, max: 15 },
        'Sangiovese': { min: 3, max: 10 },
        'Barbera': { min: 2, max: 8 },
        'Nebbiolo': { min: 5, max: 25 }
    }
};

// Worker Tesseract pour l'OCR
let tesseractWorker = null;

// Initialiser le worker Tesseract
async function initTesseract() {
    if (!tesseractWorker) {
        tesseractWorker = await createWorker('fra+eng');
    }
    return tesseractWorker;
}

// Analyser une image de bouteille avec OCR local
async function analyzeBottleImage(imagePath) {
    try {
        // Vérifier que le fichier existe
        if (!fs.existsSync(imagePath)) {
            throw new Error(`Fichier introuvable: ${imagePath}`);
        }
        
        // Lire l'image
        const imageBuffer = fs.readFileSync(imagePath);
        
        // Initialiser le worker Tesseract
        const worker = await initTesseract();
        
        // Utiliser Tesseract pour extraire le texte
        const { data: { text } } = await worker.recognize(imageBuffer);
        
        // Analyser le texte pour extraire des informations sur le vin
        const bottleInfo = extractBottleInfoFromText(text);
        
        // Fermer le worker (optionnel, peut être gardé en mémoire pour de meilleures performances)
        // await worker.terminate();
        
        return {
            ...bottleInfo,
            rawText: text,
            analysisMethod: 'OCR Local (Tesseract.js)'
        };
    } catch (error) {
        console.error("Erreur lors de l'analyse de l'image avec OCR local:", error);
        
        // En cas d'échec de l'OCR, essayer une analyse basique
        try {
            const imageBuffer = fs.readFileSync(imagePath);
            const base64Image = imageBuffer.toString('base64');
            return {
                name: null,
                year: null,
                grapes: null,
                region: null,
                drinkFrom: null,
                drinkTo: null,
                foodPairing: null,
                temperature: null,
                rawText: null,
                analysisMethod: 'Analyse basique',
                imageData: base64Image
            };
        } catch (fallbackError) {
            console.error("Erreur lors de l'analyse basique:", fallbackError);
            return null;
        }
    }
}

// Analyser une image en base64
async function analyzeBottleImageBase64(base64Image) {
    try {
        // Convertir base64 en buffer
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Initialiser le worker Tesseract
        const worker = await initTesseract();
        
        // Utiliser Tesseract pour extraire le texte
        const { data: { text } } = await worker.recognize(buffer);
        
        // Analyser le texte pour extraire des informations sur le vin
        const bottleInfo = extractBottleInfoFromText(text);
        
        return {
            ...bottleInfo,
            rawText: text,
            analysisMethod: 'OCR Local (Tesseract.js)'
        };
    } catch (error) {
        console.error("Erreur lors de l'analyse de l'image base64:", error);
        return null;
    }
}

// Extraire les informations sur le vin à partir du texte
function extractBottleInfoFromText(text) {
    const info = {
        name: null,
        year: null,
        grapes: null,
        region: null,
        drinkFrom: null,
        drinkTo: null,
        foodPairing: null,
        temperature: null,
        producer: null,
        appellation: null
    };

    if (!text || text.trim() === '') {
        return info;
    }

    // Nettoyer le texte
    const cleanText = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

    // Extraire l'année (entre 1900 et 2099)
    const yearMatch = cleanText.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
        info.year = parseInt(yearMatch[0]);
    }

    // Extraire le nom - chercher des mots-clés
    const nameKeywords = ['Château', 'Domaine', 'Cuvée', 'Grand Cru', 'Premier Cru', 'Cru Bourgeois', 'Cru Classé', 'Clos', 'Chai'];
    let nameStartIndex = -1;
    
    for (const keyword of nameKeywords) {
        const index = cleanText.toLowerCase().indexOf(keyword.toLowerCase());
        if (index !== -1 && (nameStartIndex === -1 || index < nameStartIndex)) {
            nameStartIndex = index;
        }
    }

    if (nameStartIndex !== -1) {
        // Prendre le texte à partir du mot-clé jusqu'à la fin de la ligne ou un certain nombre de caractères
        const remainingText = cleanText.substring(nameStartIndex);
        const endMarkers = ['\n', 'Appellation', 'Cépage', 'Région', 'AOC', 'IGP', 'Contenance', 'Alcool'];
        let nameEndIndex = remainingText.length;
        
        for (const marker of endMarkers) {
            const markerIndex = remainingText.indexOf(marker);
            if (markerIndex !== -1 && markerIndex < nameEndIndex) {
                nameEndIndex = markerIndex;
            }
        }
        
        info.name = remainingText.substring(0, nameEndIndex).trim();
    } else {
        // Si aucun mot-clé trouvé, prendre la première ligne
        const firstLine = cleanText.split('\n')[0].trim();
        if (firstLine && firstLine.length > 3) {
            info.name = firstLine;
        }
    }

    // Extraire le cépage
    for (const grape of WINE_DATABASE.grapes) {
        if (cleanText.toLowerCase().includes(grape.toLowerCase())) {
            info.grapes = grape;
            break;
        }
    }

    // Extraire la région
    for (const region of WINE_DATABASE.regions) {
        if (cleanText.toLowerCase().includes(region.toLowerCase())) {
            info.region = region;
            break;
        }
    }

    // Extraire l'appellation
    for (const appellation of WINE_DATABASE.appellations) {
        if (cleanText.toLowerCase().includes(appellation.toLowerCase())) {
            info.appellation = appellation;
            break;
        }
    }

    // Extraire le producteur (souvent avant le nom)
    const producerKeywords = ['Château', 'Domaine', 'Clos', 'Chai', 'Maison', 'Cave'];
    for (const keyword of producerKeywords) {
        const regex = new RegExp(`(${keyword})\\s+([A-ZÉÈÊËÀÂÇÔÛÏÜa-zéèêëàâçôûïü\\s-]+)`, 'i');
        const match = cleanText.match(regex);
        if (match) {
            info.producer = `${keyword} ${match[2]}`;
            break;
        }
    }

    // Déterminer la période optimale de consommation
    if (info.year) {
        const currentYear = new Date().getFullYear();
        
        if (info.grapes && WINE_DATABASE.agingPotential[info.grapes]) {
            const aging = WINE_DATABASE.agingPotential[info.grapes];
            info.drinkFrom = info.year + aging.min;
            info.drinkTo = info.year + aging.max;
        } else {
            // Estimation par défaut
            info.drinkFrom = info.year + 3;
            info.drinkTo = info.year + 10;
        }
        
        // S'assurer que les dates sont dans le futur
        if (info.drinkFrom < currentYear) {
            info.drinkFrom = currentYear;
        }
        if (info.drinkTo < info.drinkFrom) {
            info.drinkTo = info.drinkFrom + 5;
        }
    }

    // Déterminer les accords mets-vins
    if (info.grapes && WINE_DATABASE.foodPairings[info.grapes]) {
        info.foodPairing = WINE_DATABASE.foodPairings[info.grapes].join(', ');
    } else if (info.region) {
        // Accords par région si cépage inconnu
        const regionalPairings = {
            'Bordeaux': 'Bœuf, Agneau, Gibier, Fromage',
            'Bourgogne': 'Canard, Poulet, Fromages affinés',
            'Champagne': 'Apéritif, Fruits de mer, Desserts',
            'Alsace': 'Choucroute, Tarte flambée, Poisson',
            'Loire': 'Poisson, Fruits de mer, Fromage de chèvre',
            'Rhône': 'Viandes grillées, Gibier, Plats épicés'
        };
        info.foodPairing = regionalPairings[info.region] || 'Viandes, Fromages, Plats variés';
    } else {
        info.foodPairing = 'Viandes, Fromages, Plats variés';
    }

    // Déterminer la température de service
    if (info.grapes && WINE_DATABASE.temperatures[info.grapes]) {
        info.temperature = WINE_DATABASE.temperatures[info.grapes];
    } else {
        // Température par défaut selon le type
        const redWineGrapes = ['Cabernet Sauvignon', 'Merlot', 'Pinot Noir', 'Syrah', 'Grenache', 'Malbec', 'Tempranillo', 'Sangiovese', 'Barbera', 'Nebbiolo'];
        if (info.grapes && redWineGrapes.includes(info.grapes)) {
            info.temperature = '16-18°C';
        } else {
            info.temperature = '10-12°C';
        }
    }

    return info;
}

// Obtenir les accords mets-vins pour un cépage
function getFoodPairingForGrapes(grapes) {
    if (!grapes) return 'Viandes, Fromages, Plats variés';
    
    return WINE_DATABASE.foodPairings[grapes] ? 
        WINE_DATABASE.foodPairings[grapes].join(', ') : 
        'Viandes, Fromages, Plats variés';
}

// Obtenir la température de service pour un cépage
function getTemperatureForGrapes(grapes) {
    if (!grapes) return '10-12°C';
    
    return WINE_DATABASE.temperatures[grapes] || '10-12°C';
}

// Obtenir la période optimale pour un cépage et une année
function getDrinkPeriod(grapes, year) {
    if (!grapes || !year) {
        const currentYear = new Date().getFullYear();
        return {
            drinkFrom: currentYear,
            drinkTo: currentYear + 5
        };
    }

    const currentYear = new Date().getFullYear();
    
    if (WINE_DATABASE.agingPotential[grapes]) {
        const aging = WINE_DATABASE.agingPotential[grapes];
        let drinkFrom = year + aging.min;
        let drinkTo = year + aging.max;

        // S'assurer que les dates sont dans le futur
        if (drinkFrom < currentYear) {
            drinkFrom = currentYear;
        }
        if (drinkTo < drinkFrom) {
            drinkTo = drinkFrom + 5;
        }

        return { drinkFrom, drinkTo };
    }

    // Estimation par défaut
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

// Rechercher des informations sur un vin par nom
function searchWineByName(name) {
    if (!name) return null;

    // Base de données de vins connus (peut être étendue)
    const knownWines = {
        'Château Margaux': {
            grapes: 'Cabernet Sauvignon',
            region: 'Bordeaux',
            appellation: 'Grand Cru Classé'
        },
        'Château Lafite Rothschild': {
            grapes: 'Cabernet Sauvignon',
            region: 'Bordeaux',
            appellation: 'Grand Cru Classé'
        },
        'Domaine de la Romanée-Conti': {
            grapes: 'Pinot Noir',
            region: 'Bourgogne',
            appellation: 'Grand Cru'
        },
        'Château d\'Yquem': {
            grapes: 'Sémillon, Sauvignon Blanc',
            region: 'Bordeaux',
            appellation: 'Grand Cru Classé'
        },
        'Côte-Rôtie': {
            grapes: 'Syrah',
            region: 'Rhône',
            appellation: 'AOC'
        },
        'Hermitage': {
            grapes: 'Syrah',
            region: 'Rhône',
            appellation: 'AOC'
        },
        'Chablis': {
            grapes: 'Chardonnay',
            region: 'Bourgogne',
            appellation: 'AOC'
        },
        'Sauternes': {
            grapes: 'Sémillon, Sauvignon Blanc',
            region: 'Bordeaux',
            appellation: 'AOC'
        }
    };

    const normalizedName = name.toLowerCase().trim();
    
    for (const [wineName, wineInfo] of Object.entries(knownWines)) {
        if (normalizedName.includes(wineName.toLowerCase())) {
            return {
                ...wineInfo,
                name: wineName
            };
        }
    }

    return null;
}

// Générer une description complète d'un vin
function generateWineDescription(bottleInfo) {
    const descriptions = [];

    if (bottleInfo.name) {
        descriptions.push(`Voici les informations que j'ai pu extraire pour votre bouteille de <strong>${bottleInfo.name}</strong>.`);
    } else {
        descriptions.push("Voici les informations que j'ai pu extraire de l'image de votre bouteille.");
    }

    if (bottleInfo.year) {
        descriptions.push(`Millésime <strong>${bottleInfo.year}</strong>.`);
    }

    if (bottleInfo.grapes) {
        descriptions.push(`Cépage principal : <strong>${bottleInfo.grapes}</strong>.`);
    }

    if (bottleInfo.region) {
        descriptions.push(`Région : <strong>${bottleInfo.region}</strong>.`);
    }

    if (bottleInfo.appellation) {
        descriptions.push(`Appellation : <strong>${bottleInfo.appellation}</strong>.`);
    }

    if (bottleInfo.drinkFrom && bottleInfo.drinkTo) {
        descriptions.push(`Période optimale de consommation : <strong>de ${bottleInfo.drinkFrom} à ${bottleInfo.drinkTo}</strong>.`);
    }

    if (bottleInfo.temperature) {
        descriptions.push(`Température de service idéale : <strong>${bottleInfo.temperature}</strong>.`);
    }

    if (bottleInfo.foodPairing) {
        descriptions.push(`Accords mets-vins suggérés : <strong>${bottleInfo.foodPairing}</strong>.`);
    }

    return descriptions.join(' ');
}

// Conseiller un vin pour une occasion
function recommendWineForOccasion(occasion, food, budget) {
    const recommendations = {
        'dîner romantique': {
            red: ['Bourgogne Pinot Noir', 'Côtes du Rhône', 'Saint-Émilion'],
            white: ['Bourgogne Chardonnay', 'Alsace Pinot Gris', 'Sancerre'],
            champagne: ['Champagne Brut', 'Crémant de Bourgogne']
        },
        'barbecue': {
            red: ['Côtes du Rhône', 'Malbec', 'Syrah', 'Cabernet Sauvignon'],
            white: ['Viognier', 'Chardonnay'],
            rosé: ['Rosé de Provence', 'Tavel']
        },
        'apéritif': {
            white: ['Muscadet', 'Sauvignon Blanc', 'Chablis'],
            champagne: ['Champagne Brut', 'Prosecco', 'Cava'],
            rosé: ['Rosé de Provence']
        },
        'fromages': {
            red: ['Bordeaux', 'Bourgogne', 'Côtes du Rhône'],
            white: ['Jura Vin Jaune', 'Sauternes']
        },
        'poisson': {
            white: ['Chablis', 'Muscadet', 'Sancerre', 'Pouilly-Fumé']
        },
        'viande rouge': {
            red: ['Bordeaux', 'Côtes du Rhône', 'Cabernet Sauvignon', 'Syrah']
        },
        'volaille': {
            red: ['Bourgogne Pinot Noir', 'Beaujolais'],
            white: ['Bourgogne Chardonnay', 'Alsace Pinot Gris']
        }
    };

    const occasionKey = occasion ? occasion.toLowerCase() : 'dîner';
    const foodKey = food ? food.toLowerCase() : null;

    let suggestedWines = [];

    if (recommendations[occasionKey]) {
        const occasionRecs = recommendations[occasionKey];
        
        if (foodKey) {
            // Trouver des recommandations basées sur la nourriture
            for (const [type, wines] of Object.entries(occasionRecs)) {
                if (foodKey.includes('poisson') || foodKey.includes('fruits de mer')) {
                    suggestedWines = suggestedWines.concat(occasionRecs.white || []);
                } else if (foodKey.includes('viande') || foodKey.includes('boeuf') || foodKey.includes('agneau')) {
                    suggestedWines = suggestedWines.concat(occasionRecs.red || []);
                } else if (foodKey.includes('fromage')) {
                    suggestedWines = suggestedWines.concat(occasionRecs.red || [], occasionRecs.white || []);
                } else {
                    suggestedWines = suggestedWines.concat(wines);
                }
            }
        } else {
            // Prendre toutes les recommandations pour l'occasion
            for (const wines of Object.values(occasionRecs)) {
                suggestedWines = suggestedWines.concat(wines);
            }
        }
    }

    // Filtrer par budget (simplifié)
    const budgetWines = {
        économique: ['Vin de Pays', 'IGP', 'Côtes du Rhône Villages'],
        moyen: ['AOC', 'Cru Bourgeois', 'Saint-Émilion Grand Cru'],
        premium: ['Grand Cru', 'Premier Cru', 'Château Classé']
    };

    if (budget) {
        const budgetKey = budget.toLowerCase();
        if (budgetWines[budgetKey]) {
            suggestedWines = suggestedWines.filter(wine => 
                budgetWines[budgetKey].some(type => wine.toLowerCase().includes(type.toLowerCase()))
            );
        }
    }

    // Retourner des suggestions uniques
    return [...new Set(suggestedWines)].slice(0, 5);
}

// Exporter les fonctions
module.exports = {
    analyzeBottleImage,
    analyzeBottleImageBase64,
    extractBottleInfoFromText,
    getFoodPairingForGrapes,
    getTemperatureForGrapes,
    getDrinkPeriod,
    searchWineByName,
    generateWineDescription,
    recommendWineForOccasion,
    WINE_DATABASE
};
