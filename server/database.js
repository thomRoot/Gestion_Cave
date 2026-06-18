const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Chemin vers la base de données - utiliser un chemin absolu ou temporaire
// Essayer plusieurs chemins pour compatibilité (NAS Synology, Docker, local)
function getDbPath() {
    const possiblePaths = [
        // 1. Chemin standard (local)
        path.join(__dirname, '../data/cave.db'),
        // 2. Chemin absolu dans /workspace
        '/workspace/thomRoot__Gestion_Cave/data/cave.db',
        // 3. Dossier temporaire (pour Docker/NAS)
        path.join(__dirname, '../cave.db'),
        // 4. Dossier courant
        './cave.db',
        // 5. Dossier /tmp (pour systèmes restreints)
        '/tmp/cave.db'
    ];

    // Trouver le premier chemin valide
    for (const dbPath of possiblePaths) {
        try {
            const dir = path.dirname(dbPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            // Tester si on peut écrire dans le dossier
            const testFile = path.join(dir, '.write_test');
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            return dbPath;
        } catch (e) {
            // Essayer le chemin suivant
            continue;
        }
    }

    // Si aucun chemin ne fonctionne, utiliser :memory: (base en mémoire)
    console.warn("Aucun chemin valide trouvé pour la base de données, utilisation de la mémoire temporaire");
    return ':memory:';
}

const dbPath = getDbPath();
let db;

// Initialiser la base de données
function initDatabase() {
    console.log(`Tentative de connexion à la base de données : ${dbPath}`);
    
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error("Erreur lors de l'ouverture de la base de données :", err);
            console.log("Essayez de créer manuellement le dossier 'data/' avec : mkdir -p data && chmod 755 data");
            return;
        }
        console.log(`Connecté à la base de données SQLite (${dbPath}).`);

        // Créer les tables si elles n'existent pas
        createTables();
    });
}

// Créer les tables
function createTables() {
    db.serialize(() => {
        // Table pour la configuration de la cave
        db.run(`
            CREATE TABLE IF NOT EXISTS cave_config (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                rows INTEGER NOT NULL,
                cols INTEGER NOT NULL,
                configured BOOLEAN DEFAULT 0
            )
        `);

        // Table pour les bouteilles
        db.run(`
            CREATE TABLE IF NOT EXISTS bottles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                row INTEGER NOT NULL,
                col INTEGER NOT NULL,
                name TEXT,
                year INTEGER,
                grapes TEXT,
                region TEXT,
                drinkFrom INTEGER,
                drinkTo INTEGER,
                foodPairing TEXT,
                temperature TEXT,
                photo TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Vérifier si la cave est déjà configurée
        db.get("SELECT * FROM cave_config LIMIT 1", (err, row) => {
            if (err) {
                console.error("Erreur lors de la vérification de la configuration :", err);
                return;
            }
            if (!row) {
                // Initialiser avec une configuration par défaut
                db.run("INSERT INTO cave_config (rows, cols, configured) VALUES (5, 10, 0)");
            }
        });
    });
}

// Sauvegarder la configuration de la cave
function saveCaveConfig(rows, cols, callback) {
    db.run(
        "UPDATE cave_config SET rows = ?, cols = ?, configured = 1",
        [rows, cols],
        function(err) {
            if (err) {
                console.error("Erreur lors de la sauvegarde de la configuration :", err);
                callback(err);
            } else {
                callback(null);
            }
        }
    );
}

// Récupérer la configuration de la cave
function getCaveConfig(callback) {
    db.get("SELECT * FROM cave_config LIMIT 1", (err, row) => {
        if (err) {
            console.error("Erreur lors de la récupération de la configuration :", err);
            callback(err, null);
        } else {
            callback(null, row);
        }
    });
}

// Ajouter ou mettre à jour une bouteille
function saveBottle(bottleData, callback) {
    const { row, col, name, year, grapes, region, drinkFrom, drinkTo, foodPairing, temperature, photo } = bottleData;

    // Vérifier si une bouteille existe déjà à cet emplacement
    db.get(
        "SELECT * FROM bottles WHERE row = ? AND col = ?",
        [row, col],
        (err, existingBottle) => {
            if (err) {
                console.error("Erreur lors de la vérification de la bouteille existante :", err);
                callback(err);
                return;
            }

            if (existingBottle) {
                // Mettre à jour la bouteille existante
                db.run(
                    `UPDATE bottles SET
                        name = ?,
                        year = ?,
                        grapes = ?,
                        region = ?,
                        drinkFrom = ?,
                        drinkTo = ?,
                        foodPairing = ?,
                        temperature = ?,
                        photo = ?
                    WHERE row = ? AND col = ?`,
                    [name, year, grapes, region, drinkFrom, drinkTo, foodPairing, temperature, photo, row, col],
                    function(err) {
                        if (err) {
                            console.error("Erreur lors de la mise à jour de la bouteille :", err);
                            callback(err);
                        } else {
                            callback(null);
                        }
                    }
                );
            } else {
                // Ajouter une nouvelle bouteille
                db.run(
                    `INSERT INTO bottles
                    (row, col, name, year, grapes, region, drinkFrom, drinkTo, foodPairing, temperature, photo)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [row, col, name, year, grapes, region, drinkFrom, drinkTo, foodPairing, temperature, photo],
                    function(err) {
                        if (err) {
                            console.error("Erreur lors de l'ajout de la bouteille :", err);
                            callback(err);
                        } else {
                            callback(null);
                        }
                    }
                );
            }
        }
    );
}

// Récupérer toutes les bouteilles
function getAllBottles(callback) {
    db.all("SELECT * FROM bottles", (err, rows) => {
        if (err) {
            console.error("Erreur lors de la récupération des bouteilles :", err);
            callback(err, null);
        } else {
            callback(null, rows);
        }
    });
}

// Supprimer une bouteille
function deleteBottle(row, col, callback) {
    db.run("DELETE FROM bottles WHERE row = ? AND col = ?", [row, col], function(err) {
        if (err) {
            console.error("Erreur lors de la suppression de la bouteille :", err);
            callback(err);
        } else {
            callback(null);
        }
    });
}

// Exporter les fonctions
module.exports = {
    initDatabase,
    saveCaveConfig,
    getCaveConfig,
    saveBottle,
    getAllBottles,
    deleteBottle
};
