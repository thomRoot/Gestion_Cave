"""
Intégration avec Google Vision API pour l'OCR
"""
import requests
import json
import base64
import os
from .config import Config

class GoogleVision:
    def __init__(self):
        self.api_key = Config.GOOGLE_VISION_API_KEY
        self.base_url = 'https://vision.googleapis.com/v1/'
    
    def extract_text_from_image(self, image_path=None, image_base64=None):
        """Extraire du texte d'une image en utilisant Google Vision OCR"""
        if not self.api_key:
            return None
        
        # Préparer l'image
        if image_base64:
            # Si c'est une data URL, extraire la partie base64
            if image_base64.startswith('data:image/'):
                image_base64 = image_base64.split(',')[1]
            image_content = base64.b64decode(image_base64)
        elif image_path and os.path.exists(image_path):
            with open(image_path, 'rb') as f:
                image_content = f.read()
        else:
            return None
        
        # Préparer la requête
        url = f'{self.base_url}images:annotate?key={self.api_key}'
        
        request_body = {
            'requests': [
                {
                    'image': {
                        'content': base64.b64encode(image_content).decode('utf-8')
                    },
                    'features': [
                        {
                            'type_': 'TEXT_DETECTION',
                            'maxResults': 1
                        }
                    ]
                }
            ]
        }
        
        try:
            response = requests.post(
                url,
                headers={'Content-Type': 'application/json'},
                json=request_body,
                timeout=30
            )
            response.raise_for_status()
            
            result = response.json()
            if 'responses' in result and len(result['responses']) > 0:
                text_annotations = result['responses'][0].get('textAnnotations', [])
                if text_annotations:
                    return text_annotations[0].get('description', '')
            
            return None
        except requests.exceptions.RequestException as e:
            print(f"Erreur lors de l'appel à Google Vision: {e}")
            return None
    
    def extract_text_from_base64(self, image_base64):
        """Extraire du texte d'une image encodée en base64"""
        return self.extract_text_from_image(image_base64=image_base64)

# Instance globale
google_vision = GoogleVision()
