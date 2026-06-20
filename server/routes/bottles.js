const express = require('express');
const router = express.Router();
const database = require('../database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mistralAnalyzer = require('../mistralAnalyzer');
const mistralAI = require('../mistralAI');
const mistralConfig = require('../mistralConfig');

const ai = mistralAI;

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadDir = path.join(__dirname, '../../public/uploads');
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + path.extname(file.originalname));
        },
        limits: { fileSize: 5 * 1024 * 1024 }
    })
});

router.get('/', (req, res) => {
    database.getAllBottles((err, bottles) => {
        if (err) res.status(500).json({ error: "Erreur lors de la récupération des bouteilles" });
        else res.json(bottles);
    });
});

router.post('/analyze', upload.single('image'), async (req, res) => {
    try {
        let imagePath = null;
        if (req.file) imagePath = path.join(__dirname, '../../public/uploads', req.file.filename);
        const result = await mistralAnalyzer.analyzeBottleWithMistralOnly(imagePath, false);
        res.json({
            success: true,
            bottleInfo: result,
            mistralAvailable: !!mistralConfig.apiKey,
            googleVisionAvailable: !!process.env.GOOGLE_VISION_API_KEY,
            analysisMethod: result.analysisMethod,
            extractedText: result.extractedText
        });
    } catch (error) {
        console.error("Erreur analyse IA :", error);
        res.status(500).json({
            success: false,
            error: "Erreur serveur lors de l'analyse",
            mistralAvailable: !!mistralConfig.apiKey,
            googleVisionAvailable: !!process.env.GOOGLE_VISION_API_KEY,
            bottleInfo: mistralAnalyzer.getFallbackBottleInfo(error.message)
        });
    }
});

// NOUVEAU : Route pour l'analyse en 2 étapes (Google Vision → Mistral)
router.post('/analyze-two-step', upload.single('image'), async (req, res) => {
    try {
        let imagePath = null;
        if (req.file) imagePath = path.join(__dirname, '../../public/uploads', req.file.filename);
        
        // Récupérer les données manuelles si fournies
        const manualData = req.body.name || req.body.year ? {
            name: req.body.name || null,
            year: req.body.year ? parseInt(req.body.year) : null
        } : null;
        
        const result = await mistralAnalyzer.analyzeBottleWithTwoStepProcess(imagePath, false, manualData);
        
        res.json({
            success: true,
            bottleInfo: result,
            mistralAvailable: !!mistralConfig.apiKey,
            googleVisionAvailable: !!process.env.GOOGLE_VISION_API_KEY,
            analysisMethod: result.analysisMethod,
            extractedText: result.extractedText,
            requiresManualInput: result.requiresManualInput || false,
            partialData: result.partialData || null
        });
    } catch (error) {
        console.error("Erreur analyse IA 2 étapes :", error);
        res.status(500).json({
            success: false,
            error: "Erreur serveur lors de l'analyse",
            mistralAvailable: !!mistralConfig.apiKey,
            googleVisionAvailable: !!process.env.GOOGLE_VISION_API_KEY,
            bottleInfo: mistralAnalyzer.getFallbackBottleInfo(error.message),
            requiresManualInput: true,
            partialData: null
        });
    }
});

router.post('/analyze-text', async (req, res) => {
    try {
        const { name, year, grapes, region } = req.body;
        if (!name && !year && !grapes && !region) {
            return res.status(400).json({ success: false, error: "Au moins un champ est requis" });
        }
        const manualData = { name, year, grapes, region };
        const result = await mistralAnalyzer.analyzeWithManualText(manualData);
        res.json({ success: true, bottleInfo: result, analysisMethod: result.analysisMethod || "Analyse texte manuel" });
    } catch (error) {
        console.error("Erreur analyse texte :", error);
        res.status(500).json({ success: false, error: "Erreur serveur", bottleInfo: mistralAnalyzer.getFallbackBottleInfo(error.message) });
    }
});

router.post('/analyze-base64', async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) return res.status(400).json({ success: false, error: "Aucune image fournie" });
        const result = await mistralAnalyzer.analyzeBottleWithMistralOnly(image, true);
        res.json({ success: true, bottleInfo: result, mistralAvailable: !!mistralConfig.apiKey, analysisMethod: result.analysisMethod });
    } catch (error) {
        console.error("Erreur analyse base64 :", error);
        res.status(500).json({ success: false, error: "Erreur serveur", mistralAvailable: !!mistralConfig.apiKey, bottleInfo: mistralAnalyzer.getFallbackBottleInfo(error.message) });
    }
});

