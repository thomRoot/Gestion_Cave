// script.js - Gestion principale de l'application Ma Cave à Vin
// Version 5.0.0 - Corrigée et optimisée

// Variables globales
let currentBottleImage = null;
let conversationHistory = [];
let currentAnalysisImage = null;
let currentPartialData = null;
let currentMissingFields = null;

// Fonctions de gestion du chargement
function showLoading(message = "Analyse en cours...") {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        const messageElement = loadingOverlay.querySelector('p');
        if (messageElement) {
            messageElement.textContent = message;
        }
        loadingOverlay.classList.add('active');
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('active');
    }
}

// Adapter la popup de saisie manuelle en fonction des champs manquants
function updateManualInputPopup(missingFields) {
    const nameInput = document.getElementById('manualName');
    const yearInput = document.getElementById('manualYear');
    const nameLabel = document.querySelector('#manualInputPopup label[for="manualName"]');
    const yearLabel = document.querySelector('#manualInputPopup label[for="manualYear"]');
    const popupMessage = document.querySelector('#manualInputPopup p');
    
    if (!missingFields) {
        // Par défaut, tout est requis
        if (nameInput) nameInput.required = true;
        if (yearInput) yearInput.required = false; // Année reste optionnelle
        if (popupMessage) popupMessage.textContent = "Google Vision n'a pas pu identifier le nom ou l'année de la bouteille. Veuillez les saisir manuellement pour que Mistral puisse compléter les autres informations.";
        return;
    }
    
    // Mettre à jour les champs requis
    if (nameInput) {
        nameInput.required = missingFields.name || false;
    }
    if (yearInput) {
        yearInput.required = missingFields.year || false;
    }
    
    // Mettre à jour les libellés
    if (nameLabel) {
        if (missingFields.name) {
            nameLabel.innerHTML = '<i class="fas fa-tag"></i> Nom de la bouteille *';
        } else {
            nameLabel.innerHTML = '<i class="fas fa-tag"></i> Nom de la bouteille';
        }
    }
    if (yearLabel) {
        if (missingFields.year) {
            yearLabel.innerHTML = '<i class="fas fa-calendar"></i> Année *';
        } else {
            yearLabel.innerHTML = '<i class="fas fa-calendar"></i> Année (optionnel)';
        }
    }
    
    // Mettre à jour le message de la popup
    if (popupMessage) {
        if (missingFields.name && missingFields.year) {
            popupMessage.textContent = "Google Vision n'a pas pu identifier le nom et l'année de la bouteille. Veuillez les saisir manuellement pour que Mistral puisse compléter les autres informations.";
        } else if (missingFields.name) {
            popupMessage.textContent = "Google Vision n'a pas pu identifier le nom de la bouteille. Veuillez le saisir manuellement pour que Mistral puisse compléter les autres informations.";
        } else if (missingFields.year) {
            popupMessage.textContent = "Google Vision n'a pas pu identifier l'année de la bouteille. Veuillez la saisir manuellement pour que Mistral puisse compléter les autres informations.";
        } else {
            popupMessage.textContent = "Veuillez compléter les informations manquantes pour que Mistral puisse analyser la bouteille.";
        }
    }
}

// Vérifier le statut de Mistral AI et Google Vision
async function checkMistralStatus() {
    try {
        const response = await fetch('/api/bottles/mistral-status');
        const data = await response.json();
        
        const statusElement = document.getElementById('mistralStatus');
        
        if (statusElement) {
            statusElement.classList.add('active');
            const icon = statusElement.querySelector('i');
            
            if (data && data.mistralAvailable) {
                statusElement.className = 'mistral-status connected active';
                if (icon) icon.className = 'fas fa-robot';
            } else {
                statusElement.className = 'mistral-status disconnected active';
                if (icon) icon.className = 'fas fa-robot';
            }
        }
    } catch (error) {
        console.error("Erreur vérification Mistral :", error);
        // En cas d'erreur, afficher l'icône par défaut
        const statusElement = document.getElementById('mistralStatus');
        if (statusElement) {
            statusElement.classList.add('active');
            const icon = statusElement.querySelector('i');
            if (icon) icon.className = 'fas fa-robot';
        }
    }
}

