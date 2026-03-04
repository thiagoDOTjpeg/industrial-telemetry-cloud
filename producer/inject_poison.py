import json
import boto3
from config import QUEUE_URL

sqs = boto3.client("sqs", endpoint_url="http://localhost:4566")

poison_pill = {
    "machine_id": "POISON_PILL_TEST",
    "temperature": 999.9,
    "status": "CRITICAL",
    "vibration_level": 99.9,
    "timestamp": "2026-03-04T12:00:00"
}

print("Injetando Poison Pill na fila...")
sqs.send_message(
    QueueUrl=QUEUE_URL,
    MessageBody=json.dumps(poison_pill)
)
print("Enviado. Verifique os logs da Lambda e a DLQ.")