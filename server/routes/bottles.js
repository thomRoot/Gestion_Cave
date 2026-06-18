const express = require('express');
const router = express.Router();
const database = require('../database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ai = require('../ai');
const mistralAI = require('../mistralAI');
const mistralConfig = require('../mistralConfig');

// Configuration de Multer pour l'upload des photos
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadDir = path.join(__dirname, '../../public/uploads');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + path.extname(file.originalname));
        },
        limits: {
            fileSize: 5 * 1024 * 1024 // 5Mo max pour le fichier source
        }
    })
});

// Récupérer toutes les bouteilles
router.get('/', (req, res) => {
    database.getAllBottles((err, bottles) => {
        if (err) {
            res.status(500).json({ error: "Erreur lors de la récupération des bouteilles" });
        } else {
            res.json(bottles);
        }
    });
});

// Analyser une bouteille avec l'IA (avec image uploadée) - VERSION ROBUSTE
router.post('/analyze', upload.single('image'), async (req, res) => {
    try {
        let imagePath = null;
        
        // Si une image a été uploadée
        if (req.file) {
            imagePath = path.join(__dirname, '../../public/uploads', req.file.filename);
        }
        
        // Analyser avec l'IA locale
        let result = await ai.analyzeBottleImage(imagePath);
        
        // Si on a un résultat, l'améliorer avec une recherche internet
        if (result) {
            // Améliorer avec recherche internet si on a du texte OCR
            if (result.rawText) {
                result = await ai.searchWineOnline(result.rawText, result);
            }
            
            // Vérifier que le résultat est valide et complet
            const validatedResult = validateAndCompleteBottleInfo(result);
            
            res.json({
                success: true,
                bottleInfo: validatedResult,
                mistralAvailable: !!mistralConfig.apiKey,
                analysisMethod: validatedResult.analysisMethod || 'OCR Local'
            });
        } else {
            // Si l'analyse échoue, retourner des infos par défaut
            res.json({
                success: true,
                bottleInfo: {
                    name: null,
                    year: null,
                    grapes: null,
                    region: null,
                    drinkFrom: null,
                    drinkTo: null,
                    foodPairing: "Viandes, Fromages, Plats variés",
                    temperature: "10-12°C",
                    analysisMethod: 'Fallback'
                },
                mistralAvailable: !!mistralConfig.apiKey
            });
        }
    } catch (error) {
        console.error("Erreur analyse IA :", error);
        res.status(500).json({
            success: false,
            error: "Erreur serveur lors de l'analyse",
            mistralAvailable: !!mistralConfig.apiKey
        });
    }
});

