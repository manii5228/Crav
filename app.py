from flask import Flask
from backend.extensions import db, security, api, migrate
from backend.config import LocalDevelopmentConfig, ProductionConfig
from backend.security import user_datastore
import os
from flask_cors import CORS

# Import send_from_directory
from flask import send_from_directory

def createApp():
    # --- ✅ CORRECT CONFIGURATION FOR UNIFIED SERVICE ---
    # Tell Flask where static files (JS, CSS, images) and templates (index.html) live
    app = Flask(__name__,
                static_folder='frontend',      # Serve files from the 'frontend' directory
                template_folder='frontend',    # Look for index.html in the 'frontend' directory
                static_url_path='')           # Serve static files from the root URL (e.g., /app.js)
    # --- ✅ END CORRECTION ---

    CORS(app, resources={r"/api/*": {"origins": "*"}}) # Keep CORS for flexibility

    if os.environ.get('FLASK_ENV') == 'production':
        app.config.from_object(ProductionConfig)
    else:
        app.config.from_object(LocalDevelopmentConfig)

    db.init_app(app)
    api.init_app(app)
    migrate.init_app(app, db)
    security.init_app(app, user_datastore)
    app.app_context().push()

    # --- ✅ SERVE STATIC FILES MANUALLY (More Robust for SPA) ---
    # This handles requests for your JS, CSS, images etc.
    @app.route('/<path:filename>')
    def serve_static(filename):
        return send_from_directory(app.static_folder, filename)
    # --- ✅ END CORRECTION ---

    with app.app_context():
        from backend import routes # Import routes AFTER defining serve_static

    return app

app = createApp()

if (__name__ == '__main__'):
    app.run(debug=True, port=5000)

