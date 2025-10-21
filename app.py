from flask import Flask
from backend.extensions import db, security, api, migrate
from backend.config import LocalDevelopmentConfig, ProductionConfig
from backend.security import user_datastore
import os
from flask_cors import CORS # ✅ IMPORT CORS

def createApp():
    # We remove the static_folder and template_folder arguments from the Flask constructor.
    # Nginx will be responsible for serving the frontend files directly.
    app = Flask(__name__)
    
    # ✅ INITIALIZE CORS
    # This allows your Vue.js frontend (running on a different domain/port)
    # to make API requests to your Flask backend.
    CORS(app, resources={r"/api/*": {"origins": "*"}}) # For production, you can restrict origins

    # Automatically selects the correct config (Production on server, Local otherwise)
    if os.environ.get('FLASK_ENV') == 'production':
        app.config.from_object(ProductionConfig)
    else:
        app.config.from_object(LocalDevelopmentConfig)

    # Initialize extensions with the app
    db.init_app(app)
    api.init_app(app)
    migrate.init_app(app, db)
    
    # Use the datastore imported from security.py
    security.init_app(app, user_datastore) 
    app.app_context().push()

    with app.app_context():
        from backend import routes

    return app

app = createApp()

# The WhiteNoise wrapper is no longer needed. Nginx is superior for this task.

# This block is only used for local development and is ignored by Gunicorn
if (__name__ == '__main__'):
    # For local development, this now ONLY runs the backend API server.
    app.run(debug=True, port=10000)

