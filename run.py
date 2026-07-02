#!/usr/bin/env python3
"""
Script to run the Flask application for Ma Cave à Vin
"""

import os
import sys

# Add the python_app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'python_app'))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Import and run the app
from python_app.app import app

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting Flask server on port {port}")
    print(f"Access the application at: http://localhost:{port}")
    print("Press Ctrl+C to stop the server")
    app.run(host='0.0.0.0', port=port, debug=True)
