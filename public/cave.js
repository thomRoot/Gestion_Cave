// Variables globales
let caveRows = 5;
let caveCols = 10;
let caveGrid = []; // Tableau 2D représentant la cave
let selectedCell = null; // Cellule sélectionnée pour ajouter/modifier une bouteille

// Initialisation de la cave
function initCave() {
    // Vérifier si la cave est déjà configurée
    fetch('/api/cave/config')
        .then(response => response.json())
        .then(config => {
            if (config.configured) {
                caveRows = config.rows;
                caveCols = config.cols;
                loadCaveGrid();
            } else {
                // Afficher la popup de configuration
                document.getElementById('caveConfigPopup').style.display = 'flex';
            }
        })
        .catch(error => {
            console.error("Erreur lors du chargement de la configuration :", error);
            document.getElementById('caveConfigPopup').style.display = 'flex';
        });
}

// Charger la grille de la cave depuis le serveur
function loadCaveGrid() {
    fetch('/api/bottles')
        .then(response => response.json())
        .then(bottles => {
            // Initialiser la grille vide
            caveGrid = Array(caveRows).fill().map(() => Array(caveCols).fill(null));

            // Placer les bouteilles dans la grille
            bottles.forEach(bottle => {
                if (bottle.row >= 0 && bottle.row < caveRows && bottle.col >= 0 && bottle.col < caveCols) {
                    caveGrid[bottle.row][bottle.col] = bottle;
                }
            });

            // Générer l'affichage de la grille
            renderCaveGrid();
        })
        .catch(error => {
            console.error("Erreur lors du chargement des bouteilles :", error);
        });
}

// Générer l'affichage de la grille
function renderCaveGrid() {
    const caveContainer = document.getElementById('caveContainer');
    caveContainer.innerHTML = '';

    // Définir le nombre de colonnes CSS
    caveContainer.style.gridTemplateColumns = `repeat(${caveCols}, 80px)`;

    for (let row = 0; row < caveRows; row++) {
        for (let col = 0; col < caveCols; col++) {
            const cell = document.createElement('div');
            cell.className = 'cave-cell';
            if (!caveGrid[row][col]) {
                cell.classList.add('empty');
            } else {
                const bottle = caveGrid[row][col];
                // Si la bouteille est consommée, on la marque différemment
                if (bottle.isConsumed) {
                    cell.classList.add('consumed');
                    cell.innerHTML = `
                        <div class="bottle-icon consumed-icon"></div>
                        <div class="bottle-name">${bottle.name || 'Bouteille'} (Consommée)</div>
                    `;
                } else {
                    cell.innerHTML = `
                        <div class="bottle-icon"></div>
                        <div class="bottle-name">${bottle.name || 'Bouteille'}</div>
                    `;
                }
                cell.dataset.row = row;
                cell.dataset.col = col;
            }

            // Gestion du clic sur une cellule
            cell.addEventListener('click', () => {
                if (!caveGrid[row][col]) {
                    // Cellule vide : ouvrir le formulaire d'ajout
                    selectedCell = { row, col };
                    window.openAddBottlePopup();
                } else {
                    // Cellule occupée : ouvrir la popup de détails
                    selectedCell = { row, col };
                    window.openBottleDetailsPopup(caveGrid[row][col]);
                }
            });

            caveContainer.appendChild(cell);
        }
    }
}

// Ouvrir la popup d'ajout de bouteille
function openAddBottlePopup() {
    document.getElementById('popupTitle').textContent = 'Ajouter une bouteille';
    document.getElementById('bottleForm').reset();
    document.getElementById('bottlePhotoPreview').style.display = 'none';
    document.getElementById('bottlePopup').style.display = 'flex';

    // Démarrer la caméra
    window.camera.startCamera();
}

