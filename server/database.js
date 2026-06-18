const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Chemin vers la base de données
const dbPath = path.join(__dirname, '../data/cave.db');
let db;

// Initialiser la base de données
function initDatabase() {
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error("Erreur lors de l'ouverture de la base de données :", err);
            return;
        }
        console.log("Connecté à la base de données SQLite.");

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
                isConsumed BOOLEAN DEFAULT 0,
                consumedAt DATETIME,
                notes TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Table pour l'historique des actions
        db.run(`
            CREATE TABLE IF NOT EXISTS history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action TEXT NOT NULL, -- 'add', 'edit', 'delete', 'consume'
                bottleId INTEGER,
                bottleName TEXT,
                row INTEGER,
                col INTEGER,
                details TEXT, -- JSON avec les détails de l'action
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

// Marquer une bouteille comme consommée
function consumeBottle(row, col, callback) {
    db.get("SELECT * FROM bottles WHERE row = ? AND col = ?", [row, col], (err, bottle) => {
        if (err) {
            console.error("Erreur lors de la récupération de la bouteille :", err);
            callback(err);
            return;
        }
        if (!bottle) {
            callback(new Error("Bouteille non trouvée"));
            return;
        }

        db.run(
            "UPDATE bottles SET isConsumed = 1, consumedAt = CURRENT_TIMESTAMP WHERE row = ? AND col = ?",
            [row, col],
            function(err) {
                if (err) {
                    console.error("Erreur lors de la mise à jour de la bouteille :", err);
                    callback(err);
                } else {
                    callback(null, bottle);
                }
            }
        );
    });
}

// Ajouter une entrée dans l'historique
function addHistoryEntry(action, bottleId, bottleName, row, col, details, callback) {
    db.run(
        "INSERT INTO history (action, bottleId, bottleName, row, col, details) VALUES (?, ?, ?, ?, ?, ?)",
        [action, bottleId, bottleName, row, col, JSON.stringify(details)],
        function(err) {
            if (err) {
                console.error("Erreur lors de l'ajout à l'historique :", err);
                callback(err);
            } else {
                callback(null);
            }
        }
    );
}

// Récupérer l'historique
function getHistory(callback) {
    db.all("SELECT * FROM history ORDER BY createdAt DESC", (err, rows) => {
        if (err) {
            console.error("Erreur lors de la récupération de l'historique :", err);
            callback(err, null);
        } else {
            callback(null, rows);
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
    deleteBottle,
    consumeBottle,
    addHistoryEntry,
    getHistory
};
