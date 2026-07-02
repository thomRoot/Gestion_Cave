#!/usr/bin/env python3
"""
Script to run the Flask application for Ma Cave à Vin
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the python_server directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'python_server'))

from python_server.app import app

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting Flask server on port {port}")
    print(f"Access the application at: http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
