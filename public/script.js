// script.js - Gestion principale de l'application Ma Cave à Vin
// Version corrigée : pas de caméra, analyse IA simplifiée, bouton enregistrer fonctionnel

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
            window.camera.resetImage();
        });
    });

    // Fermer les popups en cliquant à l'extérieur
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('popup')) {
            e.target.style.display = 'none';
            window.camera.resetImage();
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

    // Gestion du bouton "Vider la cave"
    document.getElementById('resetDbButton').addEventListener('click', () => {
        if (confirm("Êtes-vous sûr de vouloir vider toute votre cave ? Cette action est irréversible.")) {
            resetDatabase();
        }
    });

    // Gestion du bouton "Analyser avec IA" (version simplifiée sans envoi d'image)
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
    
    const messagesContainer = document.getElementById('aiMessages');
    const welcomeMessage = messagesContainer.querySelector('.ai-message.bot');
    if (welcomeMessage) {
        messagesContainer.innerHTML = '';
        messagesContainer.appendChild(welcomeMessage);
    }
    
    document.getElementById('aiPromptInput').focus();
}

// Envoyer un prompt à l'IA
function sendAIPrompt() {
    const input = document.getElementById('aiPromptInput');
    const prompt = input.value.trim();
    
    if (!prompt) return;
    
    addAIMessage(prompt, 'user');
    input.value = '';
    
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
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Formater un message IA
function formatAIMessage(message) {
    return message.replace(/\n/g, '<br>');
}

// Générer une réponse IA (améliorée avec plus de variété)
function generateAIResponse(prompt) {
    const promptLower = prompt.toLowerCase();
    const responses = {
        greetings: [
            "Bonjour ! Je suis votre assistant pour la gestion de cave à vin. Comment puis-je vous aider aujourd'hui ?",
            "Salut ! Je suis là pour vous aider avec votre cave à vin. Que puis-je faire pour vous ?",
            "Bonjour ! Besoin d'aide pour gérer votre collection de vins ? Je suis à votre disposition."
        ],
        howItWorks: [
            "C'est simple : sélectionnez une image de bouteille, remplissez les champs (ou cliquez sur 'Analyser avec IA' pour les remplir automatiquement), puis enregistrez.",
            "Pour ajouter une bouteille : 1) Cliquez sur une cellule vide, 2) Sélectionnez une image, 3) Remplissez les infos (ou utilisez l'IA), 4) Enregistrez.",
            "L'application est intuitive : choisissez une photo de votre bouteille, l'IA peut vous aider à remplir les informations, puis sauvegardez."
        ],
        foodPairing: [
            "Dites-moi quel vin ou quel plat vous intéresse, je vous conseillerai les meilleurs accords ! Exemple : 'Quel vin avec du bœuf ?' ou 'Que boire avec du fromage ?'",
            "Pour les accords mets-vins, je peux vous suggérer des associations parfaites. Essayez : 'Quel vin avec du saumon ?' ou 'Que servir avec un Bordeaux ?'",
            "Les accords mets-vins sont mon spécialité ! Demandez-moi par exemple : 'Quel vin avec une blanquette de veau ?'"
        ],
        temperature: [
            "Voici les températures de service idéales : 16-18°C pour les vins rouges, 10-12°C pour les blancs, 6-8°C pour les champagnes et crémants.",
            "Températures recommandées : Rouges (16-18°C), Blancs secs (10-12°C), Blancs moelleux (8-10°C), Champagnes (6-8°C).",
            "Pour une dégustation optimale : servez les rouges entre 16 et 18°C, les blancs entre 10 et 12°C, et les effervescents bien frais à 6-8°C."
        ],
        recognition: [
            "Pour reconnaître une bouteille, sélectionnez une photo nette de l'étiquette, puis cliquez sur 'Analyser avec IA'. Je vais extraire les informations pour vous.",
            "L'IA peut analyser les étiquettes de vin. Il suffit de prendre une photo claire et de cliquer sur 'Analyser avec IA'.",
            "Sélectionnez une image de votre bouteille, puis utilisez le bouton 'Analyser avec IA' pour que je remplisse automatiquement les champs."
        ],
        default: [
            "Je suis là pour vous aider avec votre cave à vin. Vous pouvez me demander comment reconnaître une bouteille, quels accords mets-vins choisir, ou toute autre question sur le vin !",
            "Comment puis-je vous aider avec votre cave à vin aujourd'hui ?",
            "Posez-moi une question sur le vin, la gestion de votre cave, ou les accords mets-vins !"
        ]
    };
    
    // Sélectionner une réponse aléatoire pour éviter la répétition
    function getRandomResponse(category) {
        const options = responses[category];
        return options[Math.floor(Math.random() * options.length)];
    }
    
    if (promptLower.includes('bonjour') || promptLower.includes('salut') || promptLower.includes('hello') || promptLower.includes('hi')) {
        return getRandomResponse('greetings');
    }
    
    if (promptLower.includes('comment ça marche') || promptLower.includes('comment utiliser') || promptLower.includes('comment faire')) {
        return getRandomResponse('howItWorks');
    }
    
    if (promptLower.includes('accords') || promptLower.includes('mets') || promptLower.includes('nourriture') || promptLower.includes('food')) {
        return getRandomResponse('foodPairing');
    }
    
    if (promptLower.includes('température') || promptLower.includes('servir') || promptLower.includes('degré')) {
        return getRandomResponse('temperature');
    }
    
    if (promptLower.includes('reconnaître') || promptLower.includes('photo') || promptLower.includes('image') || promptLower.includes('étiquette')) {
        return getRandomResponse('recognition');
    }
    
    if (promptLower.includes('merci') || promptLower.includes('thank') || promptLower.includes('remerci')) {
        return "Avec plaisir ! N'hésitez pas si vous avez d'autres questions sur votre cave à vin. 🍷";
    }
    
    return getRandomResponse('default');
}

// Analyser avec IA (avec image compressée)
async function analyzeWithAI() {
    // Vérifier qu'une image est disponible
    if (!window.camera.hasImage()) {
        // Si pas d'image, utiliser le texte saisi
        const name = document.getElementById('bottleName').value;
        const year = document.getElementById('bottleYear').value;
        const grapes = document.getElementById('bottleGrapes').value;
        const region = document.getElementById('bottleRegion').value;

        if (!name && !year && !grapes && !region) {
            alert("Veuillez remplir au moins un champ (nom, année, cépage ou région) ou sélectionner une image pour que je puisse vous aider.");
            return;
        }

        try {
            const response = await fetch('/api/bottles/analyze-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, year, grapes, region })
            });

            const result = await response.json();

            if (result.success && result.bottleInfo) {
                fillBottleFormWithAIResult(result.bottleInfo);
                alert("Analyse terminée ! Les champs ont été complétés automatiquement.");
            } else {
                alert("Je n'ai pas pu compléter les informations. Vérifiez les champs saisis.");
            }
        } catch (error) {
            console.error("Erreur analyse IA :", error);
            alert("Erreur de connexion. Vérifiez que le serveur est lancé.");
        }
        return;
    }

    // Si une image est disponible, l'envoyer au serveur
    try {
        const imageDataUrl = window.camera.getCurrentImage();
        
        // Créer un FormData pour envoyer l'image
        const formData = new FormData();
        
        // Convertir la data URL en Blob
        const base64Data = imageDataUrl.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteArrays = [];
        for (let i = 0; i < byteCharacters.length; i++) {
            byteArrays.push(byteCharacters.charCodeAt(i));
        }
        const byteArray = new Uint8Array(byteArrays);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });
        
        formData.append('image', blob, 'bottle.jpg');

        const response = await fetch('/api/bottles/analyze', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success && result.bottleInfo) {
            fillBottleFormWithAIResult(result.bottleInfo);
            alert("Analyse terminée ! Les champs ont été complétés automatiquement.");
        } else {
            alert("Je n'ai pas pu identifier cette bouteille. Vérifiez la qualité de l'image ou remplissez manuellement les informations.");
        }
    } catch (error) {
        console.error("Erreur analyse IA :", error);
        alert("Erreur lors de l'analyse. Veuillez réessayer.");
    }
}