// Ouvrir la popup de détails d'une bouteille
function openBottleDetailsPopup(bottle) {
    document.getElementById('detailsTitle').textContent = bottle.name || 'Détails de la bouteille';
    document.getElementById('detailsPhoto').src = bottle.photo ? `/uploads/${bottle.photo}` : 'assets/bottle-icon.png';
    document.getElementById('detailsName').textContent = bottle.name || 'Inconnu';
    document.getElementById('detailsYear').textContent = bottle.year || 'Inconnu';
    document.getElementById('detailsGrapes').textContent = bottle.grapes || 'Inconnu';
    document.getElementById('detailsRegion').textContent = bottle.region || 'Inconnu';
    document.getElementById('detailsDrinkPeriod').textContent = bottle.drinkFrom && bottle.drinkTo ?
        `${bottle.drinkFrom} - ${bottle.drinkTo}` : 'Non spécifié';
    document.getElementById('detailsFoodPairing').textContent = bottle.foodPairing || 'Non spécifié';
    document.getElementById('detailsTemperature').textContent = bottle.temperature || 'Non spécifié';

    // Afficher les notes si disponibles
    const notesContainer = document.getElementById('detailsNotes');
    if (bottle.notes) {
        try {
            const notes = JSON.parse(bottle.notes);
            if (notes.rating || notes.reviews) {
                let notesHTML = '<p><strong>Notes et récompenses :</strong></p>';
                if (notes.source) {
                    notesHTML += `<p>Source : ${notes.source}</p>`;
                }
                if (notes.rating) {
                    notesHTML += `<p>⭐ Note : ${notes.rating}/100</p>`;
                }
                if (notes.reviews) {
                    notesHTML += `<p>📝 Avis : ${notes.reviews}</p>`;
                }
                if (notes.price) {
                    notesHTML += `<p>💰 Prix moyen : ${notes.price}€</p>`;
                }
                if (notes.link) {
                    notesHTML += `<p>🔗 <a href="${notes.link}" target="_blank">Voir sur ${notes.source}</a></p>`;
                }
                notesContainer.innerHTML = notesHTML;
            } else {
                notesContainer.innerHTML = '';
            }
        } catch (e) {
            notesContainer.innerHTML = '';
        }
    } else {
        notesContainer.innerHTML = '';
    }

    // Mettre à jour la barre de période
    updateDrinkPeriodBar(bottle.drinkFrom, bottle.drinkTo);

    document.getElementById('bottleDetailsPopup').style.display = 'flex';
}

// Mettre à jour la barre de période de consommation
function updateDrinkPeriodBar(drinkFrom, drinkTo) {
    const bar = document.getElementById('drinkPeriodBar');
    const currentYear = new Date().getFullYear();

    if (!drinkFrom || !drinkTo) {
        bar.className = 'period-bar';
        bar.style.width = '0%';
        return;
    }

    if (currentYear < drinkFrom) {
        bar.className = 'period-bar too-early';
        bar.style.width = '33%';
    } else if (currentYear >= drinkFrom && currentYear <= drinkTo) {
        bar.className = 'period-bar optimal';
        bar.style.width = '100%';
    } else {
        bar.className = 'period-bar too-late';
        bar.style.width = '33%';
    }
}

// Sauvegarder la configuration de la cave
function saveCaveConfig(rows, cols) {
    fetch('/api/cave/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, cols })
    })
    .then(response => response.json())
    .then(() => {
        caveRows = rows;
        caveCols = cols;
        document.getElementById('caveConfigPopup').style.display = 'none';
        loadCaveGrid();
    })
    .catch(error => {
        console.error("Erreur lors de la sauvegarde de la configuration :", error);
    });
}

// Exporter les fonctions pour les utiliser dans d'autres scripts
window.cave = {
    initCave,
    loadCaveGrid,
    renderCaveGrid,
    openAddBottlePopup,
    openBottleDetailsPopup,
    saveCaveConfig,
    getSelectedCell: () => selectedCell,
    getCaveGrid: () => caveGrid,
    setCaveGrid: (grid) => { caveGrid = grid; },
    updateDrinkPeriodBar
};