// Initialiser l'application au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    // Masquer toutes les popups au chargement
    document.querySelectorAll('.popup').forEach(popup => {
        popup.classList.remove('active');
    });
    
    window.cave.initCave();
    
    // Vérifier le statut de Mistral et Google Vision au chargement
    checkMistralStatus();
    checkGoogleVisionStatus();

    // Gestion de la configuration de la cave
    const caveConfigForm = document.getElementById('caveConfigForm');
    if (caveConfigForm) {
        caveConfigForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const rows = parseInt(document.getElementById('caveRows').value);
            const cols = parseInt(document.getElementById('caveCols').value);
            window.cave.saveCaveConfig(rows, cols);
        });
    }

    // Gestion du formulaire d'ajout/modification de bouteille
    const bottleForm = document.getElementById('bottleForm');
    if (bottleForm) {
        bottleForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveBottle();
        });
    }

    // Gestion du formulaire de saisie manuelle (popup)
    const manualInputForm = document.getElementById('manualInputForm');
    if (manualInputForm) {
        manualInputForm.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Empêcher la fermeture de la popup
            submitManualInput();
        });
    }

    // Gestion de la recherche
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');
    const searchModeToggle = document.getElementById('searchModeToggle');
    const searchModeLabel = document.getElementById('searchModeLabel');
    const searchResultsPopup = document.getElementById('searchResultsPopup');
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    
    // Variable pour stocker le timeout de la recherche (pour éviter les requêtes trop fréquentes)
    let searchTimeout = null;
    
    if (searchButton && searchInput) {
        searchButton.addEventListener('click', performSearch);
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            } else {
                // En mode Cave, mettre à jour les résultats à chaque touche
                if (searchModeToggle && !searchModeToggle.checked) {
                    handleCaveSearchInput();
                }
            }
        });
        
        // Écouter aussi l'événement input pour une réactivité immédiate
        searchInput.addEventListener('input', () => {
            if (searchModeToggle && !searchModeToggle.checked) {
                handleCaveSearchInput();
            }
        });
    }

    // Gestion du switch de mode de recherche
    if (searchModeToggle && searchModeLabel) {
        // Mettre à jour l'affichage du label en fonction du mode
        function updateSearchModeLabel() {
            if (searchModeToggle.checked) {
                searchModeLabel.textContent = 'IA';
                searchModeLabel.classList.add('ai-mode');
                // Fermer la popup de résultats de recherche si elle est ouverte
                if (searchResultsPopup) {
                    searchResultsPopup.classList.remove('active');
                }
            } else {
                searchModeLabel.textContent = 'Cave';
                searchModeLabel.classList.remove('ai-mode');
                // Si on bascule en mode Cave et qu'il y a du texte, ouvrir la popup
                if (searchInput && searchInput.value.trim()) {
                    handleCaveSearchInput();
                }
            }
        }

        // Écouter les changements du switch
        searchModeToggle.addEventListener('change', updateSearchModeLabel);

        // Initialiser le label
        updateSearchModeLabel();
    }

    // Gestion de la fermeture de la popup de résultats
    if (searchResultsPopup) {
        const searchCloseButton = searchResultsPopup.querySelector('.close');
        if (searchCloseButton) {
            searchCloseButton.addEventListener('click', () => {
                searchResultsPopup.classList.remove('active');
            });
        }
    }

    // Gestion des boutons de la popup de détails
    const deleteBottleButton = document.getElementById('deleteBottleButton');
    
    if (deleteBottleButton) {
        deleteBottleButton.addEventListener('click', () => {
            const selectedCell = window.cave.getSelectedCell();
            if (selectedCell) {
                deleteBottle(selectedCell.row, selectedCell.col);
            }
        });
    }

    // Gestion des boutons de fermeture des popups
    document.querySelectorAll('.popup .close').forEach(closeButton => {
        closeButton.addEventListener('click', () => {
            closeButton.closest('.popup').classList.remove('active');
            window.camera.resetImage();
        });
    });

    // Fermer les popups en cliquant à l'extérieur
    window.addEventListener('click', (e) => {
        // Fermer la popup uniquement si on clique sur la zone grise (en dehors du contenu)
        const popup = e.target.closest('.popup');
        if (popup) {
            const popupContent = popup.querySelector('.popup-content');
            // Si le clic est sur le popup mais PAS sur son contenu ou ses enfants
            if (e.target === popup || (popupContent && !popupContent.contains(e.target))) {
                popup.classList.remove('active');
                window.camera.resetImage();
                // Réinitialiser l'image en cours d'analyse si on ferme la popup manuelle
                if (popup.id === 'manualInputPopup') {
                    currentAnalysisImage = null;
                    currentPartialData = null;
                    currentMissingFields = null;
                }
            }
        }
    });

    // Gestion du bouton "Ajouter une bouteille" (header)
    const addBottleButton = document.getElementById('addBottleButton');
    if (addBottleButton) {
        addBottleButton.addEventListener('click', () => {
            window.cave.openAddBottlePopup();
        });
    }

    // Gestion du bouton flottant mobile
    const mobileAddButton = document.getElementById('mobileAddButton');
    if (mobileAddButton) {
        mobileAddButton.addEventListener('click', () => {
            const selectedCell = window.cave.getSelectedCell();
            if (!selectedCell) {
                alert("Veuillez cliquer sur une case vide de la cave pour ajouter une nouvelle bouteille.");
            } else {
                const grid = window.cave.getCaveGrid();
                if (!grid[selectedCell.row][selectedCell.col]) {
                    window.cave.openAddBottlePopup();
                } else {
                    alert("Veuillez cliquer sur une case vide pour ajouter une nouvelle bouteille.");
                }
            }
        });
    }

    // Gestion du bouton "Chat IA"
    const aiChatButton = document.getElementById('aiChatButton');
    if (aiChatButton) {
        aiChatButton.addEventListener('click', () => {
            openAIChatPopup();
        });
    }

    // Gestion du bouton "Vider la cave"
    const resetDbButton = document.getElementById('resetDbButton');
    if (resetDbButton) {
        resetDbButton.addEventListener('click', () => {
            if (confirm("Êtes-vous sûr de vouloir vider toute votre cave ? Cette action est irréversible.")) {
                resetDatabase();
            }
        });
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


// Vérifier le statut de Google Vision
async function checkGoogleVisionStatus() {
    try {
        const response = await fetch('/api/bottles/google-status');
        const data = await response.json();
        
        const statusElement = document.getElementById('googleVisionStatus');
        
        if (statusElement) {
            statusElement.classList.add('active');
            const icon = statusElement.querySelector('i');
            
            if (data && data.googleVisionAvailable) {
                statusElement.className = 'mistral-status connected active';
                if (icon) icon.className = 'fab fa-google';
            } else {
                statusElement.className = 'mistral-status disconnected active';
                if (icon) icon.className = 'fab fa-google';
            }
        }
    } catch (error) {
        console.error("Erreur vérification Google Vision :", error);
        // En cas d'erreur, afficher l'icône par défaut
        const statusElement2 = document.getElementById('googleVisionStatus');
        if (statusElement2) {
            statusElement2.classList.add('active');
            const icon = statusElement2.querySelector('i');
            if (icon) icon.className = 'fab fa-google';
        }
    }
}

// ==================== FONCTIONS DE CHAT IA ====================

// Ouvrir la popup de chat IA
function openAIChatPopup() {
    const popup = document.getElementById('aiChatPopup');
    if (popup) {
        popup.classList.add('active');
        
        // Retirer le focus pour éviter le curseur clignotant
        document.activeElement.blur();
        
        const messagesContainer = document.getElementById('aiMessages');
        if (messagesContainer) {
            // Conserver l'historique si il existe
            if (messagesContainer.children.length === 0) {
                // Ajouter le message de bienvenue
                addChatMessage(
                    `Bonjour ! 🍷 Je suis votre assistant IA spécialisé en vin. Vous pouvez me demander <strong>n'importe quoi</strong> :
                    <br><br>
                    - "Quel vin avec du bœuf bourguignon ?" <strong>(je vous conseillerai un vin de votre cave !)</strong>
                    - "À quelle température servir un Bordeaux 2018 ?"
                    - "Quels sont les meilleurs cépages pour vieillir 10 ans ?"
                    - "Peux-tu m'expliquer la différence entre AOC et IGP ?"
                    - "Quel vin offrir pour un dîner romantique ?"
                    - "Recommande-moi un vin pour ce soir"
                    <br><br>
                    <strong>✨ NOUVEAU : Je connais tous les vins que vous avez enregistrés dans votre cave !</strong> 🎉
                    <br><br>
                    Je suis là pour vous aider !`,
                    'bot',
                    true
                );
            }
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
}

// Fermer le chat IA
function closeAIChatPopup() {
    const popup = document.getElementById('aiChatPopup');
    if (popup) {
        popup.classList.remove('active');
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
        // Récupérer les bouteilles de la cave pour les envoyer au chatbot
        let caveBottles = [];
        try {
            const bottlesResponse = await fetch('/api/bottles/my-bottles');
            const bottlesData = await bottlesResponse.json();
            if (bottlesData.success && bottlesData.bottles) {
                caveBottles = bottlesData.bottles;
            }
        } catch (error) {
            console.error("Erreur lors de la récupération des bouteilles :", error);
        }
        
        // Appeler l'API Mistral via le serveur avec les bouteilles de la cave
        const response = await fetch('/api/bottles/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                question: message,
                bottles: caveBottles,
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

// ==================== FONCTIONS D'ANALYSE IA ====================

// Analyser avec IA (avec image compressée ou texte) - NOUVEAU WORKFLOW
async function analyzeWithAI() {
    // Vérifier qu'une image est disponible
    if (!window.camera.hasImage()) {
        // Si pas d'image, utiliser le texte saisi
        const name = document.getElementById('bottleName').value.trim();
        const year = document.getElementById('bottleYear').value.trim();
        const grapes = document.getElementById('bottleGrapes').value.trim();
        const region = document.getElementById('bottleRegion').value.trim();

        if (!name && !year && !grapes && !region) {
            alert("Veuillez remplir au moins un champ (nom, année, cépage ou région) ou sélectionner une image pour que je puisse vous aider.");
            return;
        }

        try {
            showLoading("Analyse du texte avec IA en cours...");
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
                let errorMsg = "Je n'ai pas pu compléter les informations.";
                if (result.error) {
                    errorMsg += "\n" + result.error;
                }
                alert(errorMsg);
            }
        } catch (error) {
            hideLoading();
            console.error("Erreur analyse IA texte :", error);
            alert("Erreur de connexion. Vérifiez que le serveur est lancé : " + error.message);
        }
        return;
    }

    // Si une image est disponible, utiliser le NOUVEAU workflow en 2 étapes
    try {
        showLoading("Analyse de l'image avec Google Vision en cours...");
        const imageDataUrl = window.camera.getCurrentImage();
        currentAnalysisImage = imageDataUrl;
        
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

        // NOUVEAU : Utiliser la route /analyze-two-step avec demande de correction du nom
        formData.append('correctName', 'true');
        const response = await fetch('/api/bottles/analyze-two-step', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        hideLoading();

        if (result.success && result.bottleInfo) {
            // Si requiresManualInput est true, ouvrir la popup de saisie manuelle
            if (result.bottleInfo.requiresManualInput) {
                // Stocker les données partielles
                currentPartialData = result.bottleInfo.partialData;
                currentMissingFields = result.bottleInfo.missingFields || result.missingFields || { name: true, year: true };
                
                // Ouvrir la popup de saisie manuelle
                document.getElementById('manualName').value = result.bottleInfo.partialData?.name || '';
                document.getElementById('manualYear').value = result.bottleInfo.partialData?.year || '';
                
                // Adapter la popup en fonction des champs manquants
                updateManualInputPopup(currentMissingFields);
                
                document.getElementById('manualInputPopup').classList.add('active');
            } else {
                // Analyse complète réussie
                fillBottleFormWithAIResult(result.bottleInfo);
                
                // Afficher un message informatif
                let message = "Analyse terminée ! Les champs ont été complétés automatiquement.";
                if (result.extractedText) {
                    message += "\n\nTexte extrait de l'étiquette :\n" + result.extractedText.substring(0, 200) + "...";
                }
                if (result.analysisMethod) {
                    message = `[${result.analysisMethod}] ` + message;
                }
                alert(message);
            }
        } else {
            let errorMsg = "Je n'ai pas pu identifier cette bouteille.";
            if (result.error) {
                errorMsg += "\n" + result.error;
            }
            if (!result.googleVisionAvailable) {
                errorMsg += "\n\nNote : Google Vision n'est pas configuré. Ajoutez GOOGLE_VISION_API_KEY dans .env pour une meilleure reconnaissance.";
            }
            
            // Si requiresManualInput est true, ouvrir la popup
            if (result.requiresManualInput) {
                currentPartialData = result.partialData;
                currentMissingFields = result.missingFields || { name: true, year: true };
                
                document.getElementById('manualName').value = result.partialData?.name || '';
                document.getElementById('manualYear').value = result.partialData?.year || '';
                
                // Adapter la popup en fonction des champs manquants
                updateManualInputPopup(currentMissingFields);
                
                document.getElementById('manualInputPopup').classList.add('active');
            } else {
                alert(errorMsg);
            }
        }
    } catch (error) {
        hideLoading();
        console.error("Erreur analyse IA image :", error);
        alert("Erreur lors de l'analyse. Vérifiez la connexion et que les API sont configurées.");
    }
}

// NOUVEAU : Soumettre les informations manuelles pour analyse par Mistral
async function submitManualInput() {
    const name = document.getElementById('manualName').value.trim();
    const year = document.getElementById('manualYear').value.trim();
    
    if (!name) {
        alert("Veuillez saisir au moins le nom de la bouteille.");
        return;
    }
    
    try {
        showLoading("Analyse avec Mistral en cours...");
        
        // Envoyer les données manuelles + l'image
        const formData = new FormData();
        
        // Ajouter l'image si disponible
        if (currentAnalysisImage) {
            const base64Data = currentAnalysisImage.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteArrays = [];
            for (let i = 0; i < byteCharacters.length; i++) {
                byteArrays.push(byteCharacters.charCodeAt(i));
            }
            const byteArray = new Uint8Array(byteArrays);
            const blob = new Blob([byteArray], { type: 'image/jpeg' });
            formData.append('image', blob, 'bottle.jpg');
        }
        
        // Ajouter les données manuelles (TOUJOURS envoyer l'année, même si vide)
        formData.append('name', name);
        formData.append('year', year);
        
        // Envoyer à la route /analyze-two-step avec demande de correction du nom
        formData.append('correctName', 'true');
        const response = await fetch('/api/bottles/analyze-two-step', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        hideLoading();
        
        if (result.success && result.bottleInfo) {
            // Si on a encore besoin de saisie manuelle, rouvrir la popup
            if (result.bottleInfo.requiresManualInput) {
                currentPartialData = result.bottleInfo.partialData;
                currentMissingFields = result.bottleInfo.missingFields || result.missingFields || { name: true, year: true };
                
                // Mettre à jour les champs avec les nouvelles valeurs
                document.getElementById('manualName').value = result.bottleInfo.partialData?.name || name;
                document.getElementById('manualYear').value = result.bottleInfo.partialData?.year || year;
                
                // Adapter la popup
                updateManualInputPopup(currentMissingFields);
                
                // S'assurer que la popup est ouverte
                document.getElementById('manualInputPopup').classList.add('active');
                
                return;
            }
            
            // Sinon, remplir le formulaire
            fillBottleFormWithAIResult(result.bottleInfo);
            
            // Fermer la popup uniquement si tout est OK
            document.getElementById('manualInputPopup').classList.remove('active');
            
            alert("Analyse terminée ! Les champs ont été complétés automatiquement par Mistral.");
        } else {
            let errorMsg = "Je n'ai pas pu compléter les informations.";
            if (result.error) {
                errorMsg += "\n" + result.error;
            }
            
            // Si requiresManualInput est true, rouvrir la popup
            if (result.requiresManualInput) {
                currentPartialData = result.partialData;
                currentMissingFields = result.missingFields || { name: true, year: true };
                
                document.getElementById('manualName').value = result.partialData?.name || name;
                document.getElementById('manualYear').value = result.partialData?.year || year;
                
                updateManualInputPopup(currentMissingFields);
                
                // S'assurer que la popup est ouverte
                document.getElementById('manualInputPopup').classList.add('active');
                
                return;
            }
            
            alert(errorMsg);
        }
    } catch (error) {
        hideLoading();
        console.error("Erreur soumission manuelle :", error);
        alert("Erreur lors de l'analyse. Vérifiez la connexion et que Mistral AI est configuré.");
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

// ==================== FONCTIONS DE GESTION DES BOUTEILLES ====================

// Sauvegarder une bouteille
function saveBottle() {
    const selectedCell = window.cave.getSelectedCell();
    if (!selectedCell) {
        alert("Aucune cellule sélectionnée. Veuillez cliquer sur une cellule vide d'abord.");
        return;
    }

    // Récupérer les données du formulaire
    let photoValue = window.camera.getCurrentImage() || "";

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
        photo: photoValue // photoValue est maintenant toujours une chaîne (vide ou nom de fichier)
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
            document.getElementById('bottlePopup').classList.remove('active');
            window.cave.loadCaveGrid();
            window.camera.resetImage();
            document.getElementById('bottleForm').reset();
            // Retirer le focus de tous les champs pour éviter le curseur clignotant
            document.getElementById('bottleName').blur();
        } else {
            alert("Erreur lors de la sauvegarde : " + (result.error || "Inconnu"));
        }
    })
    .catch(error => {
        console.error("Erreur sauvegarde :", error);
        alert("Erreur de connexion au serveur. Vérifiez qu'il est lancé.");
    });
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
            document.getElementById('bottleDetailsPopup').classList.remove('active');
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
async function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    const searchModeToggle = document.getElementById('searchModeToggle');
    const isAIMode = searchModeToggle ? searchModeToggle.checked : false;

    if (!searchTerm) {
        // Si la recherche est vide, désélectionner tout
        document.querySelectorAll('.cave-cell').forEach(cell => {
            cell.classList.remove('highlight');
        });
        
        // Fermer la popup de résultats si elle est ouverte
        const searchResultsPopup = document.getElementById('searchResultsPopup');
        if (searchResultsPopup) {
            searchResultsPopup.classList.remove('active');
        }
        return;
    }

    if (isAIMode) {
        // Mode IA : envoyer la requête au chat IA
        await performAISearch(searchTerm);
    } else {
        // Mode Cave : ouvrir la popup avec les résultats
        handleCaveSearchInput();
    }
}

// Gérer la saisie dans la barre de recherche en mode Cave
function handleCaveSearchInput() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    const searchResultsPopup = document.getElementById('searchResultsPopup');
    
    // Annuler le timeout précédent si il existe
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // Si le terme de recherche est vide, fermer la popup
    if (!searchTerm) {
        if (searchResultsPopup) {
            searchResultsPopup.classList.remove('active');
        }
        return;
    }
    
    // Attendre 200ms après la dernière touche pour éviter les requêtes trop fréquentes
    searchTimeout = setTimeout(() => {
        performCaveSearch(searchTerm);
    }, 200);
}

// Recherche locale dans la cave avec affichage des résultats dans une popup
function performCaveSearch(searchTerm) {
    const grid = window.cave.getCaveGrid();
    const bottles = grid.flat().filter(bottle => bottle !== null);
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    const searchResultsPopup = document.getElementById('searchResultsPopup');

    const term = searchTerm.toLowerCase();
    
    const matchingBottles = bottles.filter(bottle => {
        return (
            (bottle.name && bottle.name.toLowerCase().includes(term)) ||
            (bottle.year && bottle.year.toString().includes(term)) ||
            (bottle.grapes && bottle.grapes.toLowerCase().includes(term)) ||
            (bottle.region && bottle.region.toLowerCase().includes(term)) ||
            (bottle.foodPairing && bottle.foodPairing.toLowerCase().includes(term)) ||
            (bottle.temperature && bottle.temperature.toLowerCase().includes(term))
        );
    });

    // Mettre à jour la popup de résultats
    if (searchResultsContainer) {
        if (matchingBottles.length === 0) {
            searchResultsContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <p>Aucune bouteille trouvée pour "${searchTerm}"</p>
                </div>
            `;
        } else {
            searchResultsContainer.innerHTML = matchingBottles.map(bottle => {
                const photoUrl = bottle.photo ? 
                    (bottle.photo.startsWith('http') ? bottle.photo : `/uploads/${bottle.photo}`) :
                    'https://cdn-icons-png.flaticon.com/512/3173/3173612.png';
                
                return `
                    <div class="search-result-item" data-row="${bottle.row}" data-col="${bottle.col}">
                        <img src="${photoUrl}" alt="${bottle.name || 'Bouteille'}" class="bottle-image" onerror="this.src='https://cdn-icons-png.flaticon.com/512/3173/3173612.png'">
                        <div class="bottle-info">
                            <div class="bottle-name">${bottle.name || 'Bouteille inconnue'}</div>
                            <div class="bottle-details">
                                ${bottle.year ? `<span class="bottle-detail"><i class="fas fa-calendar"></i>${bottle.year}</span>` : ''}
                                ${bottle.grapes ? `<span class="bottle-detail"><i class="fas fa-leaf"></i>${bottle.grapes}</span>` : ''}
                                ${bottle.region ? `<span class="bottle-detail"><i class="fas fa-map-marker-alt"></i>${bottle.region}</span>` : ''}
                                ${bottle.temperature ? `<span class="bottle-detail"><i class="fas fa-thermometer-half"></i>${bottle.temperature}</span>` : ''}
                            </div>
                        </div>
                        <div class="bottle-position">
                            <i class="fas fa-th"></i> ${bottle.row + 1},${bottle.col + 1}
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // Ouvrir la popup si elle n'est pas déjà ouverte
    if (searchResultsPopup && !searchResultsPopup.classList.contains('active')) {
        searchResultsPopup.classList.add('active');
    }
    
    // Ajouter les écouteurs de clic sur les résultats
    addResultItemClickListeners();
}

// Ajouter les écouteurs de clic sur les éléments de résultat
function addResultItemClickListeners() {
    const resultItems = document.querySelectorAll('.search-result-item');
    resultItems.forEach(item => {
        item.addEventListener('click', () => {
            const row = parseInt(item.dataset.row);
            const col = parseInt(item.dataset.col);
            
            // Sélectionner la cellule correspondante dans la cave
            const cell = document.querySelector(`.cave-cell[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                // Désélectionner toutes les cellules
                document.querySelectorAll('.cave-cell').forEach(c => c.classList.remove('highlight'));
                // Surligner la cellule sélectionnée
                cell.classList.add('highlight');
                // Ouvrir la popup de détails de la bouteille
                window.cave.openBottleDetailsPopup(row, col);
            }
            
            // Fermer la popup de résultats
            const searchResultsPopup = document.getElementById('searchResultsPopup');
            if (searchResultsPopup) {
                searchResultsPopup.classList.remove('active');
            }
            
            // Vider la barre de recherche
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = '';
            }
        });
    });
}

// Recherche IA (comme dans le chat IA)
async function performAISearch(query) {
    const aiMessages = document.getElementById('aiMessages');
    const aiChatPopup = document.getElementById('aiChatPopup');
    
    // Ouvrir la popup de chat IA si elle n'est pas déjà ouverte
    if (aiChatPopup && !aiChatPopup.classList.contains('active')) {
        openAIChatPopup();
    }

    // Ajouter la question de l'utilisateur dans le chat
    if (aiMessages) {
        addChatMessage(query, 'user', false);
    }

    // Envoyer la requête au chat IA
    const input = document.getElementById('aiChatInput');
    if (input) {
        input.value = query;
        await sendAIChatMessage();
    }
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

// Générer une réponse IA locale (fallback)
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

// Exporter les fonctions pour les utiliser dans d'autres scripts
window.openAddBottlePopup = window.cave.openAddBottlePopup;
window.openBottleDetailsPopup = window.cave.openBottleDetailsPopup;
window.fillBottleFormWithAIResult = fillBottleFormWithAIResult;
window.openAIChatPopup = openAIChatPopup;
window.suggestPrompt = suggestPrompt;
window.closeAIChatPopup = closeAIChatPopup;
window.cave.getSelectedCell = () => selectedCell;
window.analyzeWithAI = analyzeWithAI;
