// googleVision.js - Intégration de Google Vision API pour OCR
// Utilisé pour extraire le texte des étiquettes de vin avant analyse par Mistral

const https = require('https');
const fs = require('fs');
const path = require('path');

// Charger la configuration depuis .env
function loadEnvFile() {
    const envPath = path.join(__dirname, '../.env');
    try {
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const lines = envContent.split('\n');
            
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine && !trimmedLine.startsWith('#')) {
                    const [key, value] = trimmedLine.split('=');
                    if (key && value) {
                        process.env[key.trim()] = value.trim();
                    }
                }
            }
        }
    } catch (error) {
        console.warn('⚠️ Impossible de charger le fichier .env:', error.message);
    }
}

loadEnvFile();

const GOOGLE_CONFIG = {
    apiKey: process.env.GOOGLE_VISION_API_KEY || null,
    baseUrl: 'https://vision.googleapis.com/v1'
};

/**
 * Effectuer une requête à Google Vision API
 * @param {string} base64Image - Image encodée en base64
 * @returns {Promise<Object>} - Résultat de l'OCR
 */
async function callGoogleVisionAPI(base64Image) {
    if (!GOOGLE_CONFIG.apiKey) {
        throw new Error('GOOGLE_VISION_API_KEY non configurée. Ajoutez-la dans le fichier .env');
    }

    return new Promise((resolve, reject) => {
        const requestBody = {
            requests: [
                {
                    image: {
                        content: base64Image
                    },
                    features: [
                        {
                            type: 'TEXT_DETECTION',
                            maxResults: 1
                        }
                    ]
                }
            ]
        };

        const postData = JSON.stringify(requestBody);

        const options = {
            hostname: 'vision.googleapis.com',
            path: '/v1/images:annotate?key=' + GOOGLE_CONFIG.apiKey,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const result = JSON.parse(data);
                        resolve(result);
                    } catch (parseError) {
                        reject(new Error(`Erreur de parsing JSON: ${parseError.message}`));
                    }
                } else {
                    reject(new Error(`Erreur HTTP ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

/**
 * Extraire le texte d'une image d'étiquette de vin
 * @param {string} imagePathOrBase64 - Chemin du fichier ou image en base64
 * @param {boolean} isBase64 - Si true, imagePathOrBase64 est déjà en base64
 * @returns {Promise<string>} - Texte extrait
 */
async function extractTextFromWineLabel(imagePathOrBase64, isBase64 = false) {
    try {
        let base64Image;
        
        if (isBase64) {
            // Si c'est déjà une data URL, extraire la partie base64
            if (imagePathOrBase64.startsWith('data:image/')) {
                base64Image = imagePathOrBase64.split(',')[1];
            } else {
                base64Image = imagePathOrBase64;
            }
        } else {
            // Lire le fichier et le convertir en base64
            const imageBuffer = fs.readFileSync(imagePathOrBase64);
            base64Image = imageBuffer.toString('base64');
        }

        const result = await callGoogleVisionAPI(base64Image);
        
        if (result && result.responses && result.responses.length > 0) {
            const textAnnotations = result.responses[0].textAnnotations;
            if (textAnnotations && textAnnotations.length > 0) {
                // Retourner tout le texte détecté
                return textAnnotations[0].description;
            }
        }
        
        return null;
    } catch (error) {
        console.error('Erreur extraction texte Google Vision:', error.message);
        throw error;
    }
}

/**
 * Extraire le texte et nettoyer pour l'analyse
 * @param {string} imagePathOrBase64 - Image à analyser
 * @param {boolean} isBase64 - Si true, c'est déjà du base64
 * @returns {Promise<string>} - Texte nettoyé
 */
async function getCleanedLabelText(imagePathOrBase64, isBase64 = false) {
    try {
        const rawText = await extractTextFromWineLabel(imagePathOrBase64, isBase64);
        
        if (!rawText) {
            return null;
        }

        // Nettoyer le texte : supprimer les sauts de ligne multiples, espaces excessifs
        let cleanedText = rawText
            .replace(/\n+/g, '\n')
            .replace(/\s+/g, ' ')
            .trim();

        // Supprimer les caractères non pertinents (symboles, etc.)
        cleanedText = cleanedText.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

        return cleanedText;
    } catch (error) {
        console.error('Erreur nettoyage texte:', error.message);
        return null;
    }
}

/**
 * Vérifier si Google Vision est configuré
 * @returns {boolean}
 */
function isGoogleVisionConfigured() {
    return !!GOOGLE_CONFIG.apiKey;
}

module.exports = {
    extractTextFromWineLabel,
    getCleanedLabelText,
    isGoogleVisionConfigured,
    GOOGLE_CONFIG
};
