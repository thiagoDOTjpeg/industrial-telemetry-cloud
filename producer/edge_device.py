import logging
import localstack_client.session as boto3
from localstack_client.patch import enable_local_endpoints
import json
import uuid
from datetime import datetime
import random
import time

from config import QUEUE_URL, SIMULATION_INTERVAL_SECONDS, BATCH_SIZE

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

def send_telemetry():
    data = simulate_telemetry()
    
    try:
        response = sqs_client.send_message(
            QueueUrl=QUEUE_URL,
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
    logger.info(f"Starting telemetry producer - Queue: {QUEUE_URL}")
    logger.info(f"Batch size: {BATCH_SIZE} | Interval: {SIMULATION_INTERVAL_SECONDS}s")
    
    while True:
        for _ in range(BATCH_SIZE):
            send_telemetry()
        time.sleep(SIMULATION_INTERVAL_SECONDS)