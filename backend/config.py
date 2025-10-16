class Config():
    DEBUG = False
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class LocalDevelopmentConfig(Config):
    SQLALCHEMY_DATABASE_URI = "sqlite:///database.sqlite3"
    DEBUG = True
    SECURITY_PASSWORD_HASH = 'bcrypt'
    SECURITY_PASSWORD_SALT = 'thisshouldbekeptsecret'
    SECRET_KEY = "shouldbekeyveryhidden"
    SECURITY_TOKEN_AUTHENTICATION_HEADER = 'Authentication-Token'
    
    # --- ADD/CONFIRM THESE LINES ---
    # This tells Flask-Security to not use sessions, which is perfect for an API.
    SECURITY_SESSION_COOKIE = False 
    # This tells Flask-Security to return a JSON 401 error for unauthenticated API requests
    # instead of redirecting. This is the main fix.
    SECURITY_REDIRECT_BEHAVIOR = "spa" 
    
    WTF_CSRF_ENABLED = False

