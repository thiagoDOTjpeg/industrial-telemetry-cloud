import boto3
import os

table = boto3.resource('dynamodb').Table('websocket-connections')

def handler(event, context):
    connection_id = event.get('requestContext', {}).get('connectionId')
    table.put_item(Item={'connectionId': connection_id})
    return {'statusCode': 200, 'body': 'Connected'}