import os

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
DB_ENDPOINT = os.getenv("DB_ENDPOINT")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_USER = os.getenv("DB_USER", "admin")
DB_NAME = os.getenv("DB_NAME", "postgres")