// Remplir le formulaire avec les résultats de l'IA
function fillBottleFormWithAIResult(bottleInfo) {
    if (bottleInfo.name && !document.getElementById('bottleName').value) {
        document.getElementById('bottleName').value = bottleInfo.name;
    }
    if (bottleInfo.year && !document.getElementById('bottleYear').value) {
        document.getElementById('bottleYear').value = bottleInfo.year;
    }
    if (bottleInfo.grapes && !document.getElementById('bottleGrapes').value) {
        document.getElementById('bottleGrapes').value = bottleInfo.grapes;
    }
    if (bottleInfo.region && !document.getElementById('bottleRegion').value) {
        document.getElementById('bottleRegion').value = bottleInfo.region;
    }
    if (bottleInfo.drinkFrom && !document.getElementById('bottleDrinkFrom').value) {
        document.getElementById('bottleDrinkFrom').value = bottleInfo.drinkFrom;
    }
    if (bottleInfo.drinkTo && !document.getElementById('bottleDrinkTo').value) {
        document.getElementById('bottleDrinkTo').value = bottleInfo.drinkTo;
    }
    if (bottleInfo.foodPairing && !document.getElementById('bottleFoodPairing').value) {
        document.getElementById('bottleFoodPairing').value = bottleInfo.foodPairing;
    }
    if (bottleInfo.temperature && !document.getElementById('bottleTemperature').value) {
        document.getElementById('bottleTemperature').value = bottleInfo.temperature;
    }
}

