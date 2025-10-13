from flask_sqlalchemy import SQLAlchemy
from flask_security import Security
from flask_restful import Api

# Create the extension instances here
db = SQLAlchemy()
security = Security()
api = Api()