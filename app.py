from flask import Flask, render_template
from backend.extensions import db, security, api, migrate
# ✅ START: IMPORT THE NEW CONFIGS and OS a
from backend.config import LocalDevelopmentConfig, ProductionConfig
import os
# ✅ END: IMPORTS
from backend.security import user_datastore

def createApp():
    app = Flask(__name__,
                static_folder='frontend',
                template_folder='frontend',
                static_url_path='')
    
    # ✅ START: CHOOSE CONFIG BASED ON ENVIRONMENT
    # This checks for an environment variable. Render sets FLASK_ENV to 'production' by default.
    if os.environ.get('FLASK_ENV') == 'production':
        print("Loading Production Configuration...")
        app.config.from_object(ProductionConfig)
    else:
        print("Loading Local Development Configuration...")
        app.config.from_object(LocalDevelopmentConfig)
    # ✅ END: CHOOSE CONFIG

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

# This block is only used for local development and will be ignored by Gunicorn in production.
if (__name__ == '__main__'):
    app.run(debug=True)

