from flask import Flask, render_template
from backend.extensions import db, security, api,migrate
from backend.config import LocalDevelopmentConfig
from backend.security import user_datastore # <-- IMPORT the datastore

def createApp():
    app = Flask(__name__,
                static_folder='frontend',
                template_folder='frontend',
                static_url_path='')
    
    app.config.from_object(LocalDevelopmentConfig)

    # Initialize extensions with the app
    db.init_app(app)
    api.init_app(app)
    migrate.init_app(app, db)  # <-- INITIALIZE Flask-Migrate
    
    # Use the datastore imported from security.py
    security.init_app(app, user_datastore) 
    app.app_context().push()

    with app.app_context():
        from backend import routes

    return app

app = createApp()

if (__name__ == '__main__'):
    app.run(debug=True)