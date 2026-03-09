import boto3
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

AWS_REGION = os.getenv("AWS_REGION")
TABLE_NAME = os.getenv("DYNAMODB_TABLE", "websocket-connections")

dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
table = dynamodb.Table(TABLE_NAME)

def handler(event, context):
    connection_id = event.get('requestContext', {}).get('connectionId')
    logger.info(f"Nova conexão detetada: {connection_id}")
    
    try:
        table.put_item(Item={'connectionId': connection_id})
        logger.info("Conexão guardada no DynamoDB com sucesso.")
        return {'statusCode': 200, 'body': 'Connected'}
    except Exception as e:
        logger.error(f"Erro ao guardar conexão: {e}")
        return {'statusCode': 500, 'body': str(e)}
