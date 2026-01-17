import json
import logging

logger = logging.getLogger();

def lambda_handler(event, context):
  for record in event["Records"]:
    message_body = record["body"]
    logger.info(f"Processing message body: {message_body}")

    try:
        message_data = json.loads(message_body)
        logger.info(f"Message data: {message_data}")
    except json.JSONDecodeError:
        logger.info("Message body is not a JSON string, treating as plain text.")
        
  return {
      'statusCode': 200,
      'body': json.dumps('Messages processed successfully')
  }
