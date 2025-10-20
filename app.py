from flask import Flask
from backend.extensions import db, security, api, migrate
from backend.config import LocalDevelopmentConfig, ProductionConfig
from backend.security import user_datastore
import os
from flask_cors import CORS

def createApp():
    # This now correctly initializes a pure Flask application.
    app = Flask(__name__)
    
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    if os.environ.get('FLASK_ENV') == 'production':
        app.config.from_object(ProductionConfig)
    else:
        app.config.from_object(LocalDevelopmentConfig)

    db.init_app(app)
    api.init_app(app)
    migrate.init_app(app, db)
    security.init_app(app, user_datastore) 
    app.app_context().push()

    with app.app_context():
        from backend import routes

    return app

app = createApp()

if (__name__ == '__main__'):
    app.run(debug=True, port=5000)

