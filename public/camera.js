// camera.js - Gestion de la caméra et des photos pour Ma Cave à Vin
// Version améliorée pour mobile avec support Android/iOS

let stream = null;
let currentImageDataUrl = null;

// Démarrer la caméra
function startCamera() {
    const cameraPreview = document.getElementById('cameraPreview');
    const takePhotoButton = document.getElementById('takePhotoButton');
    const uploadPhotoButton = document.getElementById('uploadPhotoButton');
    const photoUpload = document.getElementById('photoUpload');
    const photoPreview = document.getElementById('bottlePhotoPreview');

    // Vérifier si la caméra est déjà démarrée
    if (stream) {
        return;
    }

    // Masquer l'aperçu de la photo si elle existe
    photoPreview.style.display = 'none';

    // Vérifier si l'API mediaDevices est disponible
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Votre navigateur ne supporte pas l'accès à la caméra. Veuillez utiliser un navigateur moderne.");
        return;
    }

    // Options pour la caméra - privilégier la caméra arrière sur mobile
    const constraints = {
        video: {
            facingMode: 'environment', // Caméra arrière par défaut
            width: { ideal: 1280 },
            height: { ideal: 720 }
        },
        audio: false
    };

    // Demander l'accès à la caméra
    navigator.mediaDevices.getUserMedia(constraints)
        .then((mediaStream) => {
            stream = mediaStream;
            cameraPreview.srcObject = stream;
            cameraPreview.style.display = 'block';
            takePhotoButton.style.display = 'inline-flex';
            uploadPhotoButton.style.display = 'inline-flex';

            // Gestion du bouton "Prendre une photo"
            takePhotoButton.onclick = () => {
                takePhoto();
            };

            // Gestion du bouton "Télécharger une image"
            uploadPhotoButton.onclick = () => {
                // Utiliser capture="environment" pour forcer la caméra sur mobile
                photoUpload.click();
            };

            // Gestion du changement de fichier
            photoUpload.onchange = (event) => {
                const file = event.target.files[0];
                if (file) {
                    handleImageFile(file);
                }
            };
        })
        .catch((error) => {
            console.error("Erreur lors de l'accès à la caméra :", error);
            
            // Messages d'erreur spécifiques
            let errorMessage = "Impossible d'accéder à la caméra.";
            if (error.name === 'NotAllowedError') {
                errorMessage = "Permission refusée. Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur.";
            } else if (error.name === 'NotFoundError') {
                errorMessage = "Aucune caméra trouvée. Veuillez vérifier que votre appareil en a une.";
            } else if (error.name === 'NotReadableError') {
                errorMessage = "La caméra est déjà utilisée par une autre application.";
            }
            
            alert(errorMessage);
            
            // Proposer de télécharger une image à la place
            if (confirm("Souhaitez-vous télécharger une image depuis votre galerie à la place ?")) {
                photoUpload.click();
            }
        });
}

// Gérer un fichier image (depuis la galerie ou drag & drop)
function handleImageFile(file) {
    const photoPreview = document.getElementById('bottlePhotoPreview');
    const cameraPreview = document.getElementById('cameraPreview');
    
    if (!file.type.match('image.*')) {
        alert("Veuillez sélectionner un fichier image valide.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        // Arrêter la caméra si elle est active
        stopCamera();
        
        // Afficher l'image
        currentImageDataUrl = e.target.result;
        photoPreview.src = currentImageDataUrl;
        photoPreview.style.display = 'block';
        cameraPreview.style.display = 'none';
        
        // Masquer les boutons de la caméra
        document.getElementById('takePhotoButton').style.display = 'none';
        document.getElementById('uploadPhotoButton').style.display = 'none';
        
        // Réinitialiser l'input file pour permettre de sélectionner le même fichier à nouveau
        document.getElementById('photoUpload').value = '';
    };
    reader.readAsDataURL(file);
}

// Prendre une photo
function takePhoto() {
    const cameraPreview = document.getElementById('cameraPreview');
    const canvas = document.getElementById('photoCanvas');
    const photoPreview = document.getElementById('bottlePhotoPreview');

    // Vérifier que la caméra est active
    if (!stream || cameraPreview.videoWidth === 0) {
        alert("La caméra n'est pas prête. Veuillez patienter.");
        return;
    }

    // Définir les dimensions du canvas
    const width = cameraPreview.videoWidth;
    const height = cameraPreview.videoHeight;
    canvas.width = width;
    canvas.height = height;

    // Dessiner l'image de la caméra sur le canvas
    const context = canvas.getContext('2d');
    context.drawImage(cameraPreview, 0, 0, width, height);

    // Convertir le canvas en image
    currentImageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    photoPreview.src = currentImageDataUrl;
    photoPreview.style.display = 'block';

    // Arrêter la caméra
    stopCamera();
    cameraPreview.style.display = 'none';
    document.getElementById('takePhotoButton').style.display = 'none';
    document.getElementById('uploadPhotoButton').style.display = 'none';
}

// Arrêter la caméra
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => {
            track.stop();
        });
        stream = null;
    }
}

// Obtenir l'image actuelle (pour sauvegarde)
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
    stopCamera,
    takePhoto,
    handleImageFile,
    getCurrentImage,
    hasImage,
    resetImage
};

// Support du drag & drop pour les images
function setupDragAndDrop() {
    const photoPreviewContainer = document.querySelector('.photo-preview-container');
    if (!photoPreviewContainer) return;

    photoPreviewContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        photoPreviewContainer.style.border = '2px dashed var(--secondary-color)';
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

// Initialiser le drag & drop quand le DOM est chargé
document.addEventListener('DOMContentLoaded', setupDragAndDrop);
