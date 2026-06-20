// cave.js - Gestion de la grille de la cave à vin
// Version 5.0.0 - Avec barre de progression de maturation

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
                // Afficher la popup de configuration UNIQUEMENT si on est sur la page principale
                // et que la cave n'est pas encore configurée
                const caveConfigPopup = document.getElementById('caveConfigPopup');
                if (caveConfigPopup && !caveConfigPopup.classList.contains('active')) {
                    caveConfigPopup.classList.add('active');
                }
            }
        })
        .catch(error => {
            console.error("Erreur lors du chargement de la configuration :", error);
            // Ne pas afficher la popup de config en cas d'erreur, juste charger une grille par défaut
            caveRows = 5;
            caveCols = 10;
            loadCaveGrid();
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

    // Créer la grille
    const grid = document.createElement('div');
    grid.className = 'cave-grid';
    grid.style.gridTemplateColumns = `repeat(${caveCols}, minmax(70px, 1fr))`;
    caveContainer.appendChild(grid);

    for (let row = 0; row < caveRows; row++) {
        for (let col = 0; col < caveCols; col++) {
            const cell = document.createElement('div');
            cell.className = 'cave-cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            if (!caveGrid[row][col]) {
                cell.classList.add('empty');
                cell.innerHTML = '<div class="bottle-icon"></div>';
            } else {
                const bottle = caveGrid[row][col];
                const bottleName = bottle.name || 'Bouteille';
                const photoSrc = bottle.photo ? `/uploads/${bottle.photo}` : 'https://cdn-icons-png.flaticon.com/512/3173/3173612.png';
                
                // Calculer le statut de maturité
                const maturityStatus = getMaturityStatus(bottle.drinkFrom, bottle.drinkTo);
                
                // Calculer le pourcentage de maturation pour la barre de progression
                const maturityPercent = calculateMaturityPercentage(bottle.drinkFrom, bottle.drinkTo);
                
                // Texte de la période
                const periodText = bottle.drinkFrom && bottle.drinkTo ?
                    `${bottle.drinkFrom} - ${bottle.drinkTo}` : 'Non spécifié';

                cell.innerHTML = `
                    <img src="${photoSrc}" class="bottle-thumbnail" alt="${escapeHtml(bottleName)}">
                    <div class="bottle-name">${escapeHtml(bottleName)}</div>
                    <div class="bottle-period"><span class="period-text">${periodText}</span></div>
                    <div class="bottle-maturity-bar">
                        <div class="bottle-maturity-fill" style="width: ${maturityPercent}%"></div>
                    </div>
                    ${maturityStatus ? `<div class="bottle-maturity ${maturityStatus}">${getMaturityIcon(maturityStatus)}</div>` : ''}
                `;
            }

            // Gestion du clic sur une cellule
            cell.addEventListener('click', (e) => {
                e.stopPropagation(); // Empêcher la propagation du clic
                if (!caveGrid[row][col]) {
                    // Cellule vide : ouvrir le formulaire d'ajout
                    selectedCell = { row, col };
                    openAddBottlePopup();
                } else {
                    // Cellule occupée : ouvrir la popup de détails
                    selectedCell = { row, col };
                    openBottleDetailsPopup(caveGrid[row][col]);
                }
            });

            // Gestion du touch pour mobile (appui long pour les détails)
            cell.addEventListener('touchstart', (e) => {
                const touch = e.touches[0];
                const startTime = Date.now();
                
                cell.addEventListener('touchend', (endEvent) => {
                    const endTime = Date.now();
                    const duration = endTime - startTime;
                    
                    // Si appui court sur cellule vide
                    if (duration < 300 && !caveGrid[row][col]) {
                        selectedCell = { row, col };
                        openAddBottlePopup();
                    }
                    // Si appui long sur cellule occupée
                    else if (duration >= 300 && caveGrid[row][col]) {
                        selectedCell = { row, col };
                        openBottleDetailsPopup(caveGrid[row][col]);
                    }
                }, { once: true });
            });

            grid.appendChild(cell);
        }
    }
}

// Calculer le pourcentage de maturation
function calculateMaturityPercentage(drinkFrom, drinkTo) {
    if (!drinkFrom || !drinkTo) return 0;
    
    const currentYear = new Date().getFullYear();
    const startYear = parseInt(drinkFrom);
    const endYear = parseInt(drinkTo);
    
    if (isNaN(startYear) || isNaN(endYear)) return 0;
    
    const totalPeriod = endYear - startYear;
    if (totalPeriod <= 0) return 100;
    
    const elapsed = Math.min(currentYear - startYear, totalPeriod);
    const percentage = (elapsed / totalPeriod) * 100;
    
    return Math.min(Math.max(percentage, 0), 100);
}

