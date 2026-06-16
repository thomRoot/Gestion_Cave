const express = require('express');
const router = express.Router();
const database = require('../database');

// Récupérer la configuration de la cave
router.get('/config', (req, res) => {
    database.getCaveConfig((err, config) => {
        if (err) {
            res.status(500).json({ error: "Erreur lors de la récupération de la configuration" });
        } else {
            res.json(config || { configured: false });
        }
    });
});

// Sauvegarder la configuration de la cave
router.post('/config', (req, res) => {
    const { rows, cols } = req.body;

    database.saveCaveConfig(rows, cols, (err) => {
        if (err) {
            res.status(500).json({ error: "Erreur lors de la sauvegarde de la configuration" });
        } else {
            res.json({ success: true });
        }
    });
});

module.exports = router;
