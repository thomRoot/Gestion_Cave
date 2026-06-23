// camera.js - Gestion de la galerie avec compression d'images pour l'IA
// Version corrigée : bouton "Sélectionner une image" fonctionnel

let currentImageDataUrl = null;

// Fonction pour compresser une image
function compressImage(file, maxWidth = 800, maxHeight = 600, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Créer un canvas avec les dimensions maximales
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Redimensionner si nécessaire
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.floor(width * ratio);
                    height = Math.floor(height * ratio);
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convertir en JPEG avec compression
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            };
            img.onerror = reject;
            img.src = event.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Initialiser la sélection de fichier
function initFileUpload() {
    const photoUpload = document.getElementById('photoUpload');
    const photoPreview = document.getElementById('bottlePhotoPreview');
    const cameraPreview = document.getElementById('cameraPreview');

    if (!photoUpload || !photoPreview) {
        console.error("Éléments manquants pour la gestion des fichiers");
        return;
    }

    // Gestion du changement de fichier
    photoUpload.onchange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            await handleImageFile(file);
        }
    };
}

// Démarrer la sélection de fichier (appelé depuis cave.js)
// Si resetImage = true, réinitialise l'image actuelle. Sinon, conserve l'image existante.
function startCamera(resetImage = true) {
    const photoPreview = document.getElementById('bottlePhotoPreview');
    const cameraPreview = document.getElementById('cameraPreview');
    
    // Si on ne doit pas réinitialiser et qu'il y a déjà une image, la conserver
    if (!resetImage && currentImageDataUrl) {
        // Ne rien faire, garder l'image actuelle
    } else {
        // Masquer les aperçus
        if (photoPreview) photoPreview.style.display = 'none';
        if (cameraPreview) cameraPreview.style.display = 'none';
        currentImageDataUrl = null;
    }

    // Initialiser la gestion des fichiers
    initFileUpload();
}

// Gérer un fichier image (depuis la galerie) avec compression
async function handleImageFile(file) {
    const photoPreview = document.getElementById('bottlePhotoPreview');
    const cameraPreview = document.getElementById('cameraPreview');
    
    if (!file.type.match('image.*')) {
        alert("Veuillez sélectionner une image (JPEG, PNG, etc.)");
        return;
    }

    // Limite à 10Mo pour le fichier source (la compression réduira la taille)
    if (file.size > 10 * 1024 * 1024) {
        alert("L'image est trop grande (max 10Mo). Choisissez une image plus petite.");
        return;
    }

    try {
        // Compresser l'image
        const compressedDataUrl = await compressImage(file, 800, 600, 0.7);
        
        // Vérifier que la taille compressée est raisonnable (< 1Mo)
        const base64Data = compressedDataUrl.split(',')[1];
        const byteSize = atob(base64Data).length;
        
        if (byteSize > 1 * 1024 * 1024) {
            // Si toujours trop grand, compresser davantage
            const moreCompressed = await compressImage(file, 600, 450, 0.5);
            currentImageDataUrl = moreCompressed;
        } else {
            currentImageDataUrl = compressedDataUrl;
        }
        
        if (photoPreview) {
            photoPreview.src = currentImageDataUrl;
            photoPreview.style.display = 'block';
        }
        if (cameraPreview) cameraPreview.style.display = 'none';
        
        const photoUpload = document.getElementById('photoUpload');
        if (photoUpload) photoUpload.value = '';
        
        console.log(`Image compressée : ${(byteSize / 1024 / 1024).toFixed(2)} Mo`);
        
        // Déclencher automatiquement l'analyse avec l'IA après le téléchargement de l'image
        if (typeof analyzeWithAI === 'function') {
            setTimeout(analyzeWithAI, 100); // Petit délai pour laisser le temps à l'interface de se mettre à jour
        }
    } catch (error) {
        console.error("Erreur compression :", error);
        alert("Erreur lors du traitement de l'image. Veuillez réessayer.");
    }
}

// Obtenir l'image actuelle (déjà compressée)
function getCurrentImage() {
    return currentImageDataUrl;
}

// Vérifier si une image est disponible
function hasImage() {
    return currentImageDataUrl !== null && currentImageDataUrl !== '';
}

// Réinitialiser l'image
function resetImage() {
    currentImageDataUrl = null;
    const photoPreview = document.getElementById('bottlePhotoPreview');
    if (photoPreview) {
        photoPreview.style.display = 'none';
        photoPreview.src = '';
    }
}

// Définir l'image actuelle à partir d'une URL (pour l'édition)
function setCurrentImageFromUrl(imageUrl) {
    currentImageDataUrl = imageUrl;
    const photoPreview = document.getElementById('bottlePhotoPreview');
    if (photoPreview) {
        photoPreview.src = imageUrl;
        photoPreview.style.display = 'block';
    }
}

// Exporter les fonctions
window.camera = {
    startCamera,
    stopCamera: () => {}, // Plus de stream à arrêter
    takePhoto: () => {}, // Plus de caméra
    handleImageFile,
    getCurrentImage,
    hasImage,
    resetImage,
    setCurrentImageFromUrl
};

// Support du drag & drop
function setupDragAndDrop() {
    const photoPreviewContainer = document.querySelector('.photo-preview-container');
    if (!photoPreviewContainer) return;

    photoPreviewContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        photoPreviewContainer.style.border = '2px dashed #D4AF37';
    });

    photoPreviewContainer.addEventListener('dragleave', () => {
        photoPreviewContainer.style.border = '';
    });

    photoPreviewContainer.addEventListener('drop', async (e) => {
        e.preventDefault();
        photoPreviewContainer.style.border = '';
        const file = e.dataTransfer.files[0];
        if (file && file.type.match('image.*')) {
            await handleImageFile(file);
        }
    });
}

// Initialiser quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    setupDragAndDrop();
    // Initialiser aussi la gestion des fichiers au chargement
    initFileUpload();
});
