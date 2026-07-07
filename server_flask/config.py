"""
Configuration pour l'API Mistral et Google Vision
"""
import os
from dotenv import load_dotenv

# Charger le fichier .env
load_dotenv()

class Config:
    # Configuration Flask
    SECRET_KEY = os.environ.get('SECRET_KEY', 'ma-cave-a-vin-secret-key')
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '../public/uploads')
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5Mo
    
    # Configuration Mistral AI
    MISTRAL_API_KEY = os.environ.get('MISTRAL_API_KEY', None)
    MISTRAL_MODEL = os.environ.get('MISTRAL_MODEL', 'mistral-tiny')
    MISTRAL_BASE_URL = 'https://api.mistral.ai/v1/'
    
        
    # Prompt système pour le chat IA
    SYSTEM_PROMPT = """Tu es un expert en vin et en gestion de cave à vin. 
Tu dois répondre de manière précise, professionnelle et utile aux questions sur :
- Les accords mets-vins (quel vin avec quel plat)
- Les températures de service
- Les cépages, régions et appellations
- La gestion d'une cave à vin
- L'analyse d'étiquettes de vin

Réponds toujours en français, de manière claire et concise. 
Si tu ne connais pas la réponse, dis-le honnêtement et propose des alternatives.
Ne fais pas de blagues, reste professionnel.
Utilise des emojis vinicoles (🍷, 🍇) avec modération."""
    
    # Prompt système pour l'analyse d'image
    ANALYSIS_SYSTEM_PROMPT = """Tu es un expert en reconnaissance d'étiquettes de vin. 
On va te donner du texte extrait d'une étiquette de vin à analyser.
Ton rôle est d'analyser ce texte et d'extraire les informations suivantes :
- Nom du vin (ou du domaine/château)
- Année/millésime (si présente)
- Cépage(s) principal(aux)
- Région/appellation
- Producteur (si identifiable)
- Pays d'origine
- Degré d'alcool

Format de réponse : UNIQUEMENT un objet JSON avec les champs : name, year, grapes, region, appellation, producer, country, alcohol.
Si une information n'est pas trouvée, mets null.
Ne réponds JAMAIS autre chose que le JSON."""

# Vérifier que les clés API sont configurées
if not Config.MISTRAL_API_KEY:
    print('⚠️ Attention : MISTRAL_API_KEY non configurée. L\'IA Mistral ne fonctionnera pas.')
    print('   Ajoutez MISTRAL_API_KEY=votre_clé dans le fichier .env')

if not Config.GOOGLE_VISION_API_KEY:
    print('⚠️ Attention : GOOGLE_VISION_API_KEY non configurée. L\'OCR ne fonctionnera pas.')
    print('   Ajoutez GOOGLE_VISION_API_KEY=votre_clé dans le fichier .env')
    print('   Vous pouvez obtenir une clé gratuite (1000 requêtes/mois) sur :')
    print('   https://console.cloud.google.com/apis/credentials')
