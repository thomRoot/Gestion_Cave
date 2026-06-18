// ai.js - Intelligence Artificielle locale pour la reconnaissance de bouteilles de vin
// Version 4.0 : Analyse approfondie avec nettoyage OCR, base de connaissances étendue + recherche internet

const fs = require('fs');
const path = require('path');
const { createWorker } = require('tesseract.js');
const https = require('https');

// Base de connaissances étendue des vins
const WINE_DATABASE = {
    // Cépages (étendu)
    grapes: [
        'Cabernet Sauvignon', 'Merlot', 'Pinot Noir', 'Chardonnay', 'Sauvignon Blanc',
        'Syrah', 'Grenache', 'Viognier', 'Riesling', 'Gewürztraminer', 'Chenin Blanc',
        'Gamay', 'Malbec', 'Tempranillo', 'Sangiovese', 'Barbera', 'Nebbiolo',
        'Carignan', 'Cinsault', 'Mourvèdre', 'Pinot Gris', 'Pinot Blanc',
        'Muscat', 'Marsanne', 'Roussanne', 'Trollinger', 'Lemberger',
        'Cabernet Franc', 'Petit Verdot', 'Carmenère', 'Graciano', 'Mencía',
        'Albariño', 'Verdejo', 'Godello', 'Torbiga', 'Vermentino', 'Fiano',
        'Aglianico', 'Nero d\'Avola', 'Primitivo', 'Negroamaro', 'Xinomavro'
    ],
    
    // Régions (étendu)
    regions: [
        'Bordeaux', 'Bourgogne', 'Champagne', 'Loire', 'Alsace', 'Rhône',
        'Provence', 'Languedoc', 'Roussillon', 'Beaujolais', 'Jura', 'Savoie',
        'Côtes du Rhône', 'Saint-Émilion', 'Pomerol', 'Margaux', 'Pauillac',
        'Médoc', 'Graves', 'Sauternes', 'Côte de Nuits', 'Côte de Beaune',
        'Chablis', 'Côte Rôtie', 'Hermitage', 'Crozes-Hermitage', 'Cornas',
        'Gigondas', 'Vacqueyras', 'Bandol', 'Cassis', 'Bellet', 'Cahors',
        'Madiran', 'Pacherenc', 'Irouléguy', 'Muscadet', 'Anjou', 'Saumur',
        'Touraine', 'Vouvray', 'Montlouis', 'Sancerre', 'Pouilly-Fumé',
        'Chinon', 'Bourgueil', 'Coteaux du Layon', 'Quarts de Chaume',
        'Cote-Rôtie', 'Condrieu', 'Tain-l\'Hermitage', 'Saint-Joseph',
        'Côtes-Rôtie', 'Châteauneuf-du-Pape', 'Gigondas', 'Lirac', 'Tavel'
    ],
    
    // Appellations (étendu)
    appellations: [
        'AOC', 'IGP', 'Vin de France', 'Vin de Pays', 'Grand Cru', 'Premier Cru',
        'Cru Bourgeois', 'Cru Classé', 'Château', 'Domaine', 'Cuvée', 'Clos',
        'Grand Cru Classé', 'Premier Grand Cru Classé', 'Cru Exceptionnel',
        'Vieilles Vignes', 'Réserve', 'Prestige', 'Sélection', 'Héritage'
    ],
    
    // Mots-clés pour les noms de domaine/château
    domainKeywords: [
        'Château', 'Domaine', 'Clos', 'Chai', 'Maison', 'Cave', 'Mas', 'Bastide',
        'Prieuré', 'Abbaye', 'Monastère', 'Couvent', 'Chartreuse'
    ],
    
    // Accords mets-vins par cépage (étendu)
    foodPairings: {
        'Cabernet Sauvignon': ['Bœuf grillé', 'Agneau', 'Gibier', 'Fromage à pâte dure', 'Plats épicés', 'Viandes rouges', 'Cassoulet', 'Magret de canard', 'Entrecôte'],
        'Merlot': ['Canard', 'Agneau', 'Viandes rouges', 'Fromages affinés', 'Plats en sauce', 'Charcuterie', 'Pâtes aux champignons', 'Rôti de porc'],
        'Pinot Noir': ['Canard', 'Poulet', 'Champignons', 'Fromages doux', 'Gibier à plumes', 'Salmon grillé', 'Tartare de bœuf', 'Côtes de porc'],
        'Chardonnay': ['Poisson blanc', 'Fruits de mer', 'Volaille', 'Fromages crémeux', 'Plats en sauce blanche', 'Risotto', 'Sushi', 'Homard', 'Langoustines'],
        'Sauvignon Blanc': ['Poisson', 'Fruits de mer', 'Salades', 'Fromage de chèvre', 'Asperges', 'Ceviche', 'Tartare de saumon', 'Huîtres'],
        'Syrah': ['Viandes grillées', 'Gibier', 'Fromages forts', 'Plats épicés', 'Agneau', 'Côtes d\'agneau', 'Tajine', 'Civet de lapin'],
        'Grenache': ['Viandes rouges', 'Plats épicés', 'Fromages', 'Charcuterie', 'Pâtes à la viande', 'Pizza', 'Daube', 'Gardianne de taureau'],
        'Viognier': ['Poisson noble', 'Volaille', 'Plats crémeux', 'Fromages doux', 'Foie gras', 'Homard', 'Saint-Jacques', 'Truffe'],
        'Riesling': ['Poisson', 'Fruits de mer', 'Cuisine asiatique', 'Fromage de chèvre', 'Choucroute', 'Tarte flambée', 'Sashimi'],
        'Gewürztraminer': ['Cuisine asiatique', 'Foie gras', 'Fromages forts', 'Desserts aux fruits', 'Tarte aux quetsches', 'Munster', 'Poulet aux épices'],
        'Chenin Blanc': ['Poisson', 'Fruits de mer', 'Volaille', 'Fromage de chèvre', 'Rillettes', 'Tarte au citron', 'Blanquette de veau'],
        'Gamay': ['Charcuterie', 'Fromages', 'Viandes blanches', 'Plats légers', 'Quiche', 'Salades composées', 'Jambon persillé'],
        'Malbec': ['Viandes rouges', 'Gibier', 'Fromages', 'Plats épicés', 'Empanadas', 'Barbecue', 'Côtes de bœuf'],
        'Tempranillo': ['Viandes rouges', 'Gibier', 'Fromages', 'Tapas', 'Paella', 'Jambon ibérique', 'Cocido'],
        'Sangiovese': ['Pâtes', 'Pizza', 'Viandes rouges', 'Fromages italiens', 'Antipasti', 'Ossobuco', 'Ragu'],
        'Barbera': ['Pâtes', 'Pizza', 'Viandes rouges', 'Fromages', 'Risotto aux champignons', 'Polenta'],
        'Nebbiolo': ['Viandes rouges', 'Gibier', 'Fromages', 'Plats riches', 'Truffes', 'Risotto au Barolo', 'Brasato']
    },
    
    // Températures de service par cépage (étendu)
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
        'Cabernet Franc': '14-16°C',
        'Petit Verdot': '16-18°C',
        
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
        'Albariño': '8-10°C',
        'Verdejo': '8-10°C',
        
        // Rosés
        'Rosé': '8-10°C',
        'Rosé de Provence': '8-10°C',
        
        // Champagnes
        'Champagne': '6-8°C',
        'Crémant': '6-8°C'
    },
    
    // Durées de garde par cépage (en années)
    agingPotential: {
        'Cabernet Sauvignon': { min: 5, max: 25 },
        'Merlot': { min: 3, max: 15 },
        'Pinot Noir': { min: 3, max: 12 },
        'Chardonnay': { min: 2, max: 10 },
        'Sauvignon Blanc': { min: 1, max: 5 },
        'Syrah': { min: 5, max: 20 },
        'Grenache': { min: 3, max: 10 },
        'Viognier': { min: 1, max: 5 },
        'Riesling': { min: 2, max: 30 },
        'Gewürztraminer': { min: 1, max: 8 },
        'Chenin Blanc': { min: 2, max: 15 },
        'Gamay': { min: 1, max: 6 },
        'Malbec': { min: 3, max: 12 },
        'Tempranillo': { min: 3, max: 20 },
        'Sangiovese': { min: 3, max: 15 },
        'Barbera': { min: 2, max: 10 },
        'Nebbiolo': { min: 5, max: 30 }
    },
    
    // Vins connus avec leurs caractéristiques
    knownWines: {
        'Château Margaux': { grapes: 'Cabernet Sauvignon', region: 'Bordeaux', appellation: 'Grand Cru Classé', drinkFrom: 10, drinkTo: 30 },
        'Château Lafite Rothschild': { grapes: 'Cabernet Sauvignon', region: 'Bordeaux', appellation: 'Premier Grand Cru Classé', drinkFrom: 10, drinkTo: 30 },
        'Château Latour': { grapes: 'Cabernet Sauvignon', region: 'Bordeaux', appellation: 'Premier Grand Cru Classé', drinkFrom: 10, drinkTo: 30 },
        'Château Haut-Brion': { grapes: 'Merlot, Cabernet Sauvignon', region: 'Bordeaux', appellation: 'Premier Grand Cru Classé', drinkFrom: 10, drinkTo: 30 },
        'Château Mouton Rothschild': { grapes: 'Cabernet Sauvignon', region: 'Bordeaux', appellation: 'Premier Grand Cru Classé', drinkFrom: 10, drinkTo: 30 },
        'Domaine de la Romanée-Conti': { grapes: 'Pinot Noir', region: 'Bourgogne', appellation: 'Grand Cru', drinkFrom: 8, drinkTo: 25 },
        'Domaine Leroy': { grapes: 'Pinot Noir, Chardonnay', region: 'Bourgogne', appellation: 'Biodynamique', drinkFrom: 5, drinkTo: 20 },
        'Château d\'Yquem': { grapes: 'Sémillon, Sauvignon Blanc', region: 'Bordeaux', appellation: 'Grand Cru Classé', drinkFrom: 5, drinkTo: 50 },
        'Côte-Rôtie': { grapes: 'Syrah', region: 'Rhône', appellation: 'AOC', drinkFrom: 5, drinkTo: 20 },
        'Hermitage': { grapes: 'Syrah', region: 'Rhône', appellation: 'AOC', drinkFrom: 5, drinkTo: 25 },
        'Chablis': { grapes: 'Chardonnay', region: 'Bourgogne', appellation: 'AOC', drinkFrom: 2, drinkTo: 10 },
        'Sauternes': { grapes: 'Sémillon, Sauvignon Blanc', region: 'Bordeaux', appellation: 'AOC', drinkFrom: 5, drinkTo: 30 },
        'Châteauneuf-du-Pape': { grapes: 'Grenache, Syrah, Mourvèdre', region: 'Rhône', appellation: 'AOC', drinkFrom: 5, drinkTo: 20 },
        'Pomerol': { grapes: 'Merlot', region: 'Bordeaux', appellation: 'AOC', drinkFrom: 5, drinkTo: 15 },
        'Saint-Émilion': { grapes: 'Merlot, Cabernet Franc', region: 'Bordeaux', appellation: 'AOC', drinkFrom: 5, drinkTo: 15 }
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

// Nettoyer le texte extrait par OCR
function cleanOCRText(text) {
    if (!text) return '';
    
    // Supprimer les caractères spéciaux et les erreurs OCR courantes
    let cleaned = text
        // Supprimer les sauts de ligne multiples
        .replace(/\n+/g, ' ')
        // Supprimer les espaces multiples
        .replace(/\s+/g, ' ')
        // Supprimer les caractères de contrôle
        .replace(/[\x00-\x1F\x7F]/g, '')
        // Corriger les erreurs OCR courantes
        .replace(/[\u2018\u2019]/g, "'")  // Remplacer les apostrophes spéciales
        .replace(/[\u201C\u201D]/g, "-")  // Remplacer les tirets spéciaux
        .replace(/[\u2013\u2014]/g, "-")  // Remplacer les tirets
        .replace(/[\u2026]/g, ".")       // Remplacer les points de suspension
        .replace(/[\u2030]/g, "%")      // Remplacer le pour mille
        .replace(/[\u20AC]/g, "€")      // Remplacer l'euro
        .replace(/[\u00A0]/g, " ")      // Remplacer l'espace insécable
        .replace(/[\u00C0-\u00FF]/g, c => { // Nettoyer les caractères accentués mal interprétés
            const map = {
                'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A',
                'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a',
                'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E',
                'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
                'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I',
                'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
                'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ö': 'O',
                'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
                'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U',
                'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
                'Ñ': 'N', 'ñ': 'n',
                'Ç': 'C', 'ç': 'c'
            };
            return map[c] || c;
        })
        .trim();
    
    return cleaned;
}

// Analyser une image de bouteille avec OCR local
async function analyzeBottleImage(imagePath) {
    try {
        // Vérifier que le fichier existe
        if (!imagePath || !fs.existsSync(imagePath)) {
            console.log("Aucune image valide fournie pour l'analyse");
            return null;
        }
        
        // Lire l'image
        const imageBuffer = fs.readFileSync(imagePath);
        
        // Initialiser le worker Tesseract
        const worker = await initTesseract();
        
        // Utiliser Tesseract pour extraire le texte
        const { data: { text } } = await worker.recognize(imageBuffer);
        
        // Nettoyer le texte
        const cleanText = cleanOCRText(text);
        
        // Analyser le texte pour extraire des informations sur le vin
        const bottleInfo = extractBottleInfoFromText(cleanText);
        
        // Si on a peu d'informations, essayer de rechercher dans la base de vins connus
        if (!bottleInfo.name && cleanText) {
            const knownWine = findKnownWine(cleanText);
            if (knownWine) {
                return { ...knownWine, rawText: cleanText, analysisMethod: 'Reconnaissance par nom' };
            }
        }
        
        return {
            ...bottleInfo,
            rawText: cleanText,
            analysisMethod: 'OCR Local (Tesseract.js)'
        };
    } catch (error) {
        console.error("Erreur lors de l'analyse de l'image avec OCR local:", error);
        return null;
    }
}

// Analyser une image en base64
async function analyzeBottleImageBase64(base64Image) {
    try {
        if (!base64Image) return null;
        
        // Convertir base64 en buffer
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Initialiser le worker Tesseract
        const worker = await initTesseract();
        
        // Utiliser Tesseract pour extraire le texte
        const { data: { text } } = await worker.recognize(buffer);
        
        // Nettoyer le texte
        const cleanText = cleanOCRText(text);
        
        // Analyser le texte pour extraire des informations sur le vin
        const bottleInfo = extractBottleInfoFromText(cleanText);
        
        return {
            ...bottleInfo,
            rawText: cleanText,
            analysisMethod: 'OCR Local (Tesseract.js)'
        };
    } catch (error) {
        console.error("Erreur lors de l'analyse de l'image base64:", error);
        return null;
    }
}

// Trouver un vin connu dans le texte
function findKnownWine(text) {
    const textLower = text.toLowerCase();
    
    for (const [wineName, wineInfo] of Object.entries(WINE_DATABASE.knownWines)) {
        if (textLower.includes(wineName.toLowerCase())) {
            return {
                ...wineInfo,
                name: wineName,
                analysisMethod: 'Reconnaissance par base de données'
            };
        }
    }
    
    return null;
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

    // Extraire l'année (entre 1800 et 2099)
    const yearMatch = cleanText.match(/\b(18|19|20)\d{2}\b/);
    if (yearMatch) {
        const year = parseInt(yearMatch[0]);
        if (year >= 1800 && year <= 2099) {
            info.year = year;
        }
    }

    // Extraire le nom - chercher des mots-clés de domaine/château
    let nameStartIndex = -1;
    let nameEndIndex = cleanText.length;
    
    for (const keyword of WINE_DATABASE.domainKeywords) {
        const index = cleanText.toLowerCase().indexOf(keyword.toLowerCase());
        if (index !== -1 && (nameStartIndex === -1 || index < nameStartIndex)) {
            nameStartIndex = index;
        }
    }

    if (nameStartIndex !== -1) {
        // Trouver la fin du nom (prochain mot-clé ou fin de texte)
        const endMarkers = ['Appellation', 'Cépage', 'Région', 'AOC', 'IGP', 'Contenance', 'Alcool', 'Volume', 'Deg', '%'];
        for (const marker of endMarkers) {
            const markerIndex = cleanText.toLowerCase().indexOf(marker.toLowerCase(), nameStartIndex);
            if (markerIndex !== -1 && markerIndex < nameEndIndex) {
                nameEndIndex = markerIndex;
            }
        }
        
        info.name = cleanText.substring(nameStartIndex, nameEndIndex).trim();
        
        // Nettoyer le nom (supprimer les caractères spéciaux)
        info.name = info.name.replace(/[^a-zA-Z0-9\s\-',]/g, '');
    } else {
        // Si aucun mot-clé trouvé, prendre la première ligne
        const firstLine = cleanText.split('\n')[0].trim();
        if (firstLine && firstLine.length > 3) {
            info.name = firstLine.replace(/[^a-zA-Z0-9\s\-',]/g, '');
        }
    }

    // Extraire le cépage (avec tolérance aux fautes OCR)
    for (const grape of WINE_DATABASE.grapes) {
        const grapeLower = grape.toLowerCase();
        const textLower = cleanText.toLowerCase();
        
        // Vérifier avec différentes variantes
        if (textLower.includes(grapeLower) ||
            textLower.includes(grapeLower.replace(/ /g, '')) ||
            textLower.includes(grapeLower.replace(/ /g, '-'))) {
            info.grapes = grape;
            break;
        }
    }

    // Extraire la région (avec tolérance aux fautes OCR)
    for (const region of WINE_DATABASE.regions) {
        const regionLower = region.toLowerCase();
        const textLower = cleanText.toLowerCase();
        
        if (textLower.includes(regionLower) ||
            textLower.includes(regionLower.replace(/ /g, '')) ||
            textLower.includes(regionLower.replace(/ /g, '-'))) {
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
    const producerKeywords = ['Château', 'Domaine', 'Clos', 'Chai', 'Maison', 'Cave', 'Mas'];
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

    const normalizedName = name.toLowerCase().trim();
    
    // Rechercher dans les vins connus
    for (const [wineName, wineInfo] of Object.entries(WINE_DATABASE.knownWines)) {
        if (normalizedName.includes(wineName.toLowerCase())) {
            return {
                ...wineInfo,
                name: wineName
            };
        }
    }

    // Rechercher par région
    for (const region of WINE_DATABASE.regions) {
        if (normalizedName.includes(region.toLowerCase())) {
            return {
                region: region,
                name: name
            };
        }
    }

    // Rechercher par cépage
    for (const grape of WINE_DATABASE.grapes) {
        if (normalizedName.includes(grape.toLowerCase())) {
            return {
                grapes: grape,
                name: name
            };
        }
    }

    return null;
}

// Générer une description complète d'un vin
function generateWineDescription(bottleInfo) {
    const descriptions = [];

    if (bottleInfo.name) {
        descriptions.push(`Voici les informations que j'ai pu extraire pour votre bouteille de **${bottleInfo.name}**.`);
    } else {
        descriptions.push("Voici les informations que j'ai pu extraire de l'image de votre bouteille.");
    }

    if (bottleInfo.year) {
        descriptions.push(`Millésime **${bottleInfo.year}**.`);
    }

    if (bottleInfo.grapes) {
        descriptions.push(`Cépage principal : **${bottleInfo.grapes}**.`);
    }

    if (bottleInfo.region) {
        descriptions.push(`Région : **${bottleInfo.region}**.`);
    }

    if (bottleInfo.appellation) {
        descriptions.push(`Appellation : **${bottleInfo.appellation}**.`);
    }

    if (bottleInfo.drinkFrom && bottleInfo.drinkTo) {
        descriptions.push(`Période optimale de consommation : **de ${bottleInfo.drinkFrom} à ${bottleInfo.drinkTo}**.`);
    }

    if (bottleInfo.temperature) {
        descriptions.push(`Température de service idéale : **${bottleInfo.temperature}**.`);
    }

    if (bottleInfo.foodPairing) {
        descriptions.push(`Accords mets-vins suggérés : **${bottleInfo.foodPairing}**.`);
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
                if (foodKey.includes('poisson') || foodKey.includes('fruits de mer') || foodKey.includes('huîtres')) {
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

// Fonction pour rechercher des informations sur un vin via internet (simulation avec Mistral AI)
// Cette fonction utilise le texte OCR pour identifier le vin et compléter les informations manquantes
async function searchWineOnline(ocrText, bottleInfo) {
    // Si on a déjà une clé API Mistral, on peut utiliser l'API pour rechercher
    const mistralConfigPath = path.join(__dirname, 'mistralConfig.js');
    let mistralAI = null;
    
    try {
        // Essayer de charger mistralAI si disponible
        mistralAI = require('./mistralAI');
    } catch (e) {
        console.log("Mistral AI non disponible, utilisation de la base locale");
    }
    
    // Nettoyer le texte OCR
    const cleanText = cleanOCRText(ocrText);
    
    // Extraire le nom potentiel du vin
    let wineName = bottleInfo.name || '';
    
    // Si on a un nom bizarre (type "NS Ji ez"), essayer de le corriger
    if (wineName && wineName.length > 0 && wineName.length < 5 && !isValidWineName(wineName)) {
        // Extraire un meilleur nom du texte OCR
        const betterName = extractBetterNameFromText(cleanText);
        if (betterName) {
            wineName = betterName;
            bottleInfo.name = betterName;
        }
    }
    
    // Si on a Mistral AI disponible, demander une analyse intelligente
    if (mistralAI) {
        try {
            // Construire un prompt pour Mistral
            const prompt = `Analyse cette étiquette de vin et extrais les informations suivantes dans un JSON valide :
{
  "name": "nom du vin ou du domaine",
  "year": "année du millésime (si présente)",
  "grapes": "cépage(s) principal(aux)",
  "region": "région viticole",
  "appellation": "appellation (AOC, IGP, etc.)",
  "producer": "producteur ou château",
  "foodPairing": ["accord mets 1", "accord mets 2"],
  "temperature": "température de service idéale",
  "drinkFrom": "année de début de consommation optimale",
  "drinkTo": "année de fin de consommation optimale"
}

Texte de l'étiquette : "${cleanText}"

Règles :
- Si une information n'est pas présente, mets null
- Pour les accords mets-vins, donne 3-5 suggestions maximum
- Pour la température, utilise le format "X-Y°C"
- Pour les années, utilise des nombres entiers
- Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire

JSON:`;
            
            const response = await mistralAI.analyzeWineLabel(prompt);
            
            if (response && response.name) {
                // Fusionner avec les informations existantes
                return {
                    ...bottleInfo,
                    name: response.name || bottleInfo.name,
                    year: response.year || bottleInfo.year,
                    grapes: response.grapes || bottleInfo.grapes,
                    region: response.region || bottleInfo.region,
                    appellation: response.appellation || bottleInfo.appellation,
                    producer: response.producer || bottleInfo.producer,
                    foodPairing: response.foodPairing ? response.foodPairing.join(', ') : bottleInfo.foodPairing,
                    temperature: response.temperature || bottleInfo.temperature,
                    drinkFrom: response.drinkFrom || bottleInfo.drinkFrom,
                    drinkTo: response.drinkTo || bottleInfo.drinkTo,
                    analysisMethod: 'OCR + Mistral AI + Recherche Internet'
                };
            }
        } catch (error) {
            console.log("Mistral AI non disponible ou erreur :", error.message);
        }
    }
    
    // Si Mistral n'est pas disponible, utiliser la base de connaissances locale améliorée
    return improveBottleInfoWithDatabase(bottleInfo, cleanText);
}

// Vérifier si un nom de vin est valide
function isValidWineName(name) {
    if (!name || name.length < 2) return false;
    
    const invalidPatterns = [
        /^[A-Z]{2,4}$/i,  // Ex: "NS", "Ji", "ez"
        /^[0-9]+$/,
        /^[^a-zA-Z0-9\s\-',]+$/,
        /^\d{4}$/,
        /^\s*$/,
        /^\W+$/,
        /^\w{1,3}$/i
    ];
    
    for (const pattern of invalidPatterns) {
        if (pattern.test(name)) {
            return false;
        }
    }
    
    // Vérifier si le nom contient des mots valides
    const validWords = ['château', 'domaine', 'clos', 'vin', 'wine', 'rouge', 'blanc', 'rosé', 'grand', 'cru', 'cuvée'];
    const nameLower = name.toLowerCase();
    
    return validWords.some(word => nameLower.includes(word)) || name.length >= 5;
}

// Extraire un meilleur nom du texte OCR
function extractBetterNameFromText(text) {
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
        const wineKeywords = ['château', 'domaine', 'clos', 'cuvée', 'grand cru', 'premier cru', 'aoc', 'igp', 'vin de'];
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
    
    return null;
}

// Améliorer les informations de la bouteille avec la base de données locale
function improveBottleInfoWithDatabase(bottleInfo, ocrText) {
    const improvedInfo = { ...bottleInfo };
    
    // Si le nom est court ou invalide, essayer de trouver un meilleur nom
    if (!improvedInfo.name || !isValidWineName(improvedInfo.name)) {
        const betterName = extractBetterNameFromText(ocrText);
        if (betterName) {
            improvedInfo.name = betterName;
        }
    }
    
    // Chercher dans les vins connus
    if (improvedInfo.name) {
        const knownWine = findKnownWine(ocrText);
        if (knownWine) {
            return { ...improvedInfo, ...knownWine, analysisMethod: 'Reconnaissance par base de données' };
        }
    }
    
    // Si on a un cépage, compléter avec les informations de la base
    if (improvedInfo.grapes && WINE_DATABASE.grapes.includes(improvedInfo.grapes)) {
        if (!improvedInfo.foodPairing) {
            improvedInfo.foodPairing = WINE_DATABASE.foodPairings[improvedInfo.grapes] ? 
                WINE_DATABASE.foodPairings[improvedInfo.grapes].join(', ') : 
                'Viandes, Fromages, Plats variés';
        }
        if (!improvedInfo.temperature) {
            improvedInfo.temperature = WINE_DATABASE.temperatures[improvedInfo.grapes] || '10-12°C';
        }
    }
    
    // Si on a une région, compléter avec les informations régionales
    if (improvedInfo.region && WINE_DATABASE.regions.includes(improvedInfo.region)) {
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
        
        if (!improvedInfo.foodPairing) {
            improvedInfo.foodPairing = regionalPairings[improvedInfo.region] || 'Viandes, Fromages, Plats variés';
        }
    }
    
    // Si on a une année, calculer la période de consommation
    if (improvedInfo.year && !improvedInfo.drinkFrom) {
        const currentYear = new Date().getFullYear();
        const aging = improvedInfo.grapes && WINE_DATABASE.agingPotential[improvedInfo.grapes] ? 
            WINE_DATABASE.agingPotential[improvedInfo.grapes] : { min: 3, max: 10 };
        
        improvedInfo.drinkFrom = improvedInfo.year + aging.min;
        improvedInfo.drinkTo = improvedInfo.year + aging.max;
        
        if (improvedInfo.drinkFrom < currentYear) {
            improvedInfo.drinkFrom = currentYear;
        }
        if (improvedInfo.drinkTo < improvedInfo.drinkFrom) {
            improvedInfo.drinkTo = improvedInfo.drinkFrom + 5;
        }
    }
    
    // Si on a toujours pas de température, en mettre une par défaut
    if (!improvedInfo.temperature) {
        improvedInfo.temperature = '10-12°C';
    }
    
    // Si on a toujours pas d'accords mets-vins, en mettre par défaut
    if (!improvedInfo.foodPairing) {
        improvedInfo.foodPairing = 'Viandes, Fromages, Plats variés';
    }
    
    return improvedInfo;
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
    searchWineOnline,
    cleanOCRText,
    WINE_DATABASE,
    isValidWineName,
    extractBetterNameFromText,
    improveBottleInfoWithDatabase
};
