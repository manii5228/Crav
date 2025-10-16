from flask import Flask, render_template
from backend.extensions import db, security, api, migrate
from backend.config import LocalDevelopmentConfig, ProductionConfig
from backend.security import user_datastore
import os
from whitenoise import WhiteNoise

def createApp():
    # ✅ START: THE FIX IS HERE
    # By setting static_folder=None, we completely disable Flask's
    # built-in static file handling, preventing any conflicts.
    app = Flask(__name__,
                static_folder=None,
                template_folder='frontend')
    # ✅ END: THE FIX
    
    # Automatically selects the correct config
    if os.environ.get('FLASK_ENV') == 'production':
        app.config.from_object(ProductionConfig)
    else:
        app.config.from_object(LocalDevelopmentConfig)

    # Initialize extensions with the app
    db.init_app(app)
    api.init_app(app)
    migrate.init_app(app, db)
    
    security.init_app(app, user_datastore) 
    app.app_context().push()

    with app.app_context():
        from backend import routes

    return app

app = createApp()

# Now, WhiteNoise is given full and explicit control.
# It will serve files from the 'frontend' directory as the web root '/'.
app.wsgi_app = WhiteNoise(app.wsgi_app, root='frontend/')


# This block is only used for local development and is ignored by Gunicorn on Render
if (__name__ == '__main__'):
    app.run(debug=True)