// Valider et compléter les informations de la bouteille
function validateAndCompleteBottleInfo(bottleInfo) {
    const validated = { ...bottleInfo };
    
    // 1. Valider et corriger le nom
    if (!validated.name || !ai.isValidWineName(validated.name)) {
        // Essayer d'extraire un meilleur nom du texte brut
        if (validated.rawText) {
            const betterName = ai.extractBetterNameFromText(validated.rawText);
            if (betterName && ai.isValidWineName(betterName)) {
                validated.name = betterName;
            } else {
                // Si aucun nom valide, mettre un nom générique
                validated.name = "Vin inconnu";
            }
        } else {
            validated.name = "Vin inconnu";
        }
    }
    
    // 2. Valider l'année (doit être entre 1800 et 2100)
    if (validated.year && (validated.year < 1800 || validated.year > 2100)) {
        validated.year = null;
    }
    
    // 3. Valider le cépage (doit être dans la base de données)
    if (validated.grapes && !ai.WINE_DATABASE.grapes.includes(validated.grapes)) {
        // Essayer de trouver un cépage similaire
        const similarGrape = findSimilarGrape(validated.grapes, ai.WINE_DATABASE.grapes);
        validated.grapes = similarGrape || null;
    }
    
    // 4. Valider la région
    if (validated.region && !ai.WINE_DATABASE.regions.includes(validated.region)) {
        const similarRegion = findSimilarRegion(validated.region, ai.WINE_DATABASE.regions);
        validated.region = similarRegion || null;
    }
    
    // 5. Compléter les accords mets-vins si manquants
    if (!validated.foodPairing || validated.foodPairing === "Viandes, Fromages, Plats variés") {
        if (validated.grapes && ai.WINE_DATABASE.foodPairings[validated.grapes]) {
            validated.foodPairing = ai.WINE_DATABASE.foodPairings[validated.grapes].join(', ');
        } else if (validated.region) {
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
            validated.foodPairing = regionalPairings[validated.region] || 'Viandes, Fromages, Plats variés';
        } else {
            validated.foodPairing = 'Viandes, Fromages, Plats variés';
        }
    }
    
    // 6. Compléter la température si manquante
    if (!validated.temperature) {
        if (validated.grapes && ai.WINE_DATABASE.temperatures[validated.grapes]) {
            validated.temperature = ai.WINE_DATABASE.temperatures[validated.grapes];
        } else {
            // Température par défaut selon le type
            const redWineGrapes = ['Cabernet Sauvignon', 'Merlot', 'Pinot Noir', 'Syrah', 'Grenache', 'Malbec', 'Tempranillo', 'Sangiovese', 'Barbera', 'Nebbiolo'];
            if (validated.grapes && redWineGrapes.includes(validated.grapes)) {
                validated.temperature = '16-18°C';
            } else {
                validated.temperature = '10-12°C';
            }
        }
    }
    
    // 7. Compléter la période de consommation si manquante
    if (!validated.drinkFrom || !validated.drinkTo) {
        const currentYear = new Date().getFullYear();
        if (validated.year) {
            const aging = validated.grapes && ai.WINE_DATABASE.agingPotential[validated.grapes] ? 
                ai.WINE_DATABASE.agingPotential[validated.grapes] : { min: 3, max: 10 };
            
            validated.drinkFrom = validated.year + aging.min;
            validated.drinkTo = validated.year + aging.max;
            
            if (validated.drinkFrom < currentYear) {
                validated.drinkFrom = currentYear;
            }
            if (validated.drinkTo < validated.drinkFrom) {
                validated.drinkTo = validated.drinkFrom + 5;
            }
        } else {
            validated.drinkFrom = currentYear;
            validated.drinkTo = currentYear + 5;
        }
    }
    
    // 8. S'assurer que tous les champs sont présents
    validated.name = validated.name || "Vin inconnu";
    validated.year = validated.year || null;
    validated.grapes = validated.grapes || null;
    validated.region = validated.region || null;
    validated.drinkFrom = validated.drinkFrom || new Date().getFullYear();
    validated.drinkTo = validated.drinkTo || new Date().getFullYear() + 5;
    validated.foodPairing = validated.foodPairing || 'Viandes, Fromages, Plats variés';
    validated.temperature = validated.temperature || '10-12°C';
    
    return validated;
}

// Trouver un cépage similaire (pour corriger les erreurs OCR)
function findSimilarGrape(input, grapesList) {
    if (!input) return null;
    
    const inputLower = input.toLowerCase().trim();
    
    // Vérifier l'exact match (case insensitive)
    for (const grape of grapesList) {
        if (grape.toLowerCase() === inputLower) {
            return grape;
        }
    }
    
    // Vérifier si l'input contient un cépage
    for (const grape of grapesList) {
        if (inputLower.includes(grape.toLowerCase())) {
            return grape;
        }
    }
    
    // Vérifier si un cépage contient l'input
    for (const grape of grapesList) {
        if (grape.toLowerCase().includes(inputLower)) {
            return grape;
        }
    }
    
    return null;
}

// Trouver une région similaire
function findSimilarRegion(input, regionsList) {
    if (!input) return null;
    
    const inputLower = input.toLowerCase().trim();
    
    // Vérifier l'exact match
    for (const region of regionsList) {
        if (region.toLowerCase() === inputLower) {
            return region;
        }
    }
    
    // Vérifier si l'input contient une région
    for (const region of regionsList) {
        if (inputLower.includes(region.toLowerCase())) {
            return region;
        }
    }
    
    // Vérifier si une région contient l'input
    for (const region of regionsList) {
        if (region.toLowerCase().includes(inputLower)) {
            return region;
        }
    }
    
    return null;
}

