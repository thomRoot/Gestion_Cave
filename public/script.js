// script.js - Gestion principale de l'application Ma Cave à Vin
// Version corrigée : pas de caméra, analyse IA simplifiée, bouton enregistrer fonctionnel

// Variables globales
let currentBottleImage = null;

// Fonctions de gestion du chargement
function showLoading(message = "Analyse en cours...") {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        const messageElement = loadingOverlay.querySelector('p');
        if (messageElement) {
            messageElement.textContent = message;
        }
        loadingOverlay.style.display = 'flex';
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

// Vérifier le statut de Mistral AI
async function checkMistralStatus() {
    try {
        const response = await fetch('/api/bottles/mistral-status');
        const data = await response.json();
        
        const statusElement = document.getElementById('mistralStatus');
        const statusTextElement = document.getElementById('mistralStatusText');
        
        if (statusElement && statusTextElement) {
            statusElement.style.display = 'flex';
            
            if (data.mistralAvailable) {
                statusElement.className = 'mistral-status connected';
                statusTextElement.textContent = `Connecté (${data.model})`;
            } else {
                statusElement.className = 'mistral-status disconnected';
                statusTextElement.textContent = 'Non configuré';
                // Remplacer l'icône
                const icon = statusElement.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-exclamation-circle';
                }
            }
        }
    } catch (error) {
        console.error("Erreur vérification Mistral :", error);
    }
}

// Initialiser l'application au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    window.cave.initCave();
    
    // Vérifier le statut de Mistral au chargement
    checkMistralStatus();

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
            // Fermer la popup de détails avant d'ouvrir celle de modification
            document.getElementById('bottleDetailsPopup').style.display = 'none';
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

    // Gestion du bouton "Chat IA"
    const aiChatButton = document.getElementById('aiChatButton');
    if (aiChatButton) {
        aiChatButton.addEventListener('click', () => {
            openAIChatPopup();
        });
    }

    // Gestion du bouton "Vider la cave"
    document.getElementById('resetDbButton').addEventListener('click', () => {
        if (confirm("Êtes-vous sûr de vouloir vider toute votre cave ? Cette action est irréversible.")) {
            resetDatabase();
        }
    });

    // Gestion du bouton "Analyser avec IA" (version simplifiée sans envoi d'image)
    const analyzeWithAIButton = document.getElementById('analyzeWithAI');
    if (analyzeWithAIButton) {
        analyzeWithAIButton.addEventListener('click', analyzeWithAI);
    }

    // Gestion du chat IA
    const aiChatInput = document.getElementById('aiChatInput');
    const aiChatSendButton = document.getElementById('aiChatSendButton');
    if (aiChatInput && aiChatSendButton) {
        aiChatSendButton.addEventListener('click', sendAIChatMessage);
        aiChatInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                sendAIChatMessage();
            }
        });
    }
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

