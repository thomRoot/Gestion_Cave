const express = require('express');
const router = express.Router();
const database = require('../database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ai = require('../ai');

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

// Analyser une bouteille avec l'IA (avec image compressée)
router.post('/analyze', upload.single('image'), async (req, res) => {
    try {
        let imagePath = null;
        
        // Si une image a été uploadée
        if (req.file) {
            imagePath = path.join(__dirname, '../../public/uploads', req.file.filename);
        }
        
        // Analyser avec l'IA locale
        const result = await ai.analyzeBottleImage(imagePath);
        
        if (result) {
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

module.exports = router;
