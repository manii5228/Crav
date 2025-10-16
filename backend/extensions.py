from flask_sqlalchemy import SQLAlchemy
from flask_security import Security
from flask_restful import Api
# --- ✅ START: IMPORT FLASK-MIGRATE ---
from flask_migrate import Migrate
# --- ✅ END: IMPORT FLASK-MIGRATE ---

# Create the extension instances here
db = SQLAlchemy()
security = Security()
api = Api()
# --- ✅ START: INSTANTIATE MIGRATE ---
migrate = Migrate()
# --- ✅ END: INSTANTIATE MIGRATE ---
