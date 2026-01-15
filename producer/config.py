import os
from dotenv import load_dotenv

load_dotenv()

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
ENDPOINT_URL = os.getenv("ENDPOINT_URL", "http://localhost:4566")

QUEUE_URL = os.getenv(
    "QUEUE_URL", 
    "http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/dev-industrial-telemetry-queue"
)

SIMULATION_INTERVAL_SECONDS = int(os.getenv("SIMULATION_INTERVAL_SECONDS", "2"))
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "1"))

MAX_RETRIES = int(os.getenv("MAX_RETRIES", "5"))
BASE_DELAY_SECONDS = float(os.getenv("BASE_DELAY_SECONDS", "1.0"))