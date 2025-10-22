# --- Core Flask App Setup ---
from flask import Flask, render_template, send_from_directory, jsonify
from backend.extensions import db, security, api, migrate
from backend.config import LocalDevelopmentConfig, ProductionConfig
from backend.security import user_datastore
import os
from flask_cors import CORS # Keep CORS for flexibility, although not strictly needed in unified model

def createApp():
    # --- CRITICAL FOR UNIFIED MODEL ---
    # Configure Flask to find static files and templates in the 'frontend' folder
    app = Flask(__name__,
                static_folder='../frontend',      # Path to static assets relative to app.py
                template_folder='../frontend',    # Path to index.html relative to app.py
                static_url_path='')             # Serve static files from the root URL (e.g., /app.js)

    # Allow all origins for CORS (can be restricted later if needed)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Load configuration based on environment
    if os.environ.get('FLASK_ENV') == 'production':
        app.config.from_object(ProductionConfig)
    else:
        app.config.from_object(LocalDevelopmentConfig)
        print(" * Running in Local Development Mode") # Helpful log for local

    # Initialize extensions
    db.init_app(app)
    api.init_app(app)
    migrate.init_app(app, db)
    security.init_app(app, user_datastore)
    app.app_context().push() # Ensure context is available for imports

    # Import routes AFTER app and extensions are initialized
    with app.app_context():
        from backend import routes

    # --- Add a simple health check endpoint ---
    @app.route('/health')
    def health_check():
        return jsonify({"status": "healthy"}), 200

    return app

# --- App Instantiation ---
app = createApp()

# --- Development Server Execution ---
# This block is only used when running `python app.py` locally.
# Gunicorn ignores this when running in production.
if (__name__ == '__main__'):
    # Run with debug=True for local development ease
    # Port 5000 is standard for Flask dev server
    app.run(debug=True, port=10000)
