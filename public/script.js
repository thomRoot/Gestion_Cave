// script.js - Gestion principale de l'application Ma Cave à Vin
// Version 2.0 avec intégration IA locale

// Variables globales
let currentBottleImage = null;

// Initialiser l'application au chargement de la page
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

    document.getElementById('deleteBottleButton').addEventListener('click', () => {
        const selectedCell = window.cave.getSelectedCell();
        if (selectedCell) {
            deleteBottle(selectedCell.row, selectedCell.col);
        }
    });

    // Gestion des boutons de fermeture des popups
    document.querySelectorAll('.popup .close').forEach(closeButton => {
        closeButton.addEventListener('click', () => {
            closeButton.closest('.popup').style.display = 'none';
            window.camera.stopCamera();
            resetLoadingOverlay();
        });
    });

    // Fermer les popups en cliquant à l'extérieur
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('popup')) {
            e.target.style.display = 'none';
            window.camera.stopCamera();
            resetLoadingOverlay();
        }
    });

    // Gestion du bouton "Ajouter une bouteille" (header)
    document.getElementById('addBottleButton').addEventListener('click', () => {
        window.cave.openAddBottlePopup();
    });

    // Gestion du bouton flottant mobile
    document.getElementById('mobileAddButton').addEventListener('click', () => {
        window.cave.openAddBottlePopup();
    });

    // Gestion du bouton "Aide IA"
    document.getElementById('aiHelpButton').addEventListener('click', () => {
        openAIHelpPopup();
    });

    // Gestion du bouton "Analyser avec IA"
    document.getElementById('analyzeWithAI').addEventListener('click', analyzeWithAI);

    // Gestion de l'envoi de message à l'IA
    document.getElementById('aiSendButton').addEventListener('click', sendAIPrompt);
    document.getElementById('aiPromptInput').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            sendAIPrompt();
        }
    });
});

// Ouvrir la popup d'aide IA
function openAIHelpPopup() {
    const popup = document.getElementById('aiHelpPopup');
    popup.style.display = 'flex';
    
    // Effacer les anciens messages (sauf le message de bienvenue)
    const messagesContainer = document.getElementById('aiMessages');
    const welcomeMessage = messagesContainer.querySelector('.ai-message.bot');
    if (welcomeMessage) {
        messagesContainer.innerHTML = '';
        messagesContainer.appendChild(welcomeMessage);
    }
    
    // Focus sur l'input
    document.getElementById('aiPromptInput').focus();
}

// Envoyer un prompt à l'IA
function sendAIPrompt() {
    const input = document.getElementById('aiPromptInput');
    const prompt = input.value.trim();
    
    if (!prompt) return;
    
    // Ajouter le message de l'utilisateur
    addAIMessage(prompt, 'user');
    input.value = '';
    
    // Simuler une réponse de l'IA (en attendant l'intégration réelle)
    setTimeout(() => {
        const aiResponse = generateAIResponse(prompt);
        addAIMessage(aiResponse, 'bot');
    }, 500);
}

