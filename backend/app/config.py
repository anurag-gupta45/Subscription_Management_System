import os

class Settings:
    PROJECT_NAME: str = "Brightloop Subscription Management System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "brightloop_super_secret_jwt_key_2026_xyz!@#")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24            
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./subscription_system.db")

settings = Settings()