// Envoyer un prompt à l'IA (avec VRAIE IA Mistral)
async function sendAIPrompt() {
    const input = document.getElementById('aiPromptInput');
    const prompt = input.value.trim();
    
    if (!prompt) return;
    
    addAIMessage(prompt, 'user');
    input.value = '';
    
    // Afficher un indicateur de chargement
    const messagesContainer = document.getElementById('aiMessages');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'ai-message bot loading';
    loadingDiv.innerHTML = '<div class="message-content"><i class="fas fa-spinner fa-spin"></i> Réflexion en cours...</div>';
    messagesContainer.appendChild(loadingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    try {
        // Appeler l'API Mistral via le serveur
        const response = await fetch('/api/bottles/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: prompt })
        });
        
        const result = await response.json();
        
        // Supprimer le message de chargement
        loadingDiv.remove();
        
        if (result.success && result.response) {
            addAIMessage(result.response, 'bot');
        } else {
            // Fallback vers la réponse locale si Mistral échoue
            const fallbackResponse = generateAIResponse(prompt);
            addAIMessage(fallbackResponse, 'bot');
        }
    } catch (error) {
        console.error("Erreur appel IA Mistral :", error);
        loadingDiv.remove();
        // Fallback vers la réponse locale
        const fallbackResponse = generateAIResponse(prompt);
        addAIMessage(fallbackResponse, 'bot');
    }
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

// Générer une réponse IA (améliorée avec plus de variété et gestion des erreurs)
function generateAIResponse(prompt) {
    const promptLower = prompt.toLowerCase();
    const responses = {
        greetings: [
            "Bonjour ! Je suis votre assistant pour la gestion de cave à vin. Comment puis-je vous aider aujourd'hui ?",
            "Salut ! Je suis là pour vous aider avec votre cave à vin. Que puis-je faire pour vous ?",
            "Bonjour ! Besoin d'aide pour gérer votre collection de vins ? Je suis à votre disposition.",
            "Hello ! Je suis votre assistant IA dédié au vin. Posez-moi vos questions !"
        ],
        howItWorks: [
            "C'est simple : sélectionnez une image de bouteille, remplissez les champs (ou cliquez sur 'Analyser avec IA' pour les remplir automatiquement), puis enregistrez.",
            "Pour ajouter une bouteille : 1) Cliquez sur une cellule vide, 2) Sélectionnez une image, 3) Remplissez les infos (ou utilisez l'IA), 4) Enregistrez.",
            "L'application est intuitive : choisissez une photo de votre bouteille, l'IA peut vous aider à remplir les informations, puis sauvegardez.",
            "Le fonctionnement est simple : ajoutez vos bouteilles avec une photo, l'IA vous aide à compléter les informations, et tout est organisé dans votre cave virtuelle."
        ],
        foodPairing: [
            "Dites-moi quel vin ou quel plat vous intéresse, je vous conseillerai les meilleurs accords ! Exemple : 'Quel vin avec du bœuf ?' ou 'Que boire avec du fromage ?'",
            "Pour les accords mets-vins, je peux vous suggérer des associations parfaites. Essayez : 'Quel vin avec du saumon ?' ou 'Que servir avec un Bordeaux ?'",
            "Les accords mets-vins sont mon spécialité ! Demandez-moi par exemple : 'Quel vin avec une blanquette de veau ?'",
            "Je connais tous les accords classiques : bœuf et Bordeaux, fromage et Bourgogne, poisson et blanc sec... Demandez-moi !"
        ],
        temperature: [
            "Voici les températures de service idéales : 16-18°C pour les vins rouges, 10-12°C pour les blancs, 6-8°C pour les champagnes et crémants.",
            "Températures recommandées : Rouges (16-18°C), Blancs secs (10-12°C), Blancs moelleux (8-10°C), Champagnes (6-8°C).",
            "Pour une dégustation optimale : servez les rouges entre 16 et 18°C, les blancs entre 10 et 12°C, et les effervescents bien frais à 6-8°C.",
            "La température est cruciale ! Un rouge trop froid perd ses arômes, un blanc trop chaud devient alcooleux. Respectez les températures que je vous indique."
        ],
        recognition: [
            "Pour reconnaître une bouteille, sélectionnez une photo nette de l'étiquette, puis cliquez sur 'Analyser avec IA'. Je vais extraire les informations pour vous.",
            "L'IA peut analyser les étiquettes de vin. Il suffit de prendre une photo claire et de cliquer sur 'Analyser avec IA'.",
            "Sélectionnez une image de votre bouteille, puis utilisez le bouton 'Analyser avec IA' pour que je remplisse automatiquement les champs.",
            "Avec une photo de l'étiquette, je peux identifier le nom, l'année, le cépage et la région de votre vin. Essayez !"
        ],
        noResults: [
            "Désolé, je n'ai pas trouvé d'informations correspondantes dans ma base de données. Vérifiez l'orthographe ou essayez une autre recherche.",
            "Aucun résultat trouvé pour cette requête. Peut-être que ce vin n'est pas dans ma base de connaissances... pour l'instant !",
            "Je n'ai pas d'information sur ce sujet. Ma base de données contient principalement des vins français. Essayez avec un autre vin.",
            "Aucun résultat. Mais je peux vous aider sur d'autres sujets : reconnaissance de bouteilles, accords mets-vins, températures de service..."
        ],
        default: [
            "Je suis là pour vous aider avec votre cave à vin. Vous pouvez me demander comment reconnaître une bouteille, quels accords mets-vins choisir, ou toute autre question sur le vin !",
            "Comment puis-je vous aider avec votre cave à vin aujourd'hui ?",
            "Posez-moi une question sur le vin, la gestion de votre cave, ou les accords mets-vins !",
            "Je suis votre assistant vinicole. Que puis-je faire pour vous aujourd'hui ?"
        ]
    };
    
    // Sélectionner une réponse aléatoire pour éviter la répétition
    function getRandomResponse(category) {
        const options = responses[category];
        return options[Math.floor(Math.random() * options.length)];
    }
    
    // Vérifier si la requête contient des mots-clés de vin connus
    const wineKeywords = ['vin', 'bouteille', 'cépage', 'millésime', 'année', 'région', 'bordeaux', 'bourgogne', 'champagne', 'rouge', 'blanc', 'rosé'];
    const hasWineKeyword = wineKeywords.some(keyword => promptLower.includes(keyword));
    
    if (promptLower.includes('bonjour') || promptLower.includes('salut') || promptLower.includes('hello') || promptLower.includes('hi') || promptLower.includes('coucou')) {
        return getRandomResponse('greetings');
    }
    
    if (promptLower.includes('comment ça marche') || promptLower.includes('comment utiliser') || promptLower.includes('comment faire') || promptLower.includes('tutoriel')) {
        return getRandomResponse('howItWorks');
    }
    
    if (promptLower.includes('accords') || promptLower.includes('mets') || promptLower.includes('nourriture') || promptLower.includes('food') || promptLower.includes('plat')) {
        return getRandomResponse('foodPairing');
    }
    
    if (promptLower.includes('température') || promptLower.includes('servir') || promptLower.includes('degré') || promptLower.includes('chaud') || promptLower.includes('froid')) {
        return getRandomResponse('temperature');
    }
    
    if (promptLower.includes('reconnaître') || promptLower.includes('photo') || promptLower.includes('image') || promptLower.includes('étiquette') || promptLower.includes('analyser')) {
        return getRandomResponse('recognition');
    }
    
    if (promptLower.includes('merci') || promptLower.includes('thank') || promptLower.includes('remerci') || promptLower.includes('super') || promptLower.includes('génial')) {
        return "Avec plaisir ! N'hésitez pas si vous avez d'autres questions sur votre cave à vin. 🍷";
    }
    
    // Si la requête contient des mots-clés de vin mais qu'on n'a pas de réponse spécifique
    if (hasWineKeyword && !promptLower.includes('bonjour') && !promptLower.includes('merci')) {
        // Essayer de donner une réponse générique mais utile
        if (promptLower.includes('quel') || promptLower.includes('quels') || promptLower.includes('quelle')) {
            return "Je vais essayer de vous aider. Pouvez-vous préciser votre question ? Par exemple : 'Quel vin avec du canard ?' ou 'Quelle est la température idéale pour un Bordeaux ?'";
        }
        return getRandomResponse('default');
    }
    
    // Si aucune catégorie ne correspond
    if (promptLower.trim() === '') {
        return "Posez-moi une question sur le vin !";
    }
    
    // Pour les questions sans réponse spécifique
    return getRandomResponse('noResults');
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
            showLoading("Analyse du texte en cours...");
            const response = await fetch('/api/bottles/analyze-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, year, grapes, region })
            });

            const result = await response.json();
            hideLoading();

            if (result.success && result.bottleInfo) {
                fillBottleFormWithAIResult(result.bottleInfo);
                alert("Analyse terminée ! Les champs ont été complétés automatiquement.");
            } else {
                alert("Je n'ai pas pu compléter les informations. Vérifiez les champs saisis.");
            }
        } catch (error) {
            hideLoading();
            console.error("Erreur analyse IA :", error);
            alert("Erreur de connexion. Vérifiez que le serveur est lancé.");
        }
        return;
    }

    // Si une image est disponible, l'envoyer au serveur
    try {
        showLoading("Analyse de l'image en cours...");
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
        hideLoading();

        if (result.success && result.bottleInfo) {
            fillBottleFormWithAIResult(result.bottleInfo);
            alert("Analyse terminée ! Les champs ont été complétés automatiquement.");
        } else {
            alert("Je n'ai pas pu identifier cette bouteille. Vérifiez la qualité de l'image ou remplissez manuellement les informations.");
        }
    } catch (error) {
        hideLoading();
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
    let photoValue = window.camera.getCurrentImage();
    
    // Si on modifie une bouteille et qu'aucune nouvelle photo n'a été sélectionnée,
    // conserver l'ancienne photo
    if (!photoValue && currentEditingBottlePhoto) {
        photoValue = currentEditingBottlePhoto;
    }

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
        photo: photoValue
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
            // Réinitialiser la variable globale
            currentEditingBottlePhoto = null;
        } else {
            alert("Erreur lors de la sauvegarde : " + (result.error || "Inconnu"));
        }
    })
    .catch(error => {
        console.error("Erreur sauvegarde :", error);
        alert("Erreur de connexion au serveur. Vérifiez qu'il est lancé.");
    });
}

