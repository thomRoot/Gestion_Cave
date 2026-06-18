// Initialiser la cave au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    window.cave.initCave();

    // Gestion de la configuration de la cave
    document.getElementById('caveConfigForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const rows = parseInt(document.getElementById('caveRows').value);
        const cols = parseInt(document.getElementById('caveCols').value);
        window.cave.saveCaveConfig(rows, cols);
    });

    // Gestion du formulaire d'ajout/modification de bouteille
    document.getElementById('bottleForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveBottle();
    });

    // Gestion de la recherche
    document.getElementById('searchButton').addEventListener('click', performSearch);
    document.getElementById('searchInput').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Gestion des boutons de la popup de détails
    document.getElementById('editBottleButton').addEventListener('click', () => {
        const selectedCell = window.cave.getSelectedCell();
        if (selectedCell) {
            const bottle = window.cave.getCaveGrid()[selectedCell.row][selectedCell.col];
            openEditBottlePopup(bottle);
        }
    });

    document.getElementById('consumeBottleButton').addEventListener('click', () => {
        const selectedCell = window.cave.getSelectedCell();
        if (selectedCell) {
            consumeBottle(selectedCell.row, selectedCell.col);
        }
    });

    document.getElementById('deleteBottleButton').addEventListener('click', () => {
        const selectedCell = window.cave.getSelectedCell();
        if (selectedCell) {
            deleteBottle(selectedCell.row, selectedCell.col);
        }
    });

    // Gestion du bouton Historique
    document.getElementById('historyButton').addEventListener('click', openHistoryPopup);

    // Gestion des boutons de fermeture des popups
    document.querySelectorAll('.popup .close').forEach(closeButton => {
        closeButton.addEventListener('click', () => {
            closeButton.closest('.popup').style.display = 'none';
            window.camera.stopCamera();
        });
    });

    // Fermer la popup d'historique en cliquant à l'extérieur
    document.getElementById('historyPopup').addEventListener('click', (e) => {
        if (e.target === document.getElementById('historyPopup')) {
            e.target.style.display = 'none';
        }
    });

    // Fermer les popups en cliquant à l'extérieur
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('popup')) {
            e.target.style.display = 'none';
            window.camera.stopCamera();
        }
    });

    // Gestion du bouton "Ajouter une bouteille"
    document.getElementById('addBottleButton').addEventListener('click', () => {
        window.cave.openAddBottlePopup();
    });
});

// Sauvegarder une bouteille
function saveBottle() {
    const selectedCell = window.cave.getSelectedCell();
    if (!selectedCell) return;

    const form = document.getElementById('bottleForm');
    const photoPreview = document.getElementById('bottlePhotoPreview');
    const photoDataUrl = photoPreview.src;

    // Récupérer les données du formulaire
    const bottleData = {
        row: selectedCell.row,
        col: selectedCell.col,
        name: document.getElementById('bottleName').value,
        year: document.getElementById('bottleYear').value,
        grapes: document.getElementById('bottleGrapes').value,
        region: document.getElementById('bottleRegion').value,
        drinkFrom: document.getElementById('bottleDrinkFrom').value,
        drinkTo: document.getElementById('bottleDrinkTo').value,
        foodPairing: document.getElementById('bottleFoodPairing').value,
        temperature: document.getElementById('bottleTemperature')?.value || null,
        photo: photoDataUrl
    };

    // Envoyer les données au serveur
    fetch('/api/bottles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bottleData)
    })
    .then(response => response.json())
    .then(() => {
        // Fermer la popup et recharger la grille
        document.getElementById('bottlePopup').style.display = 'none';
        window.cave.loadCaveGrid();
        window.camera.stopCamera();
    })
    .catch(error => {
        console.error("Erreur lors de la sauvegarde de la bouteille :", error);
    });
}

// Ouvrir la popup de modification de bouteille
function openEditBottlePopup(bottle) {
    document.getElementById('popupTitle').textContent = 'Modifier la bouteille';
    document.getElementById('bottleName').value = bottle.name || '';
    document.getElementById('bottleYear').value = bottle.year || '';
    document.getElementById('bottleGrapes').value = bottle.grapes || '';
    document.getElementById('bottleRegion').value = bottle.region || '';
    document.getElementById('bottleDrinkFrom').value = bottle.drinkFrom || '';
    document.getElementById('bottleDrinkTo').value = bottle.drinkTo || '';
    document.getElementById('bottleFoodPairing').value = bottle.foodPairing || '';
    document.getElementById('bottleTemperature').value = bottle.temperature || '';

    if (bottle.photo) {
        document.getElementById('bottlePhotoPreview').src = `/uploads/${bottle.photo}`;
        document.getElementById('bottlePhotoPreview').style.display = 'block';
    } else {
        document.getElementById('bottlePhotoPreview').style.display = 'none';
    }

    document.getElementById('bottlePopup').style.display = 'flex';
}

