"""
Analyseur de bouteilles de vin avec Mistral AI et Google Vision
"""
import json
import re


class MistralAnalyzer:
    def __init__(self, mistral_ai_instance, google_vision_instance, config):
        self.mistral = mistral_ai_instance
        self.google_vision = google_vision_instance
        self.config = config
        
        # Prompts système
        self.SYSTEM_PROMPT = """Tu es un expert en vin et en gestion de cave à vin. 
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
        
        self.ANALYSIS_SYSTEM_PROMPT = """Tu es un expert en reconnaissance d'étiquettes de vin. 
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
    
    def get_fallback_bottle_info(self, error_message=None):
        """Retourner des informations par défaut pour une bouteille"""
        return {
            'name': None,
            'year': None,
            'grapes': None,
            'region': None,
            'appellation': None,
            'producer': None,
            'country': None,
            'alcohol': None,
            'drinkFrom': None,
            'drinkTo': None,
            'foodPairing': None,
            'temperature': None,
            'analysisMethod': 'Fallback',
            'extractedText': error_message or 'Aucune information disponible',
            'requiresManualInput': True,
            'missingFields': {'name': True, 'year': True}
        }
    
    def clean_extracted_text(self, text):
        """Nettoyer le texte extrait"""
        if not text:
            return ''
        
        # Supprimer les caractères non imprimables
        text = ''.join(char for char in text if char.isprintable() or char.isspace())
        
        # Remplacer les espaces multiples par un seul espace
        text = re.sub(r'\s+', ' ', text)
        
        # Supprimer les espaces au début et à la fin
        text = text.strip()
        
        return text
    
    def analyze_bottle_with_mistral_only(self, image_path=None, is_base64=False):
        """Analyser une bouteille avec Mistral AI uniquement (sans OCR)"""
        try:
            # Si c'est une image base64, essayer de l'analyser directement
            if is_base64 and image_path:
                # Pour l'instant, on ne peut pas analyser directement l'image avec Mistral
                # On retourne des informations par défaut
                return self.get_fallback_bottle_info('Analyse directe non disponible')
            
            # Sinon, retourner des informations par défaut
            return self.get_fallback_bottle_info('Aucune image fournie')
            
        except Exception as e:
            print(f"Erreur lors de l'analyse avec Mistral uniquement: {e}")
            return self.get_fallback_bottle_info(str(e))
    
    def analyze_bottle_with_two_step_process(self, image_path=None, is_base64=False, manual_data=None, correct_name=True):
        """Analyser une bouteille en deux étapes : OCR puis Mistral"""
        try:
            extracted_text = None
            
            # Étape 1 : Extraire le texte avec Google Vision
            if image_path:
                if is_base64:
                    extracted_text = self.google_vision.extract_text_from_base64(image_path)
                else:
                    extracted_text = self.google_vision.extract_text_from_image(image_path)
            
            # Nettoyer le texte extrait
            if extracted_text:
                extracted_text = self.clean_extracted_text(extracted_text)
            
            # Étape 2 : Analyser avec Mistral
            if extracted_text:
                analysis = self.mistral.analyze_bottle_text(extracted_text)
                if analysis:
                    # Fusionner avec les données manuelles si fournies
                    if manual_data:
                        for key, value in manual_data.items():
                            if value and key in analysis:
                                analysis[key] = value
                    
                    # Formater le résultat
                    result = {
                        'name': analysis.get('name'),
                        'year': analysis.get('year'),
                        'grapes': analysis.get('grapes'),
                        'region': analysis.get('region') or analysis.get('appellation'),
                        'appellation': analysis.get('appellation'),
                        'producer': analysis.get('producer'),
                        'country': analysis.get('country'),
                        'alcohol': analysis.get('alcohol'),
                        'drinkFrom': None,
                        'drinkTo': None,
                        'foodPairing': None,
                        'temperature': None,
                        'analysisMethod': 'Google Vision + Mistral',
                        'extractedText': extracted_text,
                        'requiresManualInput': False,
                        'missingFields': None,
                        'partialData': None
                    }
                    
                    # Déterminer les champs manquants
                    missing_fields = {}
                    if not result['name']:
                        missing_fields['name'] = True
                    if not result['year']:
                        missing_fields['year'] = True
                    
                    result['requiresManualInput'] = bool(missing_fields)
                    result['missingFields'] = missing_fields if missing_fields else None
                    
                    return result
            
            # Si on arrive ici, l'analyse a échoué
            return self.get_fallback_bottle_info('Échec de l\'analyse OCR')
            
        except Exception as e:
            print(f"Erreur lors de l'analyse en deux étapes: {e}")
            return self.get_fallback_bottle_info(str(e))
    
    def analyze_with_manual_text(self, manual_data):
        """Analyser avec du texte manuel"""
        try:
            # Construire un texte à partir des données manuelles
            text_parts = []
            if manual_data.get('name'):
                text_parts.append(f"Nom: {manual_data['name']}")
            if manual_data.get('year'):
                text_parts.append(f"Année: {manual_data['year']}")
            if manual_data.get('grapes'):
                text_parts.append(f"Cépage: {manual_data['grapes']}")
            if manual_data.get('region'):
                text_parts.append(f"Région: {manual_data['region']}")
            
            if not text_parts:
                return self.get_fallback_bottle_info('Aucune donnée manuelle fournie')
            
            extracted_text = "\n".join(text_parts)
            
            # Analyser avec Mistral
            analysis = self.mistral.analyze_bottle_text(extracted_text)
            
            if analysis:
                # Fusionner avec les données manuelles
                for key, value in manual_data.items():
                    if value and key in analysis:
                        analysis[key] = value
                
                result = {
                    'name': analysis.get('name') or manual_data.get('name'),
                    'year': analysis.get('year') or manual_data.get('year'),
                    'grapes': analysis.get('grapes') or manual_data.get('grapes'),
                    'region': analysis.get('region') or analysis.get('appellation') or manual_data.get('region'),
                    'appellation': analysis.get('appellation'),
                    'producer': analysis.get('producer'),
                    'country': analysis.get('country'),
                    'alcohol': analysis.get('alcohol'),
                    'drinkFrom': None,
                    'drinkTo': None,
                    'foodPairing': None,
                    'temperature': None,
                    'analysisMethod': 'Analyse texte manuel',
                    'extractedText': extracted_text
                }
                return result
            
            # Retourner les données manuelles si l'analyse échoue
            return {
                'name': manual_data.get('name'),
                'year': manual_data.get('year'),
                'grapes': manual_data.get('grapes'),
                'region': manual_data.get('region'),
                'analysisMethod': 'Données manuelles',
                'extractedText': extracted_text
            }
            
        except Exception as e:
            print(f"Erreur lors de l'analyse avec texte manuel: {e}")
            return self.get_fallback_bottle_info(str(e))
    
    def generate_fallback_response_with_cave(self, question, bottles):
        """Générer une réponse de secours avec le contexte de la cave"""
        if not bottles:
            return "Je n'ai pas accès à votre cave pour répondre à cette question."
        
        # Analyser la question pour comprendre l'intention
        question_lower = question.lower()
        
        # Si la question concerne des recommandations
        if any(word in question_lower for word in ['recommande', 'conseil', 'quel vin', 'suggère', 'propose']):
            # Filtrer les bouteilles prêtes à boire
            ready_to_drink = [b for b in bottles 
                           if b.get('drinkFrom') and b.get('drinkTo')
                           and b['drinkFrom'] <= 2026 <= b['drinkTo']]
            
            if ready_to_drink:
                return f"Je vous recommande l'un de ces vins de votre cave qui sont prêts à boire : {', '.join(b['name'] for b in ready_to_drink[:3])}"
            else:
                return f"Dans votre cave, vous avez ces vins : {', '.join(b['name'] for b in bottles[:5])}. Lequel souhaitez-vous déguster ?"
        
        # Si la question concerne un type de vin spécifique
        if any(word in question_lower for word in ['rouge', 'blanc', 'rosé', 'champagne']):
            wine_type = 'rouge' if 'rouge' in question_lower else 'blanc' if 'blanc' in question_lower else 'rosé' if 'rosé' in question_lower else 'champagne'
            matching = [b for b in bottles if wine_type in (b.get('name', '') + b.get('grapes', '')).lower()]
            if matching:
                return f"Dans votre cave, vous avez ces vins {wine_type}s : {', '.join(b['name'] for b in matching)}"
        
        # Réponse générique
        return f"Dans votre cave, vous avez {len(bottles)} bouteilles. Je peux vous aider à choisir un vin si vous me donnez plus de détails."
