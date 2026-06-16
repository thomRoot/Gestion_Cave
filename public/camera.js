let stream = null;

// Démarrer la caméra
function startCamera() {
    const cameraPreview = document.getElementById('cameraPreview');
    const takePhotoButton = document.getElementById('takePhotoButton');
    const uploadPhotoButton = document.getElementById('uploadPhotoButton');
    const photoUpload = document.getElementById('photoUpload');

    // Vérifier si la caméra est déjà démarrée
    if (stream) {
        return;
    }

    // Demander l'accès à la caméra
    navigator.mediaDevices.getUserMedia({ video: true })
        .then((mediaStream) => {
            stream = mediaStream;
            cameraPreview.srcObject = stream;
            cameraPreview.style.display = 'block';
            takePhotoButton.style.display = 'inline-block';
            uploadPhotoButton.style.display = 'inline-block';

            // Gestion du bouton "Prendre une photo"
            takePhotoButton.onclick = () => {
                takePhoto();
            };

            // Gestion du bouton "Télécharger une image"
            uploadPhotoButton.onclick = () => {
                photoUpload.click();
            };

            // Gestion du changement de fichier
            photoUpload.onchange = (event) => {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        stopCamera();
                        document.getElementById('bottlePhotoPreview').src = e.target.result;
                        document.getElementById('bottlePhotoPreview').style.display = 'block';
                        cameraPreview.style.display = 'none';
                        takePhotoButton.style.display = 'none';
                        uploadPhotoButton.style.display = 'none';
                    };
                    reader.readAsDataURL(file);
                }
            };
        })
        .catch((error) => {
            console.error("Erreur lors de l'accès à la caméra :", error);
            alert("Impossible d'accéder à la caméra. Veuillez vérifier les permissions.");
        });
}

// Prendre une photo
function takePhoto() {
    const cameraPreview = document.getElementById('cameraPreview');
    const canvas = document.getElementById('photoCanvas');
    const photoPreview = document.getElementById('bottlePhotoPreview');

    // Définir les dimensions du canvas
    canvas.width = cameraPreview.videoWidth;
    canvas.height = cameraPreview.videoHeight;

    // Dessiner l'image de la caméra sur le canvas
    const context = canvas.getContext('2d');
    context.drawImage(cameraPreview, 0, 0, canvas.width, canvas.height);

    // Convertir le canvas en image
    const photoDataUrl = canvas.toDataURL('image/jpeg');
    photoPreview.src = photoDataUrl;
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
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

// Exporter les fonctions
window.camera = {
    startCamera,
    stopCamera,
    takePhoto
};
