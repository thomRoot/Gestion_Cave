// camera.js - Gestion SIMPLIFIÉE : UNIQUEMENT la galerie (pas de caméra)
// Version ultra-robuste pour éviter tous les problèmes

let currentImageDataUrl = null;

// Démarrer la sélection de fichier (galerie uniquement)
function startCamera() {
    const photoUpload = document.getElementById('photoUpload');
    const photoPreview = document.getElementById('bottlePhotoPreview');
    const cameraPreview = document.getElementById('cameraPreview');
    
    // Masquer l'aperçu de la photo si elle existe
    photoPreview.style.display = 'none';
    cameraPreview.style.display = 'none';
    
    // Masquer les boutons de caméra (on n'utilise que la galerie)
    document.getElementById('takePhotoButton').style.display = 'none';
    
    // Afficher uniquement le bouton Galerie
    document.getElementById('uploadPhotoButton').style.display = 'inline-flex';
    
    // Gestion du bouton "Télécharger une image"
    document.getElementById('uploadPhotoButton').onclick = () => {
        photoUpload.click();
    };

    // Gestion du changement de fichier (galerie)
    photoUpload.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            handleImageFile(file);
        }
    };
}

// Gérer un fichier image (depuis la galerie)
function handleImageFile(file) {
    const photoPreview = document.getElementById('bottlePhotoPreview');
    const cameraPreview = document.getElementById('cameraPreview');
    
    if (!file.type.match('image.*')) {
        alert("Veuillez sélectionner une image (JPEG, PNG, etc.)");
        return;
    }

    // Limite à 5Mo pour éviter les problèmes
    if (file.size > 5 * 1024 * 1024) {
        alert("L'image est trop grande (max 5Mo). Choisissez une image plus petite.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        currentImageDataUrl = e.target.result;
        photoPreview.src = currentImageDataUrl;
        photoPreview.style.display = 'block';
        cameraPreview.style.display = 'none';
        document.getElementById('uploadPhotoButton').style.display = 'none';
        document.getElementById('photoUpload').value = '';
    };
    reader.readAsDataURL(file);
}

// Obtenir l'image actuelle
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
    photoPreview.style.display = 'none';
    photoPreview.src = '';
}

// Exporter les fonctions
window.camera = {
    startCamera,
    stopCamera: () => {}, // Plus de stream à arrêter
    takePhoto: () => {}, // Plus de caméra
    handleImageFile,
    getCurrentImage,
    hasImage,
    resetImage
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

    photoPreviewContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        photoPreviewContainer.style.border = '';
        const file = e.dataTransfer.files[0];
        if (file && file.type.match('image.*')) {
            handleImageFile(file);
        }
    });
}

document.addEventListener('DOMContentLoaded', setupDragAndDrop);
