const express = require('express');
const router = express.Router();
const database = require('../database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ai = require('../ai');
const mistralAI = require('../mistralAI');

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

// Analyser une bouteille avec l'IA (avec image uploadée)
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
            
            res.json({
                success: true,
                bottleInfo: result
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
                    temperature: "10-12°C"
                }
            });
        }
    } catch (error) {
        console.error("Erreur analyse IA :", error);
        res.status(500).json({
            success: false,
            error: "Erreur serveur lors de l'analyse"
        });
    }
});

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

module.exports = router;
