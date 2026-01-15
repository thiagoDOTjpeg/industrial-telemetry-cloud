import logging
import localstack_client.session as boto3
from localstack_client.patch import enable_local_endpoints
import json
import uuid
from datetime import datetime
import random

logging.basicConfig(level=logging.INFO, format="%(asctime)s: %(levelname)s: %(message)s")
logger = logging.getLogger()

enable_local_endpoints()
sqs_client = boto3.client("sqs")

def simulate_telemetry():
    return {
        "machine_id": str(uuid.uuid4()),
        "timestamp": datetime.now().isoformat(),
        "vibration_level": round(random.uniform(0.1, 5.0), 2),
        "temperature": round(random.uniform(20.0, 85.0), 2),
        "status": random.choice(["OPERATIONAL", "OPERATIONAL", "WARNING"]) 
    }

def send_telemetry(queue_url):
    data = simulate_telemetry()
    
    try:
        response = sqs_client.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(data),
            MessageAttributes={
                "DataType": {
                    "DataType": "String",
                    "StringValue": "TelemetryData"
                }
            }
        )
        logger.info(f"Telemetry sent: {data['machine_id']} - Status: {data['status']}")
        return response
    except Exception as e:
        logger.error(f"Error sending to SQS: {e}")

if __name__ == "__main__":
    QUEUE_URL = "http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/dev-industrial-telemetry-queue"
    
    for _ in range(5):
        send_telemetry(QUEUE_URL)