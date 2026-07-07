"""
Intégration EasyOCR pour la reconnaissance de texte dans les images (OCR)
Alternative gratuite et locale à Google Vision
"""
import os
import base64
from io import BytesIO
from PIL import Image
import numpy as np


class EasyOCR:
    """
    Classe pour l'extraction de texte depuis des images utilisant EasyOCR
    """
    
    def __init__(self):
        self.reader = None
        self._init_reader()
    
    def _init_reader(self):
        """Initialiser le lecteur EasyOCR"""
        try:
            import easyocr
            # Initialiser avec français et anglais pour les étiquettes de vin
            self.reader = easyocr.Reader(['fr', 'en'])
            print("✅ EasyOCR initialisé avec succès (FR + EN)")
        except ImportError:
            print("⚠️  EasyOCR non installé. Installation en cours...")
            try:
                import subprocess
                import sys
                subprocess.check_call([sys.executable, "-m", "pip", "install", "easyocr"])
                import easyocr
                self.reader = easyocr.Reader(['fr', 'en'])
                print("✅ EasyOCR installé et initialisé")
            except Exception as e:
                print(f"❌ Impossible d'installer EasyOCR: {e}")
                self.reader = None
        except Exception as e:
            print(f"❌ Erreur lors de l'initialisation d'EasyOCR: {e}")
            self.reader = None
    
    def extract_text_from_image(self, image_path=None, image_base64=None):
        """
        Extraire du texte d'une image
        
        Args:
            image_path: Chemin vers le fichier image
            image_base64: Image encodée en base64
            
        Returns:
            Texte extrait ou None si erreur
        """
        if not self.reader:
            print("⚠️  EasyOCR non disponible")
            return None
        
        try:
            # Charger l'image
            if image_base64:
                # Si c'est une data URL, extraire la partie base64
                if image_base64.startswith('data:image/'):
                    image_base64 = image_base64.split(',')[1]
                
                # Décoder l'image
                image_data = base64.b64decode(image_base64)
                image = Image.open(BytesIO(image_data))
            elif image_path and os.path.exists(image_path):
                image = Image.open(image_path)
            else:
                print("⚠️  Aucune image valide fournie")
                return None
            
            # Convertir en numpy array (attendu par EasyOCR)
            image_np = np.array(image)
            
            # Extraire le texte
            results = self.reader.readtext(image_np)
            
            # Combiner tous les textes détectés
            if results:
                extracted_text = "\n".join([result[1] for result in results])
                print(f"✅ EasyOCR - Texte extrait: {extracted_text[:200]}...")
                return extracted_text
            else:
                print("⚠️  EasyOCR - Aucun texte détecté")
                return None
                
        except Exception as e:
            print(f"❌ Erreur EasyOCR: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def extract_text_from_base64(self, image_base64):
        """Extraire du texte d'une image en base64"""
        return self.extract_text_from_image(image_base64=image_base64)


# Instance globale
easy_ocr = EasyOCR()