// Sauvegarder une bouteille
function saveBottle() {
    const selectedCell = window.cave.getSelectedCell();
    if (!selectedCell) {
        alert("Aucune cellule sélectionnée. Veuillez cliquer sur une cellule vide d'abord.");
        return;
    }

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
        temperature: document.getElementById('bottleTemperature').value,
        photo: window.camera.getCurrentImage()
    };

    // Envoyer les données au serveur
    fetch('/api/bottles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bottleData)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            document.getElementById('bottlePopup').style.display = 'none';
            window.cave.loadCaveGrid();
            window.camera.resetImage();
            document.getElementById('bottleForm').reset();
        } else {
            alert("Erreur lors de la sauvegarde : " + (result.error || "Inconnu"));
        }
    })
    .catch(error => {
        console.error("Erreur sauvegarde :", error);
        alert("Erreur de connexion au serveur. Vérifiez qu'il est lancé.");
    });
}

// Ouvrir la popup de modification de bouteille
function openEditBottlePopup(bottle) {
    document.getElementById('popupTitle').innerHTML = '<i class="fas fa-wine-bottle"></i> Modifier une bouteille';
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
    .then(result => {
        if (result.success) {
            document.getElementById('bottleDetailsPopup').style.display = 'none';
            window.cave.loadCaveGrid();
        } else {
            alert("Erreur lors de la suppression.");
        }
    })
    .catch(error => {
        console.error("Erreur suppression :", error);
        alert("Erreur de connexion au serveur.");
    });
}

// Effectuer une recherche
function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (!searchTerm) {
        document.querySelectorAll('.cave-cell').forEach(cell => {
            cell.classList.remove('highlight');
        });
        return;
    }

    const grid = window.cave.getCaveGrid();
    const bottles = grid.flat().filter(bottle => bottle !== null);

    const matchingBottles = bottles.filter(bottle => {
        return (
            (bottle.name && bottle.name.toLowerCase().includes(searchTerm)) ||
            (bottle.year && bottle.year.toString().includes(searchTerm)) ||
            (bottle.grapes && bottle.grapes.toLowerCase().includes(searchTerm)) ||
            (bottle.region && bottle.region.toLowerCase().includes(searchTerm)) ||
            (bottle.foodPairing && bottle.foodPairing.toLowerCase().includes(searchTerm))
        );
    });

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

// Réinitialiser la base de données
function resetDatabase() {
    fetch('/api/bottles/reset-db', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert("La cave a été vidée avec succès !");
            window.cave.loadCaveGrid();
        } else {
            alert("Erreur lors de la réinitialisation : " + (result.error || "Inconnu"));
        }
    })
    .catch(error => {
        console.error("Erreur réinitialisation :", error);
        alert("Erreur de connexion au serveur.");
    });
}

// Exporter les fonctions
window.openAddBottlePopup = window.cave.openAddBottlePopup;
window.openBottleDetailsPopup = window.cave.openBottleDetailsPopup;
window.fillBottleFormWithAIResult = fillBottleFormWithAIResult;
