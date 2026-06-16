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

// Ajouter ou mettre à jour une bouteille
router.post('/', upload.single('photo'), (req, res) => {
    const bottleData = req.body;
    
    // Si une photo a été uploadée, utiliser son nom de fichier
    if (req.file) {
        bottleData.photo = req.file.filename;
    }

    // Si une photo en base64 est fournie (depuis la caméra), la sauvegarder
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

module.exports = router;
