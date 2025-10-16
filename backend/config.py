import os

# Base configuration class with settings common to all environments
class Config():
    DEBUG = False
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Use environment variables for secrets with fallback for local development
    SECRET_KEY = os.environ.get('SECRET_KEY', 'a-strong-default-secret-key-for-dev')
    SECURITY_PASSWORD_SALT = os.environ.get('SECURITY_PASSWORD_SALT', 'a-strong-default-salt-for-dev')
    
    SECURITY_PASSWORD_HASH = 'bcrypt'
    SECURITY_TOKEN_AUTHENTICATION_HEADER = 'Authentication-Token'
    SECURITY_SESSION_COOKIE = False 
    SECURITY_REDIRECT_BEHAVIOR = "spa" 
    WTF_CSRF_ENABLED = False

# Configuration for local development using SQLite
class LocalDevelopmentConfig(Config):
    SQLALCHEMY_DATABASE_URI = "sqlite:///../instance/database.sqlite3" # Adjusted path for instance folder
    DEBUG = True

# ✅ START: ADDED PRODUCTION CONFIG
# This configuration will be used when deploying to Render
class ProductionConfig(Config):
    # Render provides the database URL in an environment variable called DATABASE_URL.
    # The replace() call is a necessary fix for SQLAlchemy 2.x compatibility.
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', '').replace('postgres://', 'postgresql://')
    DEBUG = False
# ✅ END: ADDED PRODUCTION CONFIG