// Variable globale pour stocker l'ancienne photo lors de la modification
let currentEditingBottlePhoto = null;

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

    // Stocker l'ancienne photo pour la conserver si aucune nouvelle n'est sélectionnée
    currentEditingBottlePhoto = bottle.photo || null;

    if (bottle.photo) {
        // Stocker l'image actuelle dans le camera module pour l'édition
        window.camera.setCurrentImageFromUrl(`/uploads/${bottle.photo}`);
        // Afficher l'aperçu de l'image
        document.getElementById('bottlePhotoPreview').style.display = 'block';
        document.getElementById('bottlePhotoPreview').src = `/uploads/${bottle.photo}`;
    } else {
        window.camera.resetImage();
        document.getElementById('bottlePhotoPreview').style.display = 'none';
    }

    // Démarrer la sélection de fichier pour permettre de changer la photo
    // NE PAS réinitialiser l'image existante
    window.camera.startCamera(false); // false = ne pas réinitialiser
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

// NOUVELLES FONCTIONS DE CHAT IA - Version Complète

// Variable globale pour le chat
let conversationHistory = [];

// Ouvrir la popup de chat IA
function openAIChatPopup() {
    const popup = document.getElementById('aiChatPopup');
    popup.style.display = 'flex';
    
    // Initialiser le chat si c'est la première fois
    const messagesContainer = document.getElementById('aiMessages');
    if (messagesContainer && messagesContainer.children.length === 0) {
        // Ajouter le message de bienvenue
        addChatMessage(
            `Bonjour ! 🍷 Je suis votre assistant IA spécialisé en vin. Vous pouvez me demander <strong>n'importe quoi</strong> :
            <br><br>
            - "Quel vin avec du bœuf bourguignon ?"
            - "À quelle température servir un Bordeaux 2018 ?"
            - "Quels sont les meilleurs cépages pour vieillir 10 ans ?"
            - "Peux-tu m'expliquer la différence entre AOC et IGP ?"
            - "Quel vin offrir pour un dîner romantique ?"
            <br><br>
            Je suis là pour vous aider !`,
            'bot',
            true
        );
    }
    
    // Mettre à jour l'indicateur du modèle
    updateModelInfo();
    
    // Focus sur l'input
    const chatInput = document.getElementById('aiChatInput');
    if (chatInput) {
        chatInput.focus();
    }
    
    // Faire défiler vers le bas
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Fermer le chat IA
function closeAIChatPopup() {
    const popup = document.getElementById('aiChatPopup');
    if (popup) {
        popup.style.display = 'none';
    }
}

// Envoyer un message au chat IA
async function sendAIChatMessage() {
    const input = document.getElementById('aiChatInput');
    const sendButton = document.getElementById('aiChatSendButton');
    
    if (!input || !sendButton) return;
    
    const message = input.value.trim();
    if (!message) return;
    
    // Désactiver le bouton pendant l'envoi
    sendButton.disabled = true;
    input.disabled = true;
    
    // Ajouter le message de l'utilisateur
    addChatMessage(message, 'user', false);
    input.value = '';
    
    // Afficher l'indicateur de saisie
    const messagesContainer = document.getElementById('aiMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'ai-message bot';
    typingDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-wine-glass-alt"></i>
        </div>
        <div class="message-content">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Mettre à jour le statut
    updateChatStatus('Réflexion en cours...');
    
    try {
        // Appeler l'API Mistral via le serveur
        const response = await fetch('/api/bottles/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                question: message,
                history: conversationHistory
            })
        });
        
        const result = await response.json();
        
        // Supprimer l'indicateur de saisie
        typingDiv.remove();
        
        if (result.success && result.response) {
            // Ajouter la réponse de Mistral
            addChatMessage(result.response, 'bot', false);
            
            // Ajouter à l'historique
            conversationHistory.push({
                role: 'user',
                content: message
            });
            conversationHistory.push({
                role: 'assistant',
                content: result.response
            });
            
            // Limiter l'historique à 20 échanges
            if (conversationHistory.length > 20) {
                conversationHistory = conversationHistory.slice(-20);
            }
            
            updateChatStatus('✓ Réponse reçue');
            setTimeout(() => updateChatStatus(''), 2000);
        } else {
            // Erreur
            addChatMessage(
                `Désolé, je n'ai pas pu obtenir de réponse. ${result.error || 'Vérifiez que Mistral AI est bien configuré.'}`,
                'bot',
                false,
                true
            );
            updateChatStatus('⚠ Erreur');
        }
    } catch (error) {
        console.error("Erreur chat IA :", error);
        typingDiv.remove();
        addChatMessage(
            `Désolé, une erreur s'est produite : ${error.message}. Vérifiez votre connexion et que Mistral AI est configuré.`,
            'bot',
            false,
            true
        );
        updateChatStatus('⚠ Erreur de connexion');
    } finally {
        // Réactiver les inputs
        sendButton.disabled = false;
        input.disabled = false;
        input.focus();
    }
}

