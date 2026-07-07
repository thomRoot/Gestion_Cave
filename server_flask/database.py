"""
Gestion de la base de données SQLite pour Ma Cave à Vin
"""
import sqlite3
import os
from pathlib import Path

# Chemin vers la base de données
DB_NAME = 'cave.db'

def get_db_path():
    """Trouver un chemin valide pour la base de données"""
    possible_paths = [
        # 1. Chemin standard (local)
        os.path.join(os.path.dirname(__file__), '../data', DB_NAME),
        # 2. Chemin absolu dans /workspace
        '/workspace/thomRoot__Gestion_Cave/data/cave.db',
        # 3. Dossier temporaire (pour Docker/NAS)
        os.path.join(os.path.dirname(__file__), '../cave.db'),
        # 4. Dossier courant
        DB_NAME,
        # 5. Dossier /tmp (pour systèmes restreints)
        '/tmp/cave.db'
    ]
    
    # Trouver le premier chemin valide
    for db_path in possible_paths:
        try:
            db_dir = os.path.dirname(db_path) if os.path.dirname(db_path) else '.'
            if db_dir and not os.path.exists(db_dir):
                os.makedirs(db_dir, exist_ok=True)
            # Tester si on peut écrire dans le dossier
            test_file = os.path.join(db_dir, '.write_test')
            with open(test_file, 'w') as f:
                f.write('test')
            os.remove(test_file)
            return db_path
        except Exception:
            # Essayer le chemin suivant
            continue
    
    # Si aucun chemin ne fonctionne, utiliser :memory: (base en mémoire)
    print("⚠️ Aucun chemin valide trouvé pour la base de données, utilisation de la mémoire temporaire")
    return ':memory:'

DB_PATH = get_db_path()

def get_db():
    """Obtenir une connexion à la base de données"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    """Initialiser la base de données et créer les tables si nécessaire"""
    print(f"Tentative de connexion à la base de données : {DB_PATH}")
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Créer les tables si elles n'existent pas
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS cave_config (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                rows INTEGER NOT NULL,
                cols INTEGER NOT NULL,
                configured BOOLEAN DEFAULT 0
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS bottles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                row INTEGER NOT NULL,
                col INTEGER NOT NULL,
                name TEXT,
                year INTEGER,
                grapes TEXT,
                region TEXT,
                drinkFrom INTEGER,
                drinkTo INTEGER,
                foodPairing TEXT,
                temperature TEXT,
                photo TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Vérifier si la cave est déjà configurée
        cursor.execute("SELECT * FROM cave_config LIMIT 1")
        config = cursor.fetchone()
        
        if not config:
            # Initialiser avec une configuration par défaut
            cursor.execute("INSERT INTO cave_config (rows, cols, configured) VALUES (5, 10, 0)")
            conn.commit()
        
        print(f"Connecté à la base de données SQLite ({DB_PATH}).")
        
    except Exception as e:
        print(f"Erreur lors de l'initialisation de la base de données : {e}")
        print("Essayez de créer manuellement le dossier 'data/' avec : mkdir -p data && chmod 755 data")
    finally:
        conn.close()

def save_cave_config(rows, cols):
    """Sauvegarder la configuration de la cave"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "UPDATE cave_config SET rows = ?, cols = ?, configured = 1",
            (rows, cols)
        )
        conn.commit()
        return True
    except Exception as e:
        print(f"Erreur lors de la sauvegarde de la configuration : {e}")
        return False
    finally:
        conn.close()

def get_cave_config():
    """Récupérer la configuration de la cave"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT * FROM cave_config LIMIT 1")
        config = cursor.fetchone()
        return dict(config) if config else None
    except Exception as e:
        print(f"Erreur lors de la récupération de la configuration : {e}")
        return None
    finally:
        conn.close()

def save_bottle(bottle_data):
    """Ajouter ou mettre à jour une bouteille"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        row = bottle_data.get('row')
        col = bottle_data.get('col')
        
        # Vérifier si une bouteille existe déjà à cet emplacement
        cursor.execute(
            "SELECT * FROM bottles WHERE row = ? AND col = ?",
            (row, col)
        )
        existing_bottle = cursor.fetchone()
        
        if existing_bottle:
            # Mettre à jour la bouteille existante
            cursor.execute('''
                UPDATE bottles SET
                    name = ?,
                    year = ?,
                    grapes = ?,
                    region = ?,
                    drinkFrom = ?,
                    drinkTo = ?,
                    foodPairing = ?,
                    temperature = ?,
                    photo = ?
                WHERE row = ? AND col = ?
            ''', (
                bottle_data.get('name'),
                bottle_data.get('year'),
                bottle_data.get('grapes'),
                bottle_data.get('region'),
                bottle_data.get('drinkFrom'),
                bottle_data.get('drinkTo'),
                bottle_data.get('foodPairing'),
                bottle_data.get('temperature'),
                bottle_data.get('photo'),
                row,
                col
            ))
        else:
            # Ajouter une nouvelle bouteille
            cursor.execute('''
                INSERT INTO bottles
                (row, col, name, year, grapes, region, drinkFrom, drinkTo, foodPairing, temperature, photo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                row,
                col,
                bottle_data.get('name'),
                bottle_data.get('year'),
                bottle_data.get('grapes'),
                bottle_data.get('region'),
                bottle_data.get('drinkFrom'),
                bottle_data.get('drinkTo'),
                bottle_data.get('foodPairing'),
                bottle_data.get('temperature'),
                bottle_data.get('photo')
            ))
        
        conn.commit()
        return True
    except Exception as e:
        print(f"Erreur lors de la sauvegarde de la bouteille : {e}")
        return False
    finally:
        conn.close()

def get_all_bottles():
    """Récupérer toutes les bouteilles"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT * FROM bottles")
        bottles = cursor.fetchall()
        return [dict(bottle) for bottle in bottles]
    except Exception as e:
        print(f"Erreur lors de la récupération des bouteilles : {e}")
        return []
    finally:
        conn.close()

def delete_bottle(row, col):
    """Supprimer une bouteille"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute("DELETE FROM bottles WHERE row = ? AND col = ?", (row, col))
        conn.commit()
        return True
    except Exception as e:
        print(f"Erreur lors de la suppression de la bouteille : {e}")
        return False
    finally:
        conn.close()

def reset_database():
    """Réinitialiser la base de données"""
    try:
        if os.path.exists(DB_PATH) and DB_PATH != ':memory:':
            os.remove(DB_PATH)
            # Re-créer les tables
            init_database()
            return True
        return False
    except Exception as e:
        print(f"Erreur lors de la réinitialisation de la base de données : {e}")
        return False
