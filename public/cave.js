// cave.js - Gestion de la grille de la cave à vin v3.0 - Optimisé Mobile

// Variables globales
let caveRows = 5;
let caveCols = 10;
let caveGrid = []; // Tableau 2D représentant la cave
let selectedCell = null; // Cellule sélectionnée pour ajouter une bouteille
let isTouchDevice = false;

// Détecter si l'appareil est tactile
function detectTouchDevice() {
    isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
    return isTouchDevice;
}

// Initialisation de la cave
function initCave() {
    // Détecter le type d'appareil
    detectTouchDevice();
    
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
    
    // Adapter le nombre de colonnes pour mobile
    if (window.innerWidth < 400) {
        grid.style.gridTemplateColumns = `repeat(${Math.min(caveCols, 6)}, minmax(50px, 1fr))`;
    } else if (window.innerWidth < 768) {
        grid.style.gridTemplateColumns = `repeat(${Math.min(caveCols, 8)}, minmax(55px, 1fr))`;
    } else {
        grid.style.gridTemplateColumns = `repeat(${caveCols}, minmax(60px, 1fr))`;
    }
    
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
                    `${bottle.drinkFrom} - ${bottle.drinkTo}` : '';

                cell.classList.add('has-bottle');
                cell.innerHTML = `
                    <img src="${photoSrc}" class="bottle-thumbnail" alt="${escapeHtml(bottleName)}">
                    <div class="bottle-name">${escapeHtml(bottleName)}</div>
                    ${periodText ? `<div class="bottle-period"><span class="period-text">${periodText}</span></div>` : ''}
                    <div class="bottle-maturity-bar ${maturityStatus || ''}">
                        <div class="bottle-maturity-fill" style="width: ${maturityPercent}%"></div>
                    </div>
                `;
            }

            // Gestion du clic sur une cellule
            cell.addEventListener('click', (e) => {
                e.stopPropagation(); // Empêcher la propagation du clic
                handleCellClick(row, col);
            });

            // Gestion du touch pour mobile
            if (isTouchDevice) {
                let touchTimer = null;
                
                cell.addEventListener('touchstart', (e) => {
                    // Empêcher le comportement par défaut pour éviter les conflits
                    e.preventDefault();
                    
                    // Démarrer un timer pour détecter un appui long
                    touchTimer = setTimeout(() => {
                        // Appui long : ouvrir les détails
                        if (caveGrid[row][col]) {
                            selectedCell = { row, col };
                            openBottleDetailsPopup(caveGrid[row][col]);
                        }
                    }, 500); // 500ms pour un appui long
                }, { passive: false });

                cell.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    // Annuler le timer
                    if (touchTimer) {
                        clearTimeout(touchTimer);
                        touchTimer = null;
                    }
                    
                    // Appui court : gérer comme un clic normal
                    handleCellClick(row, col);
                }, { passive: false });

                cell.addEventListener('touchcancel', () => {
                    if (touchTimer) {
                        clearTimeout(touchTimer);
                        touchTimer = null;
                    }
                });
            }

            grid.appendChild(cell);
        }
    }
    
    // Réinitialiser la cellule sélectionnée
    selectedCell = null;
}

// Gérer le clic sur une cellule
function handleCellClick(row, col) {
    if (!caveGrid[row][col]) {
        // Cellule vide : ouvrir le formulaire d'ajout
        selectedCell = { row, col };
        openAddBottlePopup();
    } else {
        // Cellule occupée : ouvrir la popup de détails
        selectedCell = { row, col };
        openBottleDetailsPopup(caveGrid[row][col]);
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
    
    // Calculer le statut pour savoir quelle couleur utiliser
    const status = getMaturityStatus(drinkFrom, drinkTo);
    
    if (status === 'waiting') {
        // Avant la période : progression de l'année courante vers drinkFrom
        const yearsUntilReady = startYear - currentYear;
        const maxWaitingPeriod = Math.max(totalPeriod, 15); // Utiliser la période totale ou 15 ans max
        // Calculer le pourcentage : 0% si on est très loin, 100% si on est à drinkFrom
        const waitingProgress = 100 - Math.min((yearsUntilReady / maxWaitingPeriod) * 100, 100);
        return Math.max(waitingProgress, 0);
    } else if (status === 'ready') {
        // Pendant la période : progression de drinkFrom à drinkTo
        const elapsed = currentYear - startYear;
        const percentage = (elapsed / totalPeriod) * 100;
        return Math.min(Math.max(percentage, 0), 100);
    } else {
        // Après la période : 100%
        return 100;
    }
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

    // Ouvrir directement la boîte de dialogue pour sélectionner une image
    const photoUpload = document.getElementById('photoUpload');
    if (photoUpload) {
        photoUpload.click();
    }
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
    const range = document.getElementById('drinkPeriodRange');
    
    if (!bar || !text) return;
    
    const currentYear = new Date().getFullYear();
    
    // Calculer le statut de maturité
    const maturityStatus = getMaturityStatus(drinkFrom, drinkTo);
    
    if (drinkFrom && drinkTo) {
        // Calculer le pourcentage de la période écoulée
        const startYear = parseInt(drinkFrom);
        const endYear = parseInt(drinkTo);
        
        if (!isNaN(startYear) && !isNaN(endYear)) {
            const totalPeriod = endYear - startYear;
            let percentage = 0;
            
            if (maturityStatus === 'waiting') {
                // Avant la période : progression de l'année courante vers drinkFrom
                const yearsUntilReady = startYear - currentYear;
                const maxWaitingPeriod = Math.max(totalPeriod, 15);
                percentage = 100 - Math.min((yearsUntilReady / maxWaitingPeriod) * 100, 100);
            } else if (maturityStatus === 'ready') {
                // Pendant la période : progression de drinkFrom à drinkTo
                const elapsed = currentYear - startYear;
                percentage = (elapsed / totalPeriod) * 100;
            } else {
                // Après la période : 100%
                percentage = 100;
            }
            
            bar.style.width = `${Math.min(Math.max(percentage, 0), 100)}%`;
            text.textContent = `${drinkFrom} - ${drinkTo}`;
            
            // Appliquer la classe de statut pour la couleur
            if (range) {
                range.className = `period-range ${maturityStatus}`;
            }
        } else {
            bar.style.width = '0%';
            text.textContent = 'Non spécifié';
            if (range) {
                range.className = 'period-range';
            }
        }
    } else {
        bar.style.width = '0%';
        text.textContent = 'Non spécifié';
        if (range) {
            range.className = 'period-range';
        }
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

// Adapter la grille au redimensionnement de la fenêtre
function handleResize() {
    // Re-rendre la grille avec les nouvelles dimensions
    renderCaveGrid();
}

// Ajouter un écouteur de redimensionnement avec un délai pour éviter les calculs inutiles
let resizeTimeout = null;
window.addEventListener('resize', () => {
    if (resizeTimeout) {
        clearTimeout(resizeTimeout);
    }
    resizeTimeout = setTimeout(handleResize, 250);
});

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
    getMaturityIcon,
    handleCellClick
};
