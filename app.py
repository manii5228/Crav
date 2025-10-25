from flask import Flask, send_from_directory
from backend.extensions import db, security, api, migrate
from backend.config import LocalDevelopmentConfig, ProductionConfig
from backend.security import user_datastore
import os
from flask_cors import CORS

def createApp():
    app = Flask(__name__,
                static_folder='frontend',     # Serve files from the 'frontend' directory
                template_folder='frontend',   # Look for index.html in 'frontend'
                static_url_path='')         # Serve static files from root (e.g., /app.js)

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    if os.environ.get('FLASK_ENV') == 'production':
        app.config.from_object(ProductionConfig)
    else:
        app.config.from_object(LocalDevelopmentConfig)

    db.init_app(app)
    api.init_app(app)  # Initializes API
    migrate.init_app(app, db)
    security.init_app(app, user_datastore)
    app.app_context().push()

    # --- This is where your API routes are registered ---
    with app.app_context():
        from backend import routes 

    # --- THIS CATCH-ALL ROUTE IS CRITICAL ---
    # It serves your Vue app (index.html) for any path that is not
    # an API route (/api/...) or a static file (/app.js, /style.css, etc.)
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def catch_all(path):
        # If the path is an API route, let Flask handle it as a 404
        if path.startswith("api/"):
            return "API route not found", 404
        
        # Check if the file exists in the static folder
        static_file_path = os.path.join(app.static_folder, path)
        if os.path.exists(static_file_path):
            return send_from_directory(app.static_folder, path)
        
        # Otherwise, it's a Vue route, so serve the main index.html
        return send_from_directory(app.template_folder, 'index.html')

    return app

app = createApp()

if (__name__ == '__main__'):
    # Use 0.0.0.0 to be accessible in Render
    app.run(host='0.0.0.0', port=10000)
