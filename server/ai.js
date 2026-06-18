const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Clé API pour Google Vision (à remplacer par votre clé)
// Vous pouvez obtenir une clé gratuite ici : https://console.cloud.google.com/apis/credentials
const GOOGLE_VISION_API_KEY = 'YOUR_GOOGLE_VISION_API_KEY';

// Clé API pour Wine-Searcher (optionnelle, à remplacer par votre clé si disponible)
// Sinon, on utilisera une recherche locale ou une API gratuite alternative
const WINE_SEARCHER_API_KEY = null; // 'YOUR_WINE_SEARCHER_API_KEY';

// Fonction pour analyser une image de bouteille avec Google Vision
async function analyzeBottleImage(imagePath) {
    try {
        // Lire l'image
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');

        // Appeler l'API Google Vision
        const response = await axios.post(
            `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
            {
                requests: [
                    {
                        image: { content: base64Image },
                        features: [
                            { type: 'TEXT_DETECTION' }, // Détection de texte (étiquette)
                            { type: 'LABEL_DETECTION' }  // Détection de labels (vin, bouteille, etc.)
                        ]
                    }
                ]
            }
        );

        const annotations = response.data.responses[0];
        const textAnnotations = annotations.textAnnotations || [];
        const labelAnnotations = annotations.labelAnnotations || [];

        // Extraire le texte de l'étiquette
        const labelText = textAnnotations.length > 0 ? textAnnotations[0].description : '';

        // Extraire les labels
        const labels = labelAnnotations.map(label => label.description);

        // Analyser le texte pour extraire des informations sur le vin
        const bottleInfo = extractBottleInfoFromText(labelText);

        return {
            ...bottleInfo,
            labels
        };
    } catch (error) {
        console.error("Erreur lors de l'analyse de l'image :", error);
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
        temperature: null
    };

    // Exemple de logique pour extraire le nom et l'année
    // Cela peut être amélioré avec des expressions régulières plus complexes
    const yearMatch = text.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
        info.year = parseInt(yearMatch[0]);
        // Estimer la période de consommation (ex: 5-10 ans après l'année pour les vins rouges)
        info.drinkFrom = info.year + 5;
        info.drinkTo = info.year + 15;
    }

    // Exemple : chercher des mots-clés pour le nom
    const nameKeywords = ['Château', 'Domaine', 'Cuvée', 'Grand Cru', 'AOC', 'IGP', 'Vin de'];
    for (const keyword of nameKeywords) {
        if (text.includes(keyword)) {
            const startIndex = text.indexOf(keyword);
            const endIndex = text.indexOf('\n', startIndex);
            info.name = text.substring(startIndex, endIndex).trim();
            break;
        }
    }

    // Si aucun nom n'a été trouvé, prendre la première ligne
    if (!info.name && text.includes('\n')) {
        info.name = text.split('\n')[0].trim();
    }

    // Exemple : chercher des cépages
    const grapesKeywords = [
        'Cabernet Sauvignon', 'Merlot', 'Pinot Noir', 'Chardonnay', 'Sauvignon Blanc',
        'Syrah', 'Grenache', 'Viognier', 'Riesling', 'Gewürztraminer', 'Chenin Blanc',
        'Gamay', 'Malbec', 'Tempranillo', 'Sangiovese', 'Barbera', 'Nebbiolo'
    ];
    for (const grape of grapesKeywords) {
        if (text.toLowerCase().includes(grape.toLowerCase())) {
            info.grapes = grape;
            break;
        }
    }

    // Exemple : chercher des régions
    const regionKeywords = [
        'Bordeaux', 'Bourgogne', 'Champagne', 'Loire', 'Alsace', 'Rhône',
        'Provence', 'Languedoc', 'Roussillon', 'Beaujolais', 'Jura', 'Savoie',
        'Côtes du Rhône', 'Saint-Émilion', 'Pomerol', 'Margaux', 'Pauillac'
    ];
    for (const region of regionKeywords) {
        if (text.toLowerCase().includes(region.toLowerCase())) {
            info.region = region;
            break;
        }
    }

    // Accords mets-vins (basé sur le cépage)
    if (info.grapes) {
        info.foodPairing = getFoodPairingForGrapes(info.grapes);
    }

    // Température de service (basée sur le type de vin)
    if (info.grapes) {
        info.temperature = getTemperatureForGrapes(info.grapes);
    }

    return info;
}

// Obtenir les accords mets-vins pour un cépage
function getFoodPairingForGrapes(grapes) {
    const foodPairings = {
        'Cabernet Sauvignon': 'Bœuf, Agneau, Gibier, Fromage à pâte dure, Plats épicés',
        'Merlot': 'Canard, Agneau, Viandes rouges, Fromages, Plats en sauce',
        'Pinot Noir': 'Canard, Poulet, Champignons, Fromages doux, Gibier à plumes',
        'Chardonnay': 'Poisson, Fruits de mer, Volaille, Fromages crémeux, Plats en sauce blanche',
        'Sauvignon Blanc': 'Poisson, Fruits de mer, Salades, Fromage de chèvre, Asperges',
        'Syrah': 'Viandes grillées, Gibier, Fromages forts, Plats épicés',
        'Grenache': 'Viandes rouges, Plats épicés, Fromages, Charcuterie',
        'Viognier': 'Poisson, Volaille, Plats crémeux, Fromages doux',
        'Riesling': 'Poisson, Fruits de mer, Cuisine asiatique, Fromage de chèvre',
        'Gewürztraminer': 'Cuisine asiatique, Foie gras, Fromages forts, Desserts aux fruits',
        'Chenin Blanc': 'Poisson, Fruits de mer, Volaille, Fromage de chèvre',
        'Gamay': 'Charcuterie, Fromages, Viandes blanches, Plats légers',
        'Malbec': 'Viandes rouges, Gibier, Fromages, Plats épicés',
        'Tempranillo': 'Viandes rouges, Gibier, Fromages, Tapas',
        'Sangiovese': 'Pâtes, Pizza, Viandes rouges, Fromages italiens',
        'Barbera': 'Pâtes, Pizza, Viandes rouges, Fromages',
        'Nebbiolo': 'Viandes rouges, Gibier, Fromages, Plats riches'
    };

    return foodPairings[grapes] || 'Viandes, Fromages, Plats variés';
}

// Obtenir la température de service pour un cépage
function getTemperatureForGrapes(grapes) {
    const redGrapes = [
        'Cabernet Sauvignon', 'Merlot', 'Pinot Noir', 'Syrah', 'Grenache',
        'Malbec', 'Tempranillo', 'Sangiovese', 'Barbera', 'Nebbiolo'
    ];
    const whiteGrapes = [
        'Chardonnay', 'Sauvignon Blanc', 'Viognier', 'Riesling',
        'Gewürztraminer', 'Chenin Blanc'
    ];

    if (redGrapes.includes(grapes)) {
        return '16-18°C';
    } else if (whiteGrapes.includes(grapes)) {
        return '8-10°C';
    } else {
        return '10-12°C';
    }
}

// Rechercher les notes d'une bouteille (Vivino, Wine-Searcher, etc.)
async function searchWineNotes(bottleName, year, region) {
    // Si on a une clé Wine-Searcher, on l'utilise
    if (WINE_SEARCHER_API_KEY) {
        try {
            const response = await axios.get(
                `https://api.wine-searcher.com/ws-rest/v1/wine/find?wineName=${encodeURIComponent(bottleName)}&vintage=${year}&region=${encodeURIComponent(region)}`,
                {
                    headers: {
                        'Authorization': `Bearer ${WINE_SEARCHER_API_KEY}`
                    }
                }
            );
            if (response.data.wines && response.data.wines.length > 0) {
                const wine = response.data.wines[0];
                return {
                    source: 'Wine-Searcher',
                    rating: wine.rating ? wine.rating.average : null,
                    reviews: wine.rating ? wine.rating.reviews : null,
                    price: wine.price ? wine.price.average : null,
                    link: wine.url
                };
            }
        } catch (error) {
            console.error("Erreur avec Wine-Searcher :", error.message);
        }
    }

    // Sinon, on utilise une base de données locale ou une API gratuite alternative
    // Exemple : Vivino (nécessite une clé API)
    // Ou on retourne des données simulées pour la démo
    return {
        source: 'Local Database',
        rating: getLocalRating(bottleName, year, region),
        reviews: `Notes locales pour ${bottleName} ${year || ''} ${region || ''}`.trim(),
        price: null,
        link: null
    };
}

