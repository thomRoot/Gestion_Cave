"""
Intégration avec l'API Mistral AI
"""
import requests
import json
import base64
from .config import Config

class MistralAI:
    def __init__(self):
        self.api_key = Config.MISTRAL_API_KEY
        self.model = Config.MISTRAL_MODEL
        self.base_url = Config.MISTRAL_BASE_URL
    
    def call_mistral(self, prompt, system_prompt=None, temperature=0.7, max_tokens=500):
        """Appeler l'API Mistral avec un prompt"""
        if not self.api_key:
            return None
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.api_key}'
        }
        
        messages = []
        if system_prompt:
            messages.append({'role': 'system', 'content': system_prompt})
        messages.append({'role': 'user', 'content': prompt})
        
        payload = {
            'model': self.model,
            'messages': messages,
            'temperature': temperature,
            'max_tokens': max_tokens
        }
        
        try:
            response = requests.post(
                f'{self.base_url}chat/completions',
                headers=headers,
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Erreur lors de l'appel à Mistral AI: {e}")
            return None
    
    def analyze_bottle_text(self, extracted_text):
        """Analyser le texte extrait d'une étiquette de vin"""
        if not extracted_text:
            return None
        
        prompt = f"Analyse cette étiquette de vin et extrait les informations :\n\n{extracted_text}"
        
        result = self.call_mistral(
            prompt,
            system_prompt=Config.ANALYSIS_SYSTEM_PROMPT,
            temperature=0.3,
            max_tokens=500
        )
        
        if result and 'choices' in result and len(result['choices']) > 0:
            content = result['choices'][0]['message']['content']
            try:
                # Essayer de parser le JSON
                import re
                # Extraire le JSON du contenu
                json_match = re.search(r'\{[^{}]*\}', content, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group(0))
                return json.loads(content)
            except json.JSONDecodeError:
                # Retourner le contenu brut si ce n'est pas du JSON
                return {'raw_response': content}
        
        return None
    
    def ask_chat_question(self, question, cave_context=None):
        """Poser une question au chat IA"""
        prompt = question
        
        if cave_context:
            prompt = f"{cave_context}\n\nQuestion: {question}"
        
        result = self.call_mistral(
            prompt,
            system_prompt=Config.SYSTEM_PROMPT,
            temperature=0.7,
            max_tokens=1000
        )
        
        if result and 'choices' in result and len(result['choices']) > 0:
            return result['choices'][0]['message']['content']
        
        return None
    
    def ask_chat_question_with_cave(self, question, bottles):
        """Poser une question au chat IA avec le contexte de la cave"""
        cave_context = self.generate_cave_context(bottles)
        return self.ask_chat_question(question, cave_context)
    
    def generate_cave_context(self, bottles):
        """Générer un contexte à partir des bouteilles de la cave"""
        if not bottles:
            return ""
        
        context_parts = []
        for bottle in bottles:
            bottle_info = []
            if bottle.get('name'):
                bottle_info.append(f"Nom: {bottle['name']}")
            if bottle.get('year'):
                bottle_info.append(f"Année: {bottle['year']}")
            if bottle.get('grapes'):
                bottle_info.append(f"Cépage: {bottle['grapes']}")
            if bottle.get('region'):
                bottle_info.append(f"Région: {bottle['region']}")
            if bottle.get('drinkFrom') and bottle.get('drinkTo'):
                bottle_info.append(f"Période: {bottle['drinkFrom']}-{bottle['drinkTo']}")
            
            if bottle_info:
                context_parts.append(" - ".join(bottle_info))
        
        if context_parts:
            return f"Voici les bouteilles dans ma cave:\n" + "\n".join(f"{i+1}. {info}" for i, info in enumerate(context_parts))
        
        return ""
    
    def get_wine_pairing_advice(self, food):
        """Obtenir des conseils d'accords mets-vins"""
        prompt = f"Quel vin recommandes-tu avec ce plat : {food} ? Donne des suggestions précises avec des cépages et des régions."
        return self.ask_chat_question(prompt)
    
    def get_wine_info(self, wine_name):
        """Obtenir des informations sur un vin"""
        prompt = f"Donne-moi des informations détaillées sur ce vin : {wine_name}. Inclus le cépage, la région, les accords mets-vins, et la température de service."
        return self.ask_chat_question(prompt)
    
    def recommend_wine_for_occasion(self, occasion, food=None, budget=None):
        """Recommander un vin pour une occasion"""
        prompt_parts = [f"Recommande un vin pour cette occasion: {occasion}"]
        if food:
            prompt_parts.append(f"Le plat est: {food}")
        if budget:
            prompt_parts.append(f"Le budget est: {budget}")
        
        prompt = " ".join(prompt_parts)
        return self.ask_chat_question(prompt)
    
    def search_wine_by_name(self, name):
        """Chercher un vin par son nom"""
        prompt = f"Donne-moi des informations sur le vin: {name}"
        result = self.ask_chat_question(prompt)
        return result if result else None

# Instance globale
mistral_ai = MistralAI()