// Ajouter un message au chat
function addChatMessage(message, type, isWelcome = false, isError = false) {
    const messagesContainer = document.getElementById('aiMessages');
    if (!messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    const className = `ai-message ${type} ${isWelcome ? 'welcome-message' : ''} ${isError ? 'error' : ''}`;
    messageDiv.className = className;
    
    // Formater le message (remplacer les sauts de ligne par <br>)
    const formattedMessage = formatChatMessage(message);
    
    // Ajouter l'avatar pour les messages bot
    let avatarHtml = '';
    if (type === 'bot') {
        avatarHtml = '<div class="message-avatar"><i class="fas fa-wine-glass-alt"></i></div>';
    } else if (type === 'user') {
        avatarHtml = '<div class="message-avatar"><i class="fas fa-user"></i></div>';
    }
    
    messageDiv.innerHTML = `${avatarHtml}<div class="message-content">${formattedMessage}</div>`;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Formater un message du chat
function formatChatMessage(message) {
    if (!message) return '';
    
    // Remplacer les sauts de ligne
    let formatted = message.replace(/\n/g, '<br>');
    
    // Remplacer le markdown basique
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
    
    // Remplacer les listes
    formatted = formatted.replace(/\n\s*[-•*•]\s+/g, '<br>• ');
    
    return formatted;
}

// Mettre à jour l'indicateur du modèle
function updateModelInfo() {
    const modelInfo = document.getElementById('mistralModelInfo');
    if (modelInfo) {
        // Le modèle est récupéré depuis le serveur
        fetch('/api/bottles/mistral-status')
            .then(response => response.json())
            .then(data => {
                if (data.mistralAvailable) {
                    modelInfo.textContent = `Modèle : ${data.model}`;
                } else {
                    modelInfo.textContent = 'Modèle : Non configuré';
                }
            })
            .catch(() => {
                modelInfo.textContent = 'Modèle : Inconnu';
            });
    }
}

// Mettre à jour le statut du chat
function updateChatStatus(status) {
    const chatStatus = document.getElementById('chatStatus');
    if (chatStatus) {
        chatStatus.textContent = status;
    }
}

// Fonction pour les suggestions de prompts
function suggestPrompt(prompt) {
    const input = document.getElementById('aiChatInput');
    if (input) {
        input.value = prompt;
        input.focus();
    }
}

// Exporter les fonctions
window.openAddBottlePopup = window.cave.openAddBottlePopup;
window.openBottleDetailsPopup = window.cave.openBottleDetailsPopup;
window.fillBottleFormWithAIResult = fillBottleFormWithAIResult;
window.openAIChatPopup = openAIChatPopup;
window.suggestPrompt = suggestPrompt;