// Base de données locale pour les notes (simulée)
function getLocalRating(bottleName, year, region) {
    const localRatings = [
        { name: 'Château Margaux', year: 2015, region: 'Bordeaux', rating: 98 },
        { name: 'Château Margaux', year: 2016, region: 'Bordeaux', rating: 99 },
        { name: 'Domaine de la Romanée-Conti', year: 2010, region: 'Bourgogne', rating: 100 },
        { name: 'Lafite Rothschild', year: 2000, region: 'Bordeaux', rating: 97 },
        { name: 'Côte-Rôtie', year: 2018, region: 'Rhône', rating: 95 },
        { name: 'Chablis', year: 2020, region: 'Bourgogne', rating: 92 },
        { name: 'Sancerre', year: 2019, region: 'Loire', rating: 90 },
        { name: 'Champagne Krug', year: 2008, region: 'Champagne', rating: 96 }
    ];

    const match = localRatings.find(r => 
        r.name.toLowerCase().includes(bottleName.toLowerCase()) &&
        (!year || r.year === year) &&
        (!region || r.region.toLowerCase().includes(region.toLowerCase()))
    );

    return match ? match.rating : null;
}

// Exporter les fonctions
module.exports = {
    analyzeBottleImage,
    extractBottleInfoFromText,
    getFoodPairingForGrapes,
    getTemperatureForGrapes,
    searchWineNotes
};