// Ajouter un message à la conversation IA
function addAIMessage(message, type) {
    const messagesContainer = document.getElementById('aiMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ${type}`;
    messageDiv.innerHTML = `<div class="message-content">${formatAIMessage(message)}</div>`;
    messagesContainer.appendChild(messageDiv);
    
    // Scroll vers le bas
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Formater un message IA
function formatAIMessage(message) {
    // Remplacer les sauts de ligne par des balises <br>
    return message.replace(/\n/g, '<br>');
}

// Générer une réponse IA (simulée pour l'instant)
function generateAIResponse(prompt) {
    const promptLower = prompt.toLowerCase();
    
    // Réponses basées sur des mots-clés
    if (promptLower.includes('bonjour') || promptLower.includes('salut') || promptLower.includes('hello')) {
        return "Bonjour ! Comment puis-je vous aider avec votre cave à vin aujourd'hui ?";
    }
    
    if (promptLower.includes('comment ça marche') || promptLower.includes('comment utiliser')) {
        return "C'est simple ! Prenez une photo de votre bouteille de vin ou téléchargez-en une depuis votre galerie. " +
               "Ensuite, cliquez sur 'Analyser avec IA' et je remplirai automatiquement tous les champs pour vous : " +
               "nom, année, cépage, région, période optimale de consommation, accords mets-vins et température de service.";
    }
    
    if (promptLower.includes('reconnaître') || promptLower.includes('photo') || promptLower.includes('image')) {
        return "Pour reconnaître une bouteille, ouvrez le formulaire d'ajout, prenez une photo ou téléchargez une image, " +
               "puis cliquez sur 'Analyser avec IA'. Je vais extraire le texte de l'étiquette et identifier les informations du vin.";
    }
    
    if (promptLower.includes('accords') || promptLower.includes('mets') || promptLower.includes('nourriture')) {
        return "Je peux vous conseiller sur les accords mets-vins ! Dites-moi quel vin vous avez ou quel plat vous préparez, " +
               "et je vous suggérerai les meilleures associations. Par exemple : 'Quel vin avec du bœuf ?' ou 'Que boire avec du fromage ?'";
    }
    
    if (promptLower.includes('température') || promptLower.includes('servir')) {
        return "La température de service idéale dépend du type de vin : " +
               "16-18°C pour les vins rouges, 10-12°C pour les blancs, et 6-8°C pour les champagnes. " +
               "Je peux vous donner la température exacte pour chaque bouteille que vous ajoutez.";
    }
    
    if (promptLower.includes('période') || promptLower.includes('boire') || promptLower.includes('conserver')) {
        return "La période optimale de consommation dépend du millésime et du cépage. " +
               "Par exemple, un Bordeaux 2015 peut se boire de 2025 à 2035. " +
               "Je calcule automatiquement ces dates en fonction des informations de la bouteille.";
    }
    
    if (promptLower.includes('merci') || promptLower.includes('thank')) {
        return "Avec plaisir ! N'hésitez pas si vous avez d'autres questions sur votre cave à vin. 🍷";
    }
    
    // Réponse par défaut
    return "Je suis là pour vous aider avec votre cave à vin. Vous pouvez me demander comment reconnaître une bouteille, " +
           "quels accords mets-vins choisir, ou toute autre question sur le vin !";
}

// Afficher le loading overlay
function showLoadingOverlay(message = 'Analyse en cours...') {
    const overlay = document.getElementById('loadingOverlay');
    const spinner = overlay.querySelector('p');
    if (spinner) {
        spinner.textContent = message;
    }
    overlay.style.display = 'flex';
}

// Masquer le loading overlay
function resetLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// Analyser une bouteille avec l'IA
async function analyzeWithAI() {
    // Vérifier qu'une image est disponible
    if (!window.camera.hasImage()) {
        alert("Veuillez d'abord prendre une photo ou télécharger une image de la bouteille.");
        return;
    }

    // Afficher le loading
    showLoadingOverlay('Analyse de l\'image en cours...');

    try {
        // Récupérer l'image actuelle
        const imageDataUrl = window.camera.getCurrentImage();
        
        // Envoyer l'image au serveur pour analyse IA
        const response = await fetch('/api/bottles/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image: imageDataUrl
            })
        });

        const result = await response.json();

        if (result.success && result.bottleInfo) {
            // Remplir automatiquement les champs du formulaire
            fillBottleFormWithAIResult(result.bottleInfo);
            
            // Afficher un message de succès
            alert(`Analyse terminée ! J'ai identifié : ${result.bottleInfo.name || 'une bouteille de vin'}. Les champs ont été remplis automatiquement.`);
        } else {
            alert("Je n'ai pas pu identifier clairement cette bouteille. Veuillez vérifier la qualité de la photo ou remplir manuellement les informations.");
        }
    } catch (error) {
        console.error("Erreur lors de l'analyse IA :", error);
        alert("Une erreur est survenue lors de l'analyse. Veuillez réessayer.");
    } finally {
        resetLoadingOverlay();
    }
}

// Remplir le formulaire avec les résultats de l'IA
function fillBottleFormWithAIResult(bottleInfo) {
    // Remplir les champs un par un
    if (bottleInfo.name) {
        document.getElementById('bottleName').value = bottleInfo.name;
    }
    
    if (bottleInfo.year) {
        document.getElementById('bottleYear').value = bottleInfo.year;
    }
    
    if (bottleInfo.grapes) {
        document.getElementById('bottleGrapes').value = bottleInfo.grapes;
    }
    
    if (bottleInfo.region) {
        document.getElementById('bottleRegion').value = bottleInfo.region;
    }
    
    if (bottleInfo.drinkFrom) {
        document.getElementById('bottleDrinkFrom').value = bottleInfo.drinkFrom;
    }
    
    if (bottleInfo.drinkTo) {
        document.getElementById('bottleDrinkTo').value = bottleInfo.drinkTo;
    }
    
    if (bottleInfo.foodPairing) {
        document.getElementById('bottleFoodPairing').value = bottleInfo.foodPairing;
    }
    
    if (bottleInfo.temperature) {
        document.getElementById('bottleTemperature').value = bottleInfo.temperature;
    }
}

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

    // Si une image est disponible via la caméra, l'utiliser
    if (window.camera.hasImage() && !photoDataUrl.includes('data:image')) {
        bottleData.photo = window.camera.getCurrentImage();
    }

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
        window.camera.resetImage();
    })
    .catch(error => {
        console.error("Erreur lors de la sauvegarde de la bouteille :", error);
        alert("Erreur lors de la sauvegarde. Veuillez réessayer.");
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
        alert("Erreur lors de la suppression. Veuillez réessayer.");
    });
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
window.fillBottleFormWithAIResult = fillBottleFormWithAIResult;
