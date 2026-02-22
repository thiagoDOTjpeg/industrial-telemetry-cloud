import boto3
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ENDPOINT_URL = "http://localhost.localstack.cloud:4566"

dynamodb = boto3.resource('dynamodb', endpoint_url=ENDPOINT_URL)
table = dynamodb.Table('websocket-connections')

def handler(event, context):
    connection_id = event.get('requestContext', {}).get('connectionId')
    logger.info(f"Nova conexão detetada: {connection_id}")
    
    try:
        table.put_item(Item={'connectionId': connection_id})
        logger.info("Conexão guardada no DynamoDB com sucesso.")
        return {'statusCode': 200, 'body': 'Connected'}
    except Exception as e:
        logger.error(f"Erro ao guardar conexão: {e}")
        # Se falhar aqui, o socket fecha com 403/1006
        return {'statusCode': 500, 'body': str(e)}