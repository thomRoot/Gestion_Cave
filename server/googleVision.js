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
                // CORRIGÉ: Utiliser une regex pour extraire la partie base64 après la virgule
                const match = imagePathOrBase64.match(/^data:image\/\w+;base64,(.+)$/);
                base64Image = match ? match[1] : imagePathOrBase64.split(',')[1];
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
 * Extraire le nom et l'année de la bouteille depuis le texte de l'étiquette
 * @param {string} text - Texte extrait de l'étiquette
 * @returns {Object} - Objet avec name et year (ou null si non trouvé)
 */
function extractBottleNameAndYear(text) {
    if (!text || !text.trim()) {
        return { name: null, year: null, rawText: text };
    }

    // Nettoyer le texte
    const cleanedText = text
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // Extraire l'année (recherche de 4 chiffres entre 1900 et 2099)
    let year = null;
    const yearMatch = cleanedText.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
        const foundYear = parseInt(yearMatch[0]);
        if (foundYear >= 1900 && foundYear <= 2099) {
            year = foundYear;
        }
    }

    // Extraire le nom : on prend la première ligne ou le texte avant l'année
    let name = null;
    if (year) {
        // Si on a trouvé une année, prendre le texte avant comme nom
        const yearIndex = cleanedText.indexOf(year.toString());
        if (yearIndex > 0) {
            name = cleanedText.substring(0, yearIndex).trim();
        }
    }

    // Si pas de nom trouvé, prendre la première ligne ou les premiers mots
    if (!name || name.length < 2) {
        // Prendre les 10 premiers mots comme nom par défaut
        const words = cleanedText.split(' ').filter(word => word.length > 1);
        if (words.length > 0) {
            name = words.slice(0, Math.min(10, words.length)).join(' ');
        }
    }

    // Nettoyer le nom : supprimer les caractères spéciaux en trop
    if (name) {
        name = name
            .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    return {
        name: name || null,
        year: year || null,
        rawText: cleanedText
    };
}

/**
 * Analyser une image pour extraire le nom et l'année avec Google Vision
 * @param {string} imagePathOrBase64 - Chemin de l'image ou base64
 * @param {boolean} isBase64 - Si true, c'est déjà du base64
 * @returns {Promise<Object>} - Résultat avec name, year, rawText
 */
async function analyzeBottleForNameAndYear(imagePathOrBase64, isBase64 = false) {
    try {
        const rawText = await getCleanedLabelText(imagePathOrBase64, isBase64);
        if (!rawText) {
            return {
                name: null,
                year: null,
                rawText: null,
                success: false,
                error: "Aucun texte détecté sur l'étiquette"
            };
        }

        const extracted = extractBottleNameAndYear(rawText);
        return {
            name: extracted.name,
            year: extracted.year,
            rawText: extracted.rawText,
            success: true
        };
    } catch (error) {
        console.error('Erreur analyse nom/année:', error.message);
        return {
            name: null,
            year: null,
            rawText: null,
            success: false,
            error: error.message
        };
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
    GOOGLE_CONFIG,
    analyzeBottleForNameAndYear,
    extractBottleNameAndYear
};