// Analyser une bouteille avec l'IA (image en base64) - Utilise Mistral + OCR local
router.post('/analyze-base64', async (req, res) => {
    try {
        const { image } = req.body;
        
        if (!image) {
            return res.status(400).json({
                success: false,
                error: "Aucune image fournie"
            });
        }
        
        // D'abord, essayer avec OCR local (Tesseract.js)
        let ocrResult = null;
        try {
            ocrResult = await ai.analyzeBottleImageBase64(image);
        } catch (ocrError) {
            console.log("OCR local échoué, tentative avec Mistral directement...");
        }
        
        // Si OCR a réussi et a donné des résultats, les utiliser
        if (ocrResult && (ocrResult.name || ocrResult.year || ocrResult.grapes || ocrResult.region)) {
            // Compléter avec Mistral pour une analyse plus intelligente
            try {
                const mistralAnalysis = await mistralAI.analyzeWineLabel(ocrResult.rawText || '');
                if (mistralAnalysis) {
                    // Fusionner les résultats
                    const mergedResult = {
                        ...ocrResult,
                        ...mistralAnalysis,
                        // Conserver les infos de l'OCR local si Mistral n'a pas trouvé
                        name: mistralAnalysis.name || ocrResult.name,
                        year: mistralAnalysis.year || ocrResult.year,
                        grapes: mistralAnalysis.grapes || ocrResult.grapes,
                        region: mistralAnalysis.region || ocrResult.region
                    };
                    
                    // Ajouter les infos manquantes (accords, température, etc.)
                    const completeInfo = ai.extractBottleInfoFromText(
                        `${mergedResult.name || ''} ${mergedResult.year || ''} ${mergedResult.grapes || ''} ${mergedResult.region || ''}`
                    );
                    
                    res.json({
                        success: true,
                        bottleInfo: {
                            ...mergedResult,
                            drinkFrom: completeInfo.drinkFrom,
                            drinkTo: completeInfo.drinkTo,
                            foodPairing: completeInfo.foodPairing,
                            temperature: completeInfo.temperature,
                            analysisMethod: 'OCR Local + Mistral AI'
                        }
                    });
                    return;
                }
            } catch (mistralError) {
                console.log("Mistral non disponible, utilisation des résultats OCR seulement");
            }
            
            // Si Mistral échoue, utiliser les résultats OCR
            res.json({
                success: true,
                bottleInfo: ocrResult
            });
            return;
        }
        
        // Si OCR a échoué complètement, essayer avec Mistral directement sur le texte brut
        try {
            // Extraire le texte brut de l'image base64 (sans OCR)
            const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
            // On ne peut pas faire grand chose sans OCR, donc on utilise un fallback
            const fallbackInfo = {
                name: "Bouteille de vin",
                year: null,
                grapes: null,
                region: null,
                drinkFrom: null,
                drinkTo: null,
                foodPairing: "Viandes, Fromages, Plats variés",
                temperature: "10-12°C",
                analysisMethod: 'Fallback - OCR non disponible'
            };
            
            res.json({
                success: true,
                bottleInfo: fallbackInfo
            });
        } catch (error) {
            res.json({
                success: true,
                bottleInfo: {
                    name: "Bouteille de vin",
                    year: null,
                    grapes: null,
                    region: null,
                    drinkFrom: null,
                    drinkTo: null,
                    foodPairing: "Viandes, Fromages, Plats variés",
                    temperature: "10-12°C",
                    analysisMethod: 'Fallback'
                }
            });
        }
    } catch (error) {
        console.error("Erreur analyse IA base64 :", error);
        res.status(500).json({
            success: false,
            error: "Erreur serveur lors de l'analyse"
        });
    }
});

// Analyser avec texte uniquement (fallback)
router.post('/analyze-text', async (req, res) => {
    try {
        const { name, year, grapes, region } = req.body;
        
        if (name || year || grapes || region) {
            const bottleInfo = ai.extractBottleInfoFromText(
                `${name || ''} ${year || ''} ${grapes || ''} ${region || ''}`
            );
            return res.json({
                success: true,
                bottleInfo
            });
        }
        
        res.json({
            success: true,
            bottleInfo: {
                name: null,
                year: null,
                grapes: null,
                region: null,
                drinkFrom: null,
                drinkTo: null,
                foodPairing: "Viandes, Fromages, Plats variés",
                temperature: "10-12°C"
            }
        });
    } catch (error) {
        console.error("Erreur analyse texte :", error);
        res.status(500).json({
            success: false,
            error: "Erreur serveur"
        });
    }
});

