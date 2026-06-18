const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const database = require('./database');
const ai = require('./ai');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration de Multer pour l'upload des photos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../public/uploads');
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
        fileSize: 5 * 1024 * 1024 // Limite à 5Mo
    }
});

const upload = multer({ storage });

// Middleware - Augmenter la limite de taille pour les requêtes JSON
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Routes
const bottleRoutes = require('./routes/bottles');
const caveRoutes = require('./routes/cave');

app.use('/api/bottles', bottleRoutes);
app.use('/api/cave', caveRoutes);

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
    database.initDatabase();
});

module.exports = app;
