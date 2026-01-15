import logging
import boto3
from botocore.exceptions import ClientError
import json

AWS_REGION = "us-east-1"
AWS_ENDPOINT_URL = "http://athens.gritti.dev.br:4566"

logger = logging.getLogger()
logging.basicConfig(level=logging.INFO, format="%(asctime)s: %(levelname)s: %(message)s")

sqs_client = boto3.client("sqs", endpoint_url=AWS_ENDPOINT_URL, region_name=AWS_REGION)

def send_message_queue(queue_url, msg_attributes, msg_body):
  try:
    response = sqs_client.send_message(QueueUrl=queue_url, MessageAttributes=msg_attributes, MessageBody=msg_body)
  except ClientError:
    logger.exception(f"Couldn't send message to the  - {queue_url}.")
    raise
  else:
    return response
  
if __name__ == "__main__":
  QUEUE_URL = "http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/dev-industrial-telemetry-queue"
  MSG_ATTRIBUTES =  {
    "Title": {
      "DataType": "String",
      "StringValue": "Working with SQS in Python using Boto3"
    },
    "Author": {
      "DataType": "String",
      "StringValue": "thiagoDOTjpeg"
    }
  }
  MSG_BODY = "Message sent via SQS"

  msg = send_message_queue(QUEUE_URL, MSG_ATTRIBUTES, MSG_BODY)

  json_msg = json.dumps(msg, ident=4)

  logger.info(f"""
              Message sent to the queue {QUEUE_URL}.
              Message attribues: \n{json_msg}""")