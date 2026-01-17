import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    logger.info(f"Received event: {json.dumps(event)}")
    
    records = event.get("Records", [])
    
    if not records:
        logger.warning("No Records found in event. Is this a test invocation?")
        return {
            'statusCode': 200,
            'body': json.dumps('No messages to process')
        }
    
    for record in records:
        message_body = record.get("body", "")
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