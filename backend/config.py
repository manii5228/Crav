import os
from dotenv import load_dotenv

# Load environment variables from a .env file if it exists (for local development)
load_dotenv()

class Config():
    DEBUG = False
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # ✅ SECURITY BEST PRACTICE: Load secrets from environment variables
    # The second argument is a default value for local development if the variable isn't set.
    SECRET_KEY = os.environ.get('SECRET_KEY', "shouldbekeyveryhidden")
    SECURITY_PASSWORD_SALT = os.environ.get('SECURITY_PASSWORD_SALT', 'thisshouldbekeptsecret')
    
    # Flask-Security settings for a token-based API
    SECURITY_PASSWORD_HASH = 'bcrypt'
    SECURITY_TOKEN_AUTHENTICATION_HEADER = 'Authentication-Token'
    SECURITY_SESSION_COOKIE = False 
    SECURITY_REDIRECT_BEHAVIOR = "spa" 
    WTF_CSRF_ENABLED = False

class LocalDevelopmentConfig(Config):
    # This config uses a simple SQLite database for easy local setup.
    SQLALCHEMY_DATABASE_URI = "sqlite:///../instance/database.sqlite3"
    DEBUG = True

# ✅ START: ADDED PRODUCTION CONFIGURATION
class ProductionConfig(Config):
    # This config is for deploying on a platform like Render.
    # It reads the database connection string from an environment variable.
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', '').replace('postgres://', 'postgresql://')
    DEBUG = False
# ✅ END: ADDED PRODUCTION CONFIGURATION
