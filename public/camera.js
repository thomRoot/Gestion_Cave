// camera.js - Gestion SIMPLIFIÉE de la caméra pour Ma Cave à Vin
// Version ultra-robuste pour mobile (NAS Synology, Android, iOS)
// Si la caméra échoue → fallback automatique vers la galerie

let stream = null;
let currentImageDataUrl = null;

// Démarrer la caméra (avec fallback automatique)
function startCamera() {
    const cameraPreview = document.getElementById('cameraPreview');
    const takePhotoButton = document.getElementById('takePhotoButton');
    const uploadPhotoButton = document.getElementById('uploadPhotoButton');
    const photoUpload = document.getElementById('photoUpload');
    const photoPreview = document.getElementById('bottlePhotoPreview');

    // Masquer l'aperçu de la photo si elle existe
    photoPreview.style.display = 'none';

    // TOUJOURS afficher le bouton Galerie (même si la caméra échoue)
    uploadPhotoButton.style.display = 'inline-flex';

    // Gestion du bouton "Télécharger une image" (TOUJOURS disponible)
    uploadPhotoButton.onclick = () => {
        photoUpload.click();
    };

    // Gestion du changement de fichier (galerie)
    photoUpload.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            handleImageFile(file);
        }
    };

    // Essayer la caméra (mais ne pas bloquer si ça échoue)
    tryCamera(cameraPreview, takePhotoButton, photoPreview);
}

// Essayer d'accéder à la caméra (sans bloquer l'application)
function tryCamera(cameraPreview, takePhotoButton, photoPreview) {
    // Vérifier si l'API existe
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log("API caméra non disponible, utilisation de la galerie uniquement");
        return;
    }

    // Options pour la caméra (caméra arrière sur mobile)
    const constraints = {
        video: {
            facingMode: 'environment', // Caméra arrière
            width: { ideal: 1280 },
            height: { ideal: 720 }
        },
        audio: false
    };

    // Essayer d'accéder à la caméra
    navigator.mediaDevices.getUserMedia(constraints)
        .then((mediaStream) => {
            stream = mediaStream;
            cameraPreview.srcObject = stream;
            cameraPreview.style.display = 'block';
            takePhotoButton.style.display = 'inline-flex';

            // Gestion du bouton "Prendre une photo"
            takePhotoButton.onclick = () => {
                takePhoto(cameraPreview, photoPreview);
            };
        })
        .catch((error) => {
            // NE PAS afficher d'erreur bloquante, juste un log
            console.log("Caméra non disponible (normal sur certains mobiles) :", error.name);
            // La galerie reste disponible via le bouton "Galerie"
        });
}

// Prendre une photo
function takePhoto(cameraPreview, photoPreview) {
    const canvas = document.getElementById('photoCanvas');

    if (!stream || cameraPreview.videoWidth === 0) {
        alert("La caméra n'est pas prête. Utilisez la galerie à la place.");
        return;
    }

    const width = cameraPreview.videoWidth;
    const height = cameraPreview.videoHeight;
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    context.drawImage(cameraPreview, 0, 0, width, height);

    currentImageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    photoPreview.src = currentImageDataUrl;
    photoPreview.style.display = 'block';

    stopCamera();
    cameraPreview.style.display = 'none';
    document.getElementById('takePhotoButton').style.display = 'none';
}

// Arrêter la caméra
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

// Gérer un fichier image (depuis la galerie)
function handleImageFile(file) {
    const photoPreview = document.getElementById('bottlePhotoPreview');
    const cameraPreview = document.getElementById('cameraPreview');
    
    if (!file.type.match('image.*')) {
        alert("Veuillez sélectionner une image (JPEG, PNG, etc.)");
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        alert("L'image est trop grande (max 10Mo). Choisissez une image plus petite.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        stopCamera();
        currentImageDataUrl = e.target.result;
        photoPreview.src = currentImageDataUrl;
        photoPreview.style.display = 'block';
        cameraPreview.style.display = 'none';
        document.getElementById('takePhotoButton').style.display = 'none';
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
    stopCamera,
    takePhoto,
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
