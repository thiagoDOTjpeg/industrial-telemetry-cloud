import logging
import localstack_client.session as boto3
from localstack_client.patch import enable_local_endpoints
import json
from datetime import datetime
import random
import time

from config import QUEUE_URL, SIMULATION_INTERVAL_SECONDS, BATCH_SIZE

logging.basicConfig(level=logging.INFO, format="%(asctime)s: %(levelname)s: %(message)s")
logger = logging.getLogger()

enable_local_endpoints()
sqs_client = boto3.client("sqs")

MACHINE_POOL = [f"MACHINE-{str(i).zfill(3)}" for i in range(1, 6)]

def simulate_telemetry(machine_id):
    temp = round(random.uniform(20.0, 95.0), 2)
    vib = round(random.uniform(0.1, 6.0), 2)
    
    if temp > 85 or vib > 5.0:
        status = "CRITICAL"
    elif temp > 70 or vib > 3.5:
        status = "WARNING"
    else:
        status = "OPERATIONAL"
        
    return {
        "machine_id": machine_id,
        "timestamp": datetime.now().isoformat(),
        "vibration_level": vib,
        "temperature": temp,
        "status": status 
    }

def send_telemetry(machine_id):
    data = simulate_telemetry(machine_id)
    try:
        sqs_client.send_message(
            QueueUrl=QUEUE_URL,
            MessageBody=json.dumps(data)
        )
        logger.info(f"Sent: {machine_id} | Temp: {data['temperature']} | Status: {data['status']}")
    except Exception as e:
        logger.error(f"Error: {e}")

if __name__ == "__main__":
    while True:
        for mid in MACHINE_POOL:
            send_telemetry(mid)
        time.sleep(SIMULATION_INTERVAL_SECONDS)