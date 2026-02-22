import json
import logging
import psycopg2
import boto3
import os
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger()
logger.setLevel(logging.INFO)

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
DB_ENDPOINT = os.getenv("DB_ENDPOINT")
DB_PORT = os.getenv("DB_PORT", "4510")
DB_USER = os.getenv("DB_USER")
DB_NAME = os.getenv("DB_NAME")

rds_client = boto3.client('rds', region_name=AWS_REGION)
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('websocket-connections')
api_client = boto3.client('apigatewaymanagementapi', endpoint_url="http://localhost:4566")

DB_HOST = DB_ENDPOINT.split(':')[0]

def get_auth_token():
    return rds_client.generate_db_auth_token(
        DBHostname=DB_HOST, Port=int(DB_PORT), DBUsername=DB_USER, Region=AWS_REGION
    )

def send_to_conn(conn_id, payload):
    try:
        api_client.post_to_connection(ConnectionId=conn_id, Data=payload)
    except Exception:
        table.delete_item(Key={'connectionId': conn_id})

def lambda_handler(event, context):
    token = get_auth_token()
    db_conn = None
    
    try:
        db_conn = psycopg2.connect(
            host=DB_HOST, database=DB_NAME, user=DB_USER,
            password=token, port=DB_PORT, connect_timeout=5, sslmode='disable'
        )
        cur = db_conn.cursor()
        
        records = event.get("Records", [])
        telemetry_batch = []
        
        for record in records:
            data = json.loads(record.get("body", ""))
            telemetry_batch.append(data)
            cur.execute(
                "INSERT INTO telemetry (machine_id, temperature, status) VALUES (%s, %s, %s)",
                (data['machine_id'], data['temperature'], data['status'])
            )
            
        db_conn.commit()
        cur.close()

        if telemetry_batch:
            payload = json.dumps(telemetry_batch)
            connections = table.scan(ProjectionExpression="connectionId").get('Items', [])
            with ThreadPoolExecutor(max_workers=10) as executor:
                for item in connections:
                    executor.submit(send_to_conn, item['connectionId'], payload)
                
        return {'statusCode': 200, 'body': 'Sucesso'}
    except Exception as e:
        logger.error(f"Erro: {e}")
        raise e
    finally:
        if db_conn: db_conn.close()