// Supprimer une bouteille
function deleteBottle(row, col) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette bouteille ?')) {
        return;
    }

    fetch(`/api/bottles?row=${row}&col=${col}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(() => {
        document.getElementById('bottleDetailsPopup').style.display = 'none';
        window.cave.loadCaveGrid();
    })
    .catch(error => {
        console.error("Erreur lors de la suppression de la bouteille :", error);
    });
}

// Consommer une bouteille (la retirer de la cave)
function consumeBottle(row, col) {
    if (!confirm('Êtes-vous sûr de vouloir retirer cette bouteille de la cave (marquée comme consommée) ?')) {
        return;
    }

    fetch('/api/bottles/consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ row, col })
    })
    .then(response => response.json())
    .then(() => {
        document.getElementById('bottleDetailsPopup').style.display = 'none';
        window.cave.loadCaveGrid();
    })
    .catch(error => {
        console.error("Erreur lors de la consommation de la bouteille :", error);
    });
}

// Ouvrir la popup d'historique
function openHistoryPopup() {
    fetch('/api/bottles/history')
        .then(response => response.json())
        .then(history => {
            const historyList = document.getElementById('historyList');
            historyList.innerHTML = '';

            if (history.length === 0) {
                historyList.innerHTML = '<p>Aucune action enregistrée.</p>';
            } else {
                history.forEach(item => {
                    const actionText = getActionText(item.action);
                    const date = new Date(item.createdAt).toLocaleString('fr-FR');
                    const historyItem = document.createElement('div');
                    historyItem.className = 'history-item';
                    historyItem.innerHTML = `
                        <div class="history-action">
                            <strong>${actionText}</strong>
                            <span class="history-date">${date}</span>
                        </div>
                        <div class="history-details">
                            ${item.bottleName ? `Bouteille : ${item.bottleName}` : ''}
                            ${item.row !== null && item.col !== null ? ` | Position : (${item.row}, ${item.col})` : ''}
                        </div>
                    `;
                    historyList.appendChild(historyItem);
                });
            }

            document.getElementById('historyPopup').style.display = 'flex';
        })
        .catch(error => {
            console.error("Erreur lors du chargement de l'historique :", error);
        });
}

// Retourne le texte de l'action
function getActionText(action) {
    const actions = {
        'add': '➕ Ajout d\'une bouteille',
        'edit': '✏️ Modification d\'une bouteille',
        'delete': '🗑️ Suppression d\'une bouteille',
        'consume': '🍷 Consommation d\'une bouteille'
    };
    return actions[action] || action;
}

// Effectuer une recherche
function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (!searchTerm) {
        // Réinitialiser le surlignage
        document.querySelectorAll('.cave-cell').forEach(cell => {
            cell.classList.remove('highlight');
        });
        return;
    }

    // Récupérer toutes les bouteilles
    const grid = window.cave.getCaveGrid();
    const bottles = grid.flat().filter(bottle => bottle !== null);

    // Filtrer les bouteilles correspondantes
    const matchingBottles = bottles.filter(bottle => {
        return (
            (bottle.name && bottle.name.toLowerCase().includes(searchTerm)) ||
            (bottle.year && bottle.year.toString().includes(searchTerm)) ||
            (bottle.grapes && bottle.grapes.toLowerCase().includes(searchTerm)) ||
            (bottle.region && bottle.region.toLowerCase().includes(searchTerm)) ||
            (bottle.foodPairing && bottle.foodPairing.toLowerCase().includes(searchTerm))
        );
    });

    // Surligner les bouteilles correspondantes dans la grille
    document.querySelectorAll('.cave-cell').forEach(cell => {
        cell.classList.remove('highlight');
    });

    matchingBottles.forEach(bottle => {
        const cell = document.querySelector(`.cave-cell[data-row="${bottle.row}"][data-col="${bottle.col}"]`);
        if (cell) {
            cell.classList.add('highlight');
        }
    });
}

// Exporter les fonctions pour les utiliser dans d'autres scripts
window.openAddBottlePopup = window.cave.openAddBottlePopup;
window.openBottleDetailsPopup = window.cave.openBottleDetailsPopup;