router.post('/', upload.single('photo'), (req, res) => {
    const bottleData = req.body;
    if (req.file) bottleData.photo = req.file.filename;
    if (bottleData.photo && bottleData.photo.startsWith('data:image/')) {
        // CORRECTION: regex avec backslashes correctement échappés
        const base64Data = bottleData.photo.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const uploadDir = path.join(__dirname, '../../public/uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        const filename = Date.now() + '-camera.jpg';
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, buffer);
        bottleData.photo = filename;
    }
    database.saveBottle(bottleData, (err) => {
        if (err) res.status(500).json({ error: "Erreur lors de la sauvegarde" });
        else res.json({ success: true });
    });
});

router.delete('/', (req, res) => {
    const { row, col } = req.query;
    database.deleteBottle(row, col, (err) => {
        if (err) res.status(500).json({ error: "Erreur lors de la suppression" });
        else res.json({ success: true });
    });
});

router.get('/recommendations', (req, res) => {
    const { occasion, food, budget } = req.query;
    const recommendations = mistralAI.recommendWineForOccasion(occasion, food, budget);
    res.json({ success: true, recommendations });
});

router.get('/search', (req, res) => {
    const { name } = req.query;
    if (!name) return res.status(400).json({ success: false, error: "Le nom du vin est requis" });
    const wineInfo = mistralAI.searchWineByName(name);
    res.json({ success: wineInfo ? true : false, wine: wineInfo });
});

router.post('/reset-db', (req, res) => {
    try {
        const dbPath = path.join(__dirname, '../../data/cave.db');
        if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
        res.json({ success: true, message: "Base de données réinitialisée" });
    } catch (error) {
        console.error("Erreur réinitialisation DB :", error);
        res.status(500).json({ success: false, error: "Erreur lors de la réinitialisation" });
    }
});

router.post('/chat', async (req, res) => {
    try {
        const { question } = req.body;
        if (!question) return res.status(400).json({ success: false, error: "Aucune question fournie" });
        const response = await mistralAI.askChatQuestion(question);
        res.json({ success: true, response: response, model: mistralConfig.model });
    } catch (error) {
        console.error("Erreur chat IA :", error);
        res.status(500).json({ success: false, error: "Erreur serveur lors de la requête IA" });
    }
});

router.post('/wine-pairing', async (req, res) => {
    try {
        const { food } = req.body;
        if (!food) return res.status(400).json({ success: false, error: "Aucun plat spécifié" });
        const advice = await mistralAI.getWinePairingAdvice(food);
        res.json({ success: true, advice: advice });
    } catch (error) {
        console.error("Erreur accords mets-vins :", error);
        res.status(500).json({ success: false, error: "Erreur serveur" });
    }
});

router.post('/wine-info', async (req, res) => {
    try {
        const { wineName } = req.body;
        if (!wineName) return res.status(400).json({ success: false, error: "Aucun nom de vin spécifié" });
        const info = await mistralAI.getWineInfo(wineName);
        res.json({ success: true, info: info });
    } catch (error) {
        console.error("Erreur infos vin :", error);
        res.status(500).json({ success: false, error: "Erreur serveur" });
    }
});

router.get('/mistral-status', (req, res) => {
    const hasMistralApiKey = !!mistralConfig.apiKey;
    const hasGoogleVisionApiKey = !!process.env.GOOGLE_VISION_API_KEY;
    const model = mistralConfig.model || 'mistral-tiny';
    res.json({
        success: true,
        mistralAvailable: hasMistralApiKey,
        googleVisionAvailable: hasGoogleVisionApiKey,
        model: model,
        message: hasMistralApiKey && hasGoogleVisionApiKey ?
            "Mistral AI et Google Vision sont configurés - Analyse complète disponible" :
            hasMistralApiKey ?
                "Mistral AI configuré, mais Google Vision non configuré (OCR limité)" :
                "Mistral AI n'est pas configuré (clé API manquante)"
    });
});

// Endpoint pour vérifier le statut de Google Vision uniquement
router.get('/google-status', (req, res) => {
    const hasGoogleVisionApiKey = !!process.env.GOOGLE_VISION_API_KEY;
    res.json({
        success: true,
        googleVisionAvailable: hasGoogleVisionApiKey
    });
});

module.exports = router;