// Ajouter ou mettre à jour une bouteille
router.post('/', upload.single('photo'), (req, res) => {
    const bottleData = req.body;
    
    // Si une photo a été uploadée, utiliser son nom de fichier
    if (req.file) {
        bottleData.photo = req.file.filename;
    }
    
    // Si on modifie une bouteille existante et qu'aucune nouvelle photo n'est fournie,
    // conserver l'ancienne photo (le frontend doit envoyer l'ancien nom de fichier)
    // NE PAS écraser bottleData.photo si c'est une chaîne vide ou undefined
    if (!req.file && (!bottleData.photo || bottleData.photo === 'undefined' || bottleData.photo === '')) {
        // Si c'est une modification, le frontend devrait envoyer l'ancien nom de photo
        // Sinon, on laisse bottleData.photo tel quel (peut être null pour une nouvelle bouteille)
        // Ne rien faire ici, le frontend gère ça
    }

    // Si une photo en base64 est fournie (depuis la galerie), la sauvegarder
    if (bottleData.photo && bottleData.photo.startsWith('data:image/')) {
        const base64Data = bottleData.photo.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const uploadDir = path.join(__dirname, '../../public/uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filename = Date.now() + '-camera.jpg';
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, buffer);
        bottleData.photo = filename;
    }

    database.saveBottle(bottleData, (err) => {
        if (err) {
            console.error("Erreur sauvegarde bouteille :", err);
            res.status(500).json({ error: "Erreur lors de la sauvegarde de la bouteille" });
        } else {
            res.json({ success: true });
        }
    });
});

// Supprimer une bouteille
router.delete('/', (req, res) => {
    const { row, col } = req.query;

    database.deleteBottle(row, col, (err) => {
        if (err) {
            res.status(500).json({ error: "Erreur lors de la suppression de la bouteille" });
        } else {
            res.json({ success: true });
        }
    });
});

// Obtenir des recommandations de vin
router.get('/recommendations', (req, res) => {
    const { occasion, food, budget } = req.query;
    const recommendations = ai.recommendWineForOccasion(occasion, food, budget);
    res.json({ success: true, recommendations });
});

// Rechercher un vin par nom
router.get('/search', (req, res) => {
    const { name } = req.query;
    if (!name) {
        return res.status(400).json({ success: false, error: "Le nom du vin est requis" });
    }
    const wineInfo = ai.searchWineByName(name);
    res.json({ success: wineInfo ? true : false, wine: wineInfo });
});

// Réinitialiser la base de données (NOUVEAU)
router.post('/reset-db', (req, res) => {
    try {
        const dbPath = path.join(__dirname, '../../data/cave.db');
        if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
        }
        res.json({ success: true, message: "Base de données réinitialisée" });
    } catch (error) {
        console.error("Erreur réinitialisation DB :", error);
        res.status(500).json({ success: false, error: "Erreur lors de la réinitialisation" });
    }
});

// Poser une question au chat IA (avec Mistral)
router.post('/chat', async (req, res) => {
    try {
        const { question } = req.body;
        
        if (!question) {
            return res.status(400).json({
                success: false,
                error: "Aucune question fournie"
            });
        }
        
        // Utiliser Mistral pour répondre à la question
        const response = await mistralAI.askChatQuestion(question);
        
        res.json({
            success: true,
            response: response,
            model: mistralConfig.model
        });
    } catch (error) {
        console.error("Erreur chat IA :", error);
        res.status(500).json({
            success: false,
            error: "Erreur serveur lors de la requête IA"
        });
    }
});

// Obtenir des conseils d'accords mets-vins avec Mistral
router.post('/wine-pairing', async (req, res) => {
    try {
        const { food } = req.body;
        
        if (!food) {
            return res.status(400).json({
                success: false,
                error: "Aucun plat spécifié"
            });
        }
        
        const advice = await mistralAI.getWinePairingAdvice(food);
        
        res.json({
            success: true,
            advice: advice
        });
    } catch (error) {
        console.error("Erreur accords mets-vins :", error);
        res.status(500).json({
            success: false,
            error: "Erreur serveur"
        });
    }
});

// Obtenir des informations sur un vin avec Mistral
router.post('/wine-info', async (req, res) => {
    try {
        const { wineName } = req.body;
        
        if (!wineName) {
            return res.status(400).json({
                success: false,
                error: "Aucun nom de vin spécifié"
            });
        }
        
        const info = await mistralAI.getWineInfo(wineName);
        
        res.json({
            success: true,
            info: info
        });
    } catch (error) {
        console.error("Erreur infos vin :", error);
        res.status(500).json({
            success: false,
            error: "Erreur serveur"
        });
    }
});

// Vérifier le statut de l'API Mistral
router.get('/mistral-status', (req, res) => {
    const hasApiKey = !!mistralConfig.apiKey;
    const model = mistralConfig.model || 'mistral-tiny';
    
    res.json({
        success: true,
        mistralAvailable: hasApiKey,
        model: model,
        message: hasApiKey ? "Mistral AI est configuré et prêt à être utilisé" : "Mistral AI n'est pas configuré (clé API manquante)"
    });
});

module.exports = router;