// Ouvrir la popup d'ajout de bouteille
function openAddBottlePopup() {
    document.getElementById('popupTitle').innerHTML = '<i class="fas fa-wine-bottle"></i> Ajouter une bouteille';
    document.getElementById('bottleForm').reset();
    document.getElementById('bottlePhotoPreview').style.display = 'none';
    document.getElementById('bottlePopup').classList.add('active');

    // Retirer le focus de tous les champs pour éviter le curseur clignotant
    const inputs = document.querySelectorAll('#bottleForm input, #bottleForm textarea, #bottleForm button');
    inputs.forEach(input => input.blur());

    // Démarrer la sélection de fichier (galerie uniquement)
    window.camera.startCamera();
}

// Ouvrir la popup de détails d'une bouteille
function openBottleDetailsPopup(bottle) {
    document.getElementById('detailsTitle').innerHTML = '<i class="fas fa-info-circle"></i> <span>' + (bottle.name || 'Détails de la bouteille') + '</span>';
    
    // Retirer le focus pour éviter le curseur clignotant
    document.activeElement.blur();
    
    const photoSrc = bottle.photo ? `/uploads/${bottle.photo}` : 'https://cdn-icons-png.flaticon.com/512/3173/3173612.png';
    document.getElementById('detailsPhoto').src = photoSrc;
    document.getElementById('detailsName').textContent = bottle.name || 'Inconnu';
    document.getElementById('detailsYear').textContent = bottle.year || 'Inconnu';
    document.getElementById('detailsGrapes').textContent = bottle.grapes || 'Inconnu';
    document.getElementById('detailsRegion').textContent = bottle.region || 'Inconnu';
    document.getElementById('detailsDrinkPeriod').textContent = bottle.drinkFrom && bottle.drinkTo ?
        `${bottle.drinkFrom} - ${bottle.drinkTo}` : 'Non spécifié';
    document.getElementById('detailsFoodPairing').textContent = bottle.foodPairing || 'Non spécifié';
    document.getElementById('detailsTemperature').textContent = bottle.temperature || 'Non spécifié';

    // Mettre à jour la barre de période
    updateDrinkPeriodBar(bottle.drinkFrom, bottle.drinkTo);

    document.getElementById('bottleDetailsPopup').classList.add('active');
}

// Mettre à jour la barre de période de consommation
function updateDrinkPeriodBar(drinkFrom, drinkTo) {
    const bar = document.getElementById('drinkPeriodFill');
    const text = document.getElementById('drinkPeriodText');
    
    if (!bar || !text) return;
    
    const currentYear = new Date().getFullYear();
    
    if (drinkFrom && drinkTo) {
        // Calculer le pourcentage de la période écoulée
        const startYear = parseInt(drinkFrom);
        const endYear = parseInt(drinkTo);
        
        if (!isNaN(startYear) && !isNaN(endYear)) {
            const totalPeriod = endYear - startYear;
            const elapsed = Math.min(currentYear - startYear, totalPeriod);
            const percentage = (elapsed / totalPeriod) * 100;
            
            bar.style.width = `${Math.min(percentage, 100)}%`;
            text.textContent = `${drinkFrom} - ${drinkTo}`;
        } else {
            bar.style.width = '0%';
            text.textContent = 'Non spécifié';
        }
    } else {
        bar.style.width = '0%';
        text.textContent = 'Non spécifié';
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
        alert("Erreur lors de la sauvegarde de la configuration. Veuillez réessayer.");
    });
}

// Échapper le HTML pour éviter les injections XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Calculer le statut de maturité d'une bouteille
function getMaturityStatus(drinkFrom, drinkTo) {
    if (!drinkFrom || !drinkTo) return null;
    
    const currentYear = new Date().getFullYear();
    const startYear = parseInt(drinkFrom);
    const endYear = parseInt(drinkTo);
    
    if (isNaN(startYear) || isNaN(endYear)) return null;
    
    if (currentYear < startYear) {
        return 'waiting'; // À attendre
    } else if (currentYear >= startYear && currentYear <= endYear) {
        return 'ready'; // Prêt à boire
    } else {
        return 'past'; // À boire rapidement ou passé
    }
}

// Retourner l'icône de maturité
function getMaturityIcon(status) {
    switch(status) {
        case 'waiting':
            return '<i class="fas fa-hourglass-half"></i>';
        case 'ready':
            return '<i class="fas fa-check"></i>';
        case 'past':
            return '<i class="fas fa-exclamation-triangle"></i>';
        default:
            return '';
    }
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
    updateDrinkPeriodBar,
    calculateMaturityPercentage,
    getMaturityStatus,
    getMaturityIcon
};
