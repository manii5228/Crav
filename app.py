from flask import Flask, render_template
from backend.extensions import db, security, api, migrate
from backend.config import LocalDevelopmentConfig, ProductionConfig
from backend.security import user_datastore
import os
from whitenoise import WhiteNoise

def createApp():
    app = Flask(__name__,
                static_folder='frontend',
                template_folder='frontend',
                static_url_path='')
    
    # Automatically selects the correct config (Production on Render, Local otherwise)
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

# Wrap the app with WhiteNoise to serve static files in production
# This should be done AFTER the app is created
app.wsgi_app = WhiteNoise(app.wsgi_app)

# This block is only used for local development and is ignored by Gunicorn on Render
if (__name__ == '__main__'):
    app.run(debug=True)


