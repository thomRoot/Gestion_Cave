#!/bin/bash

# Script de démarrage pour le serveur Flask

echo "=========================================="
echo "Ma Cave à Vin - Serveur Flask"
echo "=========================================="
echo ""

# Vérifier Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Erreur : Python 3 n'est pas installé"
    echo "   Installez Python 3 avec : sudo apt install python3"
    exit 1
fi

echo "✅ Python 3 trouvé"

# Vérifier pip
if ! command -v pip3 &> /dev/null; then
    echo "❌ Erreur : pip 3 n'est pas installé"
    echo "   Installez pip avec : sudo apt install python3-pip"
    exit 1
fi

echo "✅ pip 3 trouvé"

# Vérifier les dépendances
 echo "Vérification des dépendances..."
if ! python3 -c "import flask; print('Flask:', flask.__version__)" 2> /dev/null; then
    echo "⚠️  Flask non installé. Installation en cours..."
    pip3 install -r requirements.txt
fi

echo "✅ Toutes les dépendances sont installées"
echo ""

# Vérifier le fichier .env
if [ ! -f .env ]; then
    echo "⚠️  Fichier .env non trouvé. Copie du modèle..."
    cp .env.example .env
    echo "   Vous devez éditer .env et ajouter vos clés API"
    echo ""
fi

echo "Démarrage du serveur Flask..."
echo "Appuyez sur Ctrl+C pour arrêter"
echo ""

# Démarrer le serveur
python3 run_flask.py